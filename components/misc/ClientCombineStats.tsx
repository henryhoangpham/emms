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
import { Check, ChevronDown, X, RotateCw, Download } from "lucide-react";
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
  const [statsError, setStatsError] = useState(false);

  const fetchStats = useCallback(async (clientCodes: string[]) => {
    if (statsAbortController.current) {
      statsAbortController.current.abort();
    }

    statsAbortController.current = new AbortController();

    try {
      setStatsLoading(true);
      setStatsError(false);
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
      } else {
        console.error('Error fetching stats:', error);
        setStatsError(true);
        toast({
          title: 'Warning',
          description: 'Failed to load statistics. Click the retry button to try again.',
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

  const handleExport = async () => {
    try {
      setLoading(true);
      toast({
        title: "Exporting...",
        description: "Please wait while we prepare your data.",
      });

      // Get all client codes from current data
      const clientCodes = data.map(client => client.client_code_name);
      
      // Fetch stats for all clients
      const stats = await getClientCombineStats(supabase, clientCodes);
      
      // Define column order to match the display
      const clientInfoColumns = [
        'Client Code',
        'Company Name',
        'Contract Type',
        'Country',
        'Company Segment',
        'Priority',
        'AM',
        'PM',
        'Client Facing'
      ] as const;

      // Get months in same order as display (descending)
      const months = getAllMonths();
      const monthlyColumns = months.flatMap(month => [
        `${month}_PJT`,
        `${month}_CR`,
        `${month}_CDD`,
        `${month}_DBCDD`,
        `${month}_IV`,
        `${month}_DBIV`,
        `${month}_Rev`,
        `${month}_NR`,
      ]);

      // YTD columns in same order as display
      const ytdColumns = [
        'YTD_PJT',
        'YTD_CR',
        'YTD_CDD',
        'YTD_DBCDD',
        'YTD_IV',
        'YTD_DBIV',
        'YTD_Rev',
        'YTD_NR',
      ] as const;

      // Combine all columns in correct order
      const orderedColumns = [...clientInfoColumns, ...monthlyColumns, ...ytdColumns] as const;
      
      // Format data for export
      const exportData = stats.map(clientStat => {
        const client = data.find(c => c.client_code_name === clientStat.client_code);
        
        // Create base record with client info
        const record: Record<string, any> = {
          'Client Code': client?.client_code_name || '',
          'Company Name': client?.company_name || '',
          'Contract Type': client?.contract_type || '',
          'Country': client?.country_code || '',
          'Company Segment': client?.company_segment || '',
          'Priority': client?.existing_account_priority || '',
          'AM': client?.am || '',
          'PM': client?.pm || '',
          'Client Facing': client?.client_facing || '',
        };

        // Add monthly stats in correct order
        clientStat.monthly_data.forEach(month => {
          record[`${month.month}_PJT`] = month.stats.pjt;
          record[`${month.month}_CR`] = month.stats.cr;
          record[`${month.month}_CDD`] = month.stats.cdd;
          record[`${month.month}_DBCDD`] = month.stats.dbcdd;
          record[`${month.month}_IV`] = month.stats.iv;
          record[`${month.month}_DBIV`] = month.stats.dbiv;
          record[`${month.month}_Rev`] = month.stats.revenue;
          record[`${month.month}_NR`] = month.stats.net_revenue;
        });

        // Add YTD stats
        record['YTD_PJT'] = clientStat.ytd_totals.stats.pjt;
        record['YTD_CR'] = clientStat.ytd_totals.stats.cr;
        record['YTD_CDD'] = clientStat.ytd_totals.stats.cdd;
        record['YTD_DBCDD'] = clientStat.ytd_totals.stats.dbcdd;
        record['YTD_IV'] = clientStat.ytd_totals.stats.iv;
        record['YTD_DBIV'] = clientStat.ytd_totals.stats.dbiv;
        record['YTD_Rev'] = clientStat.ytd_totals.stats.revenue;
        record['YTD_NR'] = clientStat.ytd_totals.stats.net_revenue;

        return record;
      });

      // Convert to CSV using ordered columns
      const csvContent = [
        orderedColumns.join(','),
        ...exportData.map(row => 
          orderedColumns.map(header => {
            const value = row[header] ?? '';
            // Handle values that might contain commas
            return typeof value === 'string' && value.includes(',') 
              ? `"${value}"`
              : value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `client_stats_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Complete",
        description: "Your data has been exported successfully.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Client Combine Stats</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={handleExport}
            disabled={loading || data.length === 0}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
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

      {/* Retry button */}
      {statsError && (
        <div className="fixed bottom-40 right-4 z-50">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full bg-background shadow-lg hover:bg-muted"
            onClick={() => {
              const clientCodes = data.map(client => client.client_code_name);
              if (clientCodes.length > 0) {
                fetchStats(clientCodes);
              }
            }}
            title="Retry loading stats"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
} 