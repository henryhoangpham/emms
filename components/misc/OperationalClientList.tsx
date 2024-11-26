'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getOperationalClients } from '@/utils/supabase/queries';
import type { OperationalClientData } from '@/utils/supabase/queries';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_ITEMS_PER_PAGE } from '@/utils/constants';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableWrapper } from '@/components/ui/table-wrapper';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Check, ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

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

const SEGMENT_OPTIONS = [
  "1. Consulting Firm",
  "1b. Research Firm",
  "2. Private Equity",
  "2b Venture Capital",
  "3. Hedge Fund",
  "3b Long Only",
  "3c Asset Management",
  "3d Sell Side",
  "4. Corporate",
  "5. Others",
  "5c ENS",
  "6. Recruiting Company"
] as const;

interface OperationalClientListProps {
  user: User;
}

export default function OperationalClientList({ user }: OperationalClientListProps) {
  const [data, setData] = useState<OperationalClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceEntity, setInvoiceEntity] = useState('All');
  const [contractType, setContractType] = useState('All');
  const [selectedPriorities, setSelectedPriorities] = useState<number[]>([]);
  const [prioritySearchOpen, setPrioritySearchOpen] = useState(false);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [segmentSearchOpen, setSegmentSearchOpen] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchData = useCallback(async (
    skipDebounce: boolean = false,
    currentSearchTerm?: string,
    currentInvoiceEntity?: string,
    currentContractType?: string,
    currentPriorities?: number[],
    currentSegments?: string[]
  ) => {
    try {
      console.log('fetchData: starting', {
        skipDebounce,
        currentPage,
        itemsPerPage,
        searchTerm: currentSearchTerm ?? searchTerm,
        invoiceEntity: currentInvoiceEntity ?? invoiceEntity,
        contractType: currentContractType ?? contractType,
      });
      
      setLoading(true);
      
      const { operationalClients, count } = await getOperationalClients(
        supabase,
        currentPage,
        itemsPerPage,
        currentInvoiceEntity ?? invoiceEntity,
        currentContractType ?? contractType,
        currentSearchTerm ?? searchTerm,
        currentPriorities ?? selectedPriorities,
        currentSegments ?? selectedSegments
      );

      console.log('fetchData: operationalClients', operationalClients);
      if (operationalClients) {
        setData(operationalClients);
        setTotalItems(count || 0);
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
      console.log('fetchData: finished');
    }
  }, [supabase, currentPage, itemsPerPage, searchTerm, invoiceEntity, contractType, selectedPriorities, selectedSegments, toast]);

  const debouncedSearch = useCallback((
    fromSearchInput: boolean = false,
    newSearchTerm?: string,
    newInvoiceEntity?: string,
    newContractType?: string,
    newPriorities?: number[],
    newSegments?: string[]
  ) => {
    if (searchTimeoutRef.current) {
      console.log('debouncedSearch: clearing timeout');
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      console.log('debouncedSearch: executing search');
      setCurrentPage(1);
      fetchData(true, newSearchTerm, newInvoiceEntity, newContractType, newPriorities, newSegments);
      if (fromSearchInput && searchInputRef.current) {
        console.log('debouncedSearch: focusing search input');
        searchInputRef.current.focus();
      }
      searchTimeoutRef.current = undefined;
    }, 1000);
  }, [fetchData]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    debouncedSearch(true, newValue, invoiceEntity, contractType, selectedPriorities, selectedSegments);
  };

  const handleInvoiceEntityChange = (value: string) => {
    setInvoiceEntity(value);
    debouncedSearch(false, searchTerm, value, contractType, selectedPriorities, selectedSegments);
  };

  const handleContractTypeChange = (value: string) => {
    setContractType(value);
    debouncedSearch(false, searchTerm, invoiceEntity, value, selectedPriorities, selectedSegments);
  };

  const handlePrioritySelect = (priority: number) => {
    setSelectedPriorities(current => {
      const newPriorities = current.includes(priority)
        ? current.filter(p => p !== priority)
        : [...current, priority];
      debouncedSearch(false, searchTerm, invoiceEntity, contractType, newPriorities, selectedSegments);
      return newPriorities;
    });
  };

  const removePriority = (priority: number) => {
    setSelectedPriorities(current => {
      const newPriorities = current.filter(p => p !== priority);
      debouncedSearch(false, searchTerm, invoiceEntity, contractType, newPriorities, selectedSegments);
      return newPriorities;
    });
  };

  const handleSegmentSelect = (segment: string) => {
    setSelectedSegments(current => {
      const newSegments = current.includes(segment)
        ? current.filter(s => s !== segment)
        : [...current, segment];
      debouncedSearch(false, searchTerm, invoiceEntity, contractType, selectedPriorities, newSegments);
      return newSegments;
    });
  };

  const removeSegment = (segment: string) => {
    setSelectedSegments(current => {
      const newSegments = current.filter(s => s !== segment);
      debouncedSearch(false, searchTerm, invoiceEntity, contractType, selectedPriorities, newSegments);
      return newSegments;
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

  if (loading) {
    return <div>Loading...</div>;
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>Operational Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Filter controls */}
            <div className="order-1">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Invoice Entity</Label>
                  <Select
                    value={invoiceEntity}
                    onValueChange={handleInvoiceEntityChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Invoice Entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {INVOICE_ENTITIES.map((entity) => (
                        <SelectItem key={entity} value={entity}>
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

                <div className="flex-1">
                  <Label>Segment</Label>
                  <Popover open={segmentSearchOpen} onOpenChange={setSegmentSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={segmentSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedSegments.length === 0 
                          ? "All segments" 
                          : `${selectedSegments.length} selected`}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search segments..." />
                        <CommandEmpty>No segment found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {SEGMENT_OPTIONS.map((segment) => (
                            <CommandItem
                              key={segment}
                              value={segment}
                              onSelect={() => handleSegmentSelect(segment)}
                            >
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "h-4 w-4 border rounded-sm flex items-center justify-center",
                                  selectedSegments.includes(segment) ? "bg-primary border-primary" : "border-input"
                                )}>
                                  {selectedSegments.includes(segment) && 
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                  }
                                </div>
                                {segment}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedSegments.map((segment) => (
                      <Badge
                        key={segment}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {segment}
                        <button
                          type="button"
                          className="ml-1 hover:bg-muted rounded-full"
                          onClick={() => removeSegment(segment)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
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

            {/* Search box */}
            <div className="order-2">
              <Label>Search</Label>
              <Input
                ref={searchInputRef}
                placeholder="Search Client Code, Client, Client ID..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full"
              />
            </div>
          </div>

          <TableWrapper>
            <table className="w-full">
              <thead>
                <tr className="text-left bg-muted">
                  <th className="p-2 whitespace-nowrap">Client Code</th>
                  <th className="p-2 whitespace-nowrap">Client Name</th>
                  <th className="p-2 whitespace-nowrap">Client ID</th>
                  <th className="p-2 whitespace-nowrap">Contract Type</th>
                  <th className="p-2 whitespace-nowrap">Country</th>
                  <th className="p-2 whitespace-nowrap">Company Segment</th>
                  <th className="p-2 whitespace-nowrap">Priority</th>
                  <th className="p-2 whitespace-nowrap">AM</th>
                  <th className="p-2 whitespace-nowrap">PM</th>
                  <th className="p-2 whitespace-nowrap">CF</th>
                  <th className="p-2 whitespace-nowrap">Invoice Entity</th>
                  <th className="p-2 whitespace-nowrap">Invoice Currency</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr 
                    key={item.id}
                    className="border-b hover:bg-muted/50"
                  >
                    <td className="p-2 whitespace-nowrap">{item.client_code_name || '-'}</td>
                    <td className="p-2 whitespace-nowrap">{item.company_name || '-'}</td>
                    <td className="p-2 whitespace-nowrap">{item.client_id || '-'}</td>
                    <td className="p-2 whitespace-nowrap">{item.contract_type || '-'}</td>
                    <td className="p-2 whitespace-nowrap">{item.country_code || '-'}</td>
                    <td className="p-2 whitespace-nowrap">{item.company_segment || '-'}</td>
                    <td className={`p-2 whitespace-nowrap ${getPriorityColor(item.existing_account_priority)}`}>
                      {item.existing_account_priority || '-'}
                    </td>
                    <td className="p-2 whitespace-nowrap">{item.am || '-'}</td>
                    <td className="p-2 whitespace-nowrap">{item.pm || '-'}</td>
                    <td className="p-2 whitespace-nowrap">{item.client_facing || '-'}</td>
                    <td className="p-2 whitespace-nowrap">{item.invoice_entity || '-'}</td>
                    <td className="p-2 whitespace-nowrap">{item.invoice_currency || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>

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