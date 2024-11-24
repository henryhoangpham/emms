'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getOperationalClients, getClientCombineStats } from '@/utils/supabase/queries';
import type { OperationalClientData, ClientCombineStatsResponse } from '@/utils/supabase/queries';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_ITEMS_PER_PAGE } from '@/utils/constants';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Check, ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import { Button } from '@/components/ui/button';

const INVOICE_ENTITIES = [
  'All',
  'Arches Corporation (Japan)',
  'ARCHES VIETNAM COMPANY LIMITED',
  'Arches Pte.Ltd (Singapore)'
] as const;

const CONTRACT_TYPES = [
  'All',
  'Pay as you go (project)',
  'Pay as you go (monthly)',
  'Package',
  'Others'
] as const;

const PRIORITY_OPTIONS = [5,4,3,2,1] as const;

interface ClientCombineStatsProps {
  user: User;
}

export default function ClientCombineStats({ user }: ClientCombineStatsProps) {
  const [data, setData] = useState<OperationalClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceEntity, setInvoiceEntity] = useState('All');
  const [contractType, setContractType] = useState('All');
  const { toast } = useToast();
  const supabase = createClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsData, setStatsData] = useState<Record<string, ClientCombineStatsResponse>>({});
  const statsAbortController = useRef<AbortController | null>(null);
  const [selectedPriorities, setSelectedPriorities] = useState<number[]>([]);
  const [prioritySearchOpen, setPrioritySearchOpen] = useState(false);

  const fetchStats = useCallback(async (clientCodes: string[]) => {
    if (statsAbortController.current) {
      statsAbortController.current.abort();
    }

    statsAbortController.current = new AbortController();

    try {
      setStatsLoading(true);
      const stats = await getClientCombineStats(supabase, clientCodes);
      
      const statsRecord = stats.reduce((acc, stat) => {
        acc[stat.client_code] = stat;
        return acc;
      }, {} as Record<string, ClientCombineStatsResponse>);
      
      console.log('statsRecord:', statsRecord);
      setStatsData(statsRecord);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
      } else if (error.name === 'TimeoutError' || error.code === '504') {
        console.error('Request timed out:', error);
        toast({
          title: 'Timeout Error',
          description: 'The request took too long to complete. Please try again.',
          variant: 'destructive',
        });
      } else {
        console.error('Error fetching stats:', error);
        toast({
          title: 'Warning',
          description: 'Failed to load some statistics. The list will continue to display with partial data.',
          variant: 'destructive',
        });
      }
    } finally {
      setStatsLoading(false);
    }
  }, [supabase, toast]);

  const fetchData = useCallback(async (
    skipDebounce: boolean = false,
    currentSearchTerm?: string,
    currentInvoiceEntity?: string,
    currentContractType?: string,
    currentPriorities?: number[]
  ) => {
    try {
      setLoading(true);
      
      const { operationalClients, count } = await getOperationalClients(
        supabase,
        currentPage,
        itemsPerPage,
        currentInvoiceEntity ?? invoiceEntity,
        currentContractType ?? contractType,
        currentSearchTerm ?? searchTerm,
        currentPriorities ?? selectedPriorities
      );
      
      if (operationalClients) {
        setData(operationalClients);
        setTotalItems(count || 0);

        const clientCodes = operationalClients.map(client => client.client_code_name);
        if (clientCodes.length > 0) {
          fetchStats(clientCodes);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch operational clients',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, currentPage, itemsPerPage, searchTerm, invoiceEntity, contractType, selectedPriorities, toast, fetchStats]);

  const debouncedSearch = useCallback((
    fromSearchInput: boolean = false,
    newSearchTerm?: string,
    newInvoiceEntity?: string,
    newContractType?: string,
    newPriorities?: number[]
  ) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchData(true, newSearchTerm, newInvoiceEntity, newContractType, newPriorities);
      if (fromSearchInput && searchInputRef.current) {
        searchInputRef.current.focus();
      }
      searchTimeoutRef.current = undefined;
    }, 1000);
  }, [fetchData]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    debouncedSearch(true, newValue, invoiceEntity, contractType);
  };

  const handleInvoiceEntityChange = (value: string) => {
    setInvoiceEntity(value);
    debouncedSearch(false, searchTerm, value, contractType);
  };

  const handleContractTypeChange = (value: string) => {
    setContractType(value);
    debouncedSearch(false, searchTerm, invoiceEntity, value);
  };

  const handlePrioritySelect = (priority: number) => {
    setSelectedPriorities(current => {
      const newPriorities = current.includes(priority)
        ? current.filter(p => p !== priority)
        : [...current, priority];
      debouncedSearch(false, searchTerm, invoiceEntity, contractType, newPriorities);
      return newPriorities;
    });
  };

  const removePriority = (priority: number) => {
    setSelectedPriorities(current => {
      const newPriorities = current.filter(p => p !== priority);
      debouncedSearch(false, searchTerm, invoiceEntity, contractType, newPriorities);
      return newPriorities;
    });
  };

  useEffect(() => {
    console.log('Initial load');
    fetchData(true);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    console.log('Pagination effect triggered');
    fetchData(true);
  }, [currentPage, itemsPerPage]);

  const getPriorityColor = (priority: number | null) => {
    if (!priority) return '';
    if (priority === 4) return 'bg-red-100';
    if (priority > 4) return 'bg-red-200';
    return '';
  };

  const getStatsForClient = (clientCode: string) => {
    return statsData[clientCode]?.ytd_totals?.stats || {
      iv: '-',
      dbiv: '-',
      cdd: '-',
      dbcdd: '-',
      revenue: '-',
      net_revenue: '-',
      pjt: '-',
      cr: '-'
    };
  };

  // Get all unique months from all clients' data and sort them
  const getAllMonths = useCallback(() => {
    const monthsSet = new Set<string>();
    Object.values(statsData).forEach(clientStats => {
      if (clientStats && clientStats.monthly_data) {
        clientStats.monthly_data.forEach(monthData => {
          if (monthData && monthData.month) {
            monthsSet.add(monthData.month);
          }
        });
      }
    });
    return Array.from(monthsSet).sort((a, b) => {
      if (!a || !b) return 0;
      return b.localeCompare(a);
    }); // Sort in descending order
  }, [statsData]);

  // Format month display
  const formatMonthDisplay = (monthStr: string | null) => {
    if (!monthStr) return 'YTD';
    const year = monthStr.substring(0, 4);
    const month = monthStr.substring(4, 6);
    return `${year}${month}`;
  };

  // Get stats for a specific month and client
  const getMonthStats = (clientCode: string, month: string) => {
    const clientStats = statsData[clientCode];
    if (!clientStats || !clientStats.monthly_data) return null;

    const monthData = clientStats.monthly_data.find(data => data?.month === month);
    return monthData?.stats || null;
  };

  // Get YTD stats for a client
  const getYTDStats = (clientCode: string) => {
    return statsData[clientCode]?.ytd_totals?.stats || null;
  };

  // Function to get alternating background colors for monthly tables
  const getMonthlyTableBgColor = (index: number) => {
    // Alternate between three very subtle background colors
    switch (index % 3) {
      case 0:
        return 'bg-muted/5';
      case 1:
        return 'bg-muted/10';
      case 2:
        return 'bg-muted/15';
      default:
        return '';
    }
  };

  // Function to format number as integer
  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '-';
    return Math.round(num).toLocaleString();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">Client Combine Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="order-1">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Invoice Entity</Label>
                  <Select
                    value={invoiceEntity}
                    onValueChange={handleInvoiceEntityChange}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Invoice Entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {INVOICE_ENTITIES.map((entity) => (
                        <SelectItem key={entity} value={entity} className="text-sm">
                          {entity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label>Contract Type</Label>
                  <Select
                    value={contractType}
                    onValueChange={handleContractTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Contract Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-24">
                  <Label>Priority</Label>
                  <Popover open={prioritySearchOpen} onOpenChange={setPrioritySearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={prioritySearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedPriorities.length === 0 
                          ? "All"
                          : `${selectedPriorities.length}`}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search priorities..." />
                        <CommandEmpty>No priority found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {PRIORITY_OPTIONS.map((priority) => (
                            <CommandItem
                              key={priority}
                              value={priority.toString()}
                              onSelect={() => handlePrioritySelect(priority)}
                            >
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "h-4 w-4 border rounded-sm flex items-center justify-center",
                                  selectedPriorities.includes(priority) ? "bg-primary border-primary" : "border-input"
                                )}>
                                  {selectedPriorities.includes(priority) && 
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                  }
                                </div>
                                {priority}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedPriorities.map((priority) => (
                      <Badge
                        key={priority}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {priority}
                        <button
                          type="button"
                          className="ml-1 hover:bg-muted rounded-full"
                          onClick={() => removePriority(priority)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="order-2">
              <Label>Search</Label>
              <Input
                ref={searchInputRef}
                placeholder="Search Client Code, Client, Client ID..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full text-sm"
              />
            </div>
          </div>

          <div className="flex">
            <div className="w-[560px] min-w-[400px] overflow-hidden border-r">
              <table className="w-full">
                <thead>
                  <tr className="text-left bg-muted">
                    <th colSpan={6} className="p-1.5 text-xs font-medium text-center">
                      Client Information
                    </th>
                  </tr>
                  <tr className="text-left bg-muted">
                    <th className="p-1.5 whitespace-nowrap text-xs font-medium">Client Code</th>
                    <th className="p-1.5 whitespace-nowrap text-xs font-medium">Geo</th>
                    <th className="p-1.5 whitespace-nowrap text-xs font-medium">Segment</th>
                    <th className="p-1.5 whitespace-nowrap text-xs font-medium">P</th>
                    <th className="p-1.5 whitespace-nowrap text-xs font-medium">AM</th>
                    <th className="p-1.5 whitespace-nowrap text-xs font-medium">CF</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr 
                      key={item.id}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="p-1.5">
                        <div className="truncate max-w-[180px] text-xs" title={item.client_code_name || '-'}>
                          {item.client_code_name || '-'}
                        </div>
                      </td>
                      <td className="p-1.5">
                        <div className="truncate max-w-[60px] text-xs" title={item.country_code || '-'}>
                          {item.country_code || '-'}
                        </div>
                      </td>
                      <td className="p-1.5">
                        <div className="truncate max-w-[120px] text-xs" title={item.company_segment || '-'}>
                          {item.company_segment || '-'}
                        </div>
                      </td>
                      <td className={`p-1.5 ${getPriorityColor(item.existing_account_priority)}`}>
                        <div className="truncate max-w-[48px] text-xs" title={item.existing_account_priority?.toString() || '-'}>
                          {item.existing_account_priority || '-'}
                        </div>
                      </td>
                      <td className="p-1.5">
                        <div className="truncate max-w-[100px] text-xs" title={item.am || '-'}>
                          {item.am || '-'}
                        </div>
                      </td>
                      <td className="p-1.5">
                        <div className="truncate max-w-[100px] text-xs" title={item.client_facing || '-'}>
                          {item.client_facing || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex-1 overflow-hidden relative">
              <div className="overflow-x-auto">
                <div className="flex min-w-[1200px]">
                  {/* Monthly tables */}
                  {getAllMonths().map((month, index) => (
                    <table key={month} className={`border-r ${getMonthlyTableBgColor(index)}`}>
                      <thead>
                        <tr className="text-left bg-muted">
                          <th colSpan={8} className="p-1.5 text-xs font-medium text-center">
                            {formatMonthDisplay(month)}
                          </th>
                        </tr>
                        <tr className="text-left bg-muted">
                          <th className="p-1.5 whitespace-nowrap text-xs font-medium">PJT</th>
                          <th className="p-1.5 whitespace-nowrap text-xs font-medium">CR</th>
                          <th className="p-1.5 whitespace-nowrap text-xs font-medium">CDD</th>
                          <th className="p-1.5 whitespace-nowrap text-xs font-medium">DBC</th>
                          <th className="p-1.5 whitespace-nowrap text-xs font-medium">IV</th>
                          <th className="p-1.5 whitespace-nowrap text-xs font-medium">DBI</th>
                          <th className="p-1.5 whitespace-nowrap text-xs font-medium">Rev</th>
                          <th className="p-1.5 whitespace-nowrap text-xs font-medium">NR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item) => {
                          const monthStats = getMonthStats(item.client_code_name, month);
                          return (
                            <tr key={item.id} className="border-b hover:bg-muted/50">
                              <td className="p-1.5 text-xs text-right">{monthStats?.pjt || '-'}</td>
                              <td className="p-1.5 text-xs text-right">{monthStats?.cr || '-'}</td>
                              <td className="p-1.5 text-xs text-right">{monthStats?.cdd || '-'}</td>
                              <td className="p-1.5 text-xs text-right">{monthStats?.dbcdd || '-'}</td>
                              <td className="p-1.5 text-xs text-right">{monthStats?.iv || '-'}</td>
                              <td className="p-1.5 text-xs text-right">{monthStats?.dbiv || '-'}</td>
                              <td className="p-1.5 text-xs text-right">{formatNumber(monthStats?.revenue)}</td>
                              <td className="p-1.5 text-xs text-right">{formatNumber(monthStats?.net_revenue)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ))}

                  {/* YTD table */}
                  <table className="border-r bg-muted/20">
                    <thead>
                      <tr className="text-left bg-muted">
                        <th colSpan={8} className="p-1.5 text-xs font-medium text-center">
                          YTD
                        </th>
                      </tr>
                      <tr className="text-left bg-muted">
                        <th className="p-1.5 whitespace-nowrap text-xs font-medium">PJT</th>
                        <th className="p-1.5 whitespace-nowrap text-xs font-medium">CR</th>
                        <th className="p-1.5 whitespace-nowrap text-xs font-medium">CDD</th>
                        <th className="p-1.5 whitespace-nowrap text-xs font-medium">DBC</th>
                        <th className="p-1.5 whitespace-nowrap text-xs font-medium">IV</th>
                        <th className="p-1.5 whitespace-nowrap text-xs font-medium">DBI</th>
                        <th className="p-1.5 whitespace-nowrap text-xs font-medium">Rev</th>
                        <th className="p-1.5 whitespace-nowrap text-xs font-medium">NR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item) => {
                        const ytdStats = getYTDStats(item.client_code_name);
                        return (
                          <tr key={item.id} className="border-b hover:bg-muted/50">
                            <td className="p-1.5 text-xs text-right">{ytdStats?.pjt || '-'}</td>
                            <td className="p-1.5 text-xs text-right">{ytdStats?.cr || '-'}</td>
                            <td className="p-1.5 text-xs text-right">{ytdStats?.cdd || '-'}</td>
                            <td className="p-1.5 text-xs text-right">{ytdStats?.dbcdd || '-'}</td>
                            <td className="p-1.5 text-xs text-right">{ytdStats?.iv || '-'}</td>
                            <td className="p-1.5 text-xs text-right">{ytdStats?.dbiv || '-'}</td>
                            <td className="p-1.5 text-xs text-right">{formatNumber(ytdStats?.revenue)}</td>
                            <td className="p-1.5 text-xs text-right">{formatNumber(ytdStats?.net_revenue)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Loading overlay for stats */}
              {statsLoading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-[1px]">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <div className="text-sm text-muted-foreground">Loading stats...</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </CardContent>
      </Card>
    </div>
  );
} 