'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { getPJTMasterData } from '@/utils/supabase/queries';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_ITEMS_PER_PAGE } from '@/utils/constants';
import { Button } from '@/components/ui/button';
import { ChevronDown, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import { TableWrapper } from '@/components/ui/table-wrapper';

const CONTRACT_TYPES = [
  'All',
  'Pay as you go (project)',
  'Pay as you go (monthly)',
  'Credit',
  'Others'
];

const STATUS_OPTIONS = [
  '0.Proposal',
  '1. On going',
  '2. Pending',
  '3. Closed',
  '4. Lost',
  '5. Proposal Lost',
  '6. ES Closed',
  'Others'
];

interface PJTDataListProps {
  user: User;
}

export default function PJTDataList({ user }: PJTDataListProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [contractType, setContractType] = useState('All');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['0.Proposal', '1. On going']);
  const [statusSearchOpen, setStatusSearchOpen] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchData = useCallback(async (
    skipDebounce: boolean = false,
    currentSearchTerm?: string,
    currentContractType?: string,
    currentStatuses?: string[]
  ) => {
    try {
      console.log('fetchData: starting', {
        skipDebounce,
        currentPage,
        itemsPerPage,
        searchTerm: currentSearchTerm ?? searchTerm,
        contractType: currentContractType ?? contractType,
        selectedStatuses: currentStatuses ?? selectedStatuses
      });
      
      setLoading(true);

      // If no statuses are selected, use all statuses
      const effectiveStatuses = (currentStatuses ?? selectedStatuses).length === 0 
        ? [...STATUS_OPTIONS] 
        : (currentStatuses ?? selectedStatuses);
      
      const { pjtData, count } = await getPJTMasterData(
        supabase, 
        currentPage, 
        itemsPerPage,
        currentSearchTerm ?? searchTerm,
        currentContractType ?? contractType,
        effectiveStatuses
      );
      
      if (pjtData) {
        setData(pjtData);
        setTotalItems(count || 0);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch PJT data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      console.log('fetchData: finished');
    }
  }, [supabase, currentPage, itemsPerPage, searchTerm, contractType, selectedStatuses, toast]);

  // Debounced search function - for filter changes only
  const debouncedSearch = useCallback((
    fromSearchInput: boolean = false,
    newSearchTerm?: string,
    newContractType?: string,
    newStatuses?: string[]
  ) => {
    if (searchTimeoutRef.current) {
      console.log('debouncedSearch: clearing timeout');
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      console.log('debouncedSearch: executing search');
      setCurrentPage(1); // Reset to first page
      fetchData(true, newSearchTerm, newContractType, newStatuses);
      if (fromSearchInput && searchInputRef.current) {
        console.log('debouncedSearch: focusing search input');
        searchInputRef.current.focus();
      }
      searchTimeoutRef.current = undefined;
    }, 1000);
  }, [fetchData]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    debouncedSearch(true, newValue, contractType, selectedStatuses);
  };

  // Handle contract type changes
  const handleContractTypeChange = (value: string) => {
    setContractType(value);
    debouncedSearch(false, searchTerm, value, selectedStatuses);
  };

  // Handle status selection
  const handleStatusSelect = (status: string) => {
    setSelectedStatuses(current => {
      const newStatuses = current.includes(status)
        ? current.filter(s => s !== status)
        : [...current, status];
      debouncedSearch(false, searchTerm, contractType, newStatuses);
      return newStatuses;
    });
  };

  const removeStatus = (status: string) => {
    setSelectedStatuses(current => {
      const newStatuses = current.filter(s => s !== status);
      debouncedSearch(false, searchTerm, contractType, newStatuses);
      return newStatuses;
    });
  };

  // Handle pagination changes
  useEffect(() => {
    console.log('Pagination effect triggered');
    // For pagination changes, fetch immediately
    fetchData(true);
  }, [currentPage, itemsPerPage]); // Remove fetchData from dependencies

  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      console.log('Page changed to:', page);
      // Clear any pending debounced search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = undefined;
      }
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (items: number) => {
    if (items !== itemsPerPage) { // Only update if items per page actually changes
      console.log('Items per page changed to:', items);
      setItemsPerPage(items);
      setCurrentPage(1);
    }
  };

  // Initial load
  useEffect(() => {
    console.log('Initial load');
    fetchData(true);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array for initial load

  if (loading) {
    return <div>Loading...</div>;
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>PJT Data List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Other controls - spans half width on desktop */}
            <div className="order-1">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select
                    value={contractType}
                    onValueChange={handleContractTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Contract type" />
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
                  <Popover open={statusSearchOpen} onOpenChange={setStatusSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={statusSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedStatuses.length === 0 
                          ? "All statuses"
                          : `${selectedStatuses.length} selected`}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search statuses..." />
                        <CommandEmpty>No status found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {STATUS_OPTIONS.map((status) => (
                            <CommandItem
                              key={status}
                              value={status}
                              onSelect={() => handleStatusSelect(status)}
                            >
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "h-4 w-4 border rounded-sm flex items-center justify-center",
                                  selectedStatuses.includes(status) ? "bg-primary border-primary" : "border-input"
                                )}>
                                  {selectedStatuses.includes(status) && 
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                  }
                                </div>
                                {status}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedStatuses.map((status) => (
                      <Badge
                        key={status}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {status}
                        <button
                          type="button"
                          className="ml-1 hover:bg-muted rounded-full"
                          onClick={() => removeStatus(status)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Search box - spans half width on desktop */}
            <div className="order-2">
              <Input
                ref={searchInputRef}
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Wrap the table with TableWrapper */}
          <TableWrapper>
            <table className="w-full">
              <thead>
                <tr className="text-left bg-muted">
                  <th className="p-2 whitespace-nowrap">PJT Code</th>
                  <th className="p-2 whitespace-nowrap">Project Topic</th>
                  <th className="p-2 whitespace-nowrap">Client</th>
                  <th className="p-2 whitespace-nowrap">Client PIC</th>
                  <th className="p-2 whitespace-nowrap">Contract Type</th>
                  <th className="p-2 whitespace-nowrap">Inquiry Date</th>
                  <th className="p-2 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr 
                    key={item.id}
                    className="border-b hover:bg-muted/50"
                  >
                    <td className="p-2 whitespace-nowrap">{item.pjt_code || '-'}</td>
                    <td className="p-2 max-w-md break-words">{item.project_topic || '-'}</td>
                    <td className="p-2 whitespace-nowrap">{item.client || '-'}</td>
                    <td className="p-2 whitespace-nowrap">
                      <div>
                        <div>{item.client_pic_name || '-'}</div>
                        <div className="text-sm text-muted-foreground">{item.client_pic_email || '-'}</div>
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap">{item.contract_type || '-'}</td>
                    <td className="p-2 whitespace-nowrap">
                      {item.inquiry_date ? format(new Date(item.inquiry_date), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="p-2 whitespace-nowrap">{item.status || '-'}</td>
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
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </CardContent>
      </Card>
    </div>
  );
} 