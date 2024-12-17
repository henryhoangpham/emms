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
import { ChevronDown, X, Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import { TableWrapper } from '@/components/ui/table-wrapper';
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPJTForClipboard } from '@/utils/clipboard';

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

interface PJTDetails {
  id: number;
  pjt_code: string;
  project_topic: string;
  client: string;
  client_pic_name: string;
  client_pic_email: string;
  contract_type: string;
  inquiry_date: string;
  proposal_date: string;
  status: string;
  required_nr_of_calls: number;
  project_brief: string;
  research_priorities: string;
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
  const [selectedPJT, setSelectedPJT] = useState<PJTDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = useCallback(async (
    skipDebounce: boolean = false,
    currentSearchTerm?: string,
    currentContractType?: string,
    currentStatuses?: string[]
  ) => {
    try {
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
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1); // Reset to first page
      fetchData(true, newSearchTerm, newContractType, newStatuses);
      if (fromSearchInput && searchInputRef.current) {
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
    // For pagination changes, fetch immediately
    fetchData(true);
  }, [currentPage, itemsPerPage]); // Remove fetchData from dependencies

  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
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
      setItemsPerPage(items);
      setCurrentPage(1);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData(true);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array for initial load

  const handleRowClick = (pjt: any) => {
    setSelectedPJT({
      id: pjt.id,
      pjt_code: pjt.pjt_code || '',
      project_topic: pjt.project_topic || '',
      client: pjt.client || '',
      client_pic_name: pjt.client_pic_name || '',
      client_pic_email: pjt.client_pic_email || '',
      contract_type: pjt.contract_type || '',
      inquiry_date: pjt.inquiry_date || '',
      proposal_date: pjt.proposal_date || '',
      status: pjt.status || '',
      required_nr_of_calls: pjt.required_nr_of_calls || 0,
      project_brief: pjt.tag3 || '',
      research_priorities: pjt.tag4 || ''
    });
    setDialogOpen(true);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>PJT Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Other controls - spans half width on desktop */}
            <div className="order-1">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Contract Type</Label>
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
                  <Label>Status</Label>
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
              <Label>Search</Label>
              <Input
                ref={searchInputRef}
                placeholder="Search PJT Code, Topic, Client..."
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
                  <th className="p-2 whitespace-nowrap">CR</th>
                  <th className="p-2 whitespace-nowrap">Status</th>
                  <th className="p-2 whitespace-nowrap">Project Topic</th>
                  <th className="p-2 whitespace-nowrap">Client</th>
                  <th className="p-2 whitespace-nowrap">Client PIC</th>
                  <th className="p-2 whitespace-nowrap">Contract Type</th>
                  <th className="p-2 whitespace-nowrap">Inquiry Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr 
                    key={item.id}
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleRowClick(item)}
                  >
                    <td className="p-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="truncate w-40">
                              {item.pjt_code || '-'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.pjt_code || '-'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-2 whitespace-nowrap">{item.required_nr_of_calls || '-'}</td>
                    <td className="p-2 whitespace-nowrap">{item.status || '-'}</td>
                    <td className="p-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="line-clamp-2 max-w-md">
                              {item.project_topic || '-'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.project_topic || '-'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="truncate w-40">
                              {item.client || '-'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.client || '-'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-2">
                      <div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="truncate w-40">
                                {item.client_pic_name || '-'}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{item.client_pic_name || '-'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="truncate w-40 text-sm text-muted-foreground">
                                {item.client_pic_email || '-'}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{item.client_pic_email || '-'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap">{item.contract_type || '-'}</td>
                    <td className="p-2 whitespace-nowrap">
                      {item.inquiry_date ? format(new Date(item.inquiry_date), 'dd/MM/yyyy') : '-'}
                    </td>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Project Details</DialogTitle>
              {selectedPJT && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex gap-2"
                  onClick={() => {
                    const formattedContent = formatPJTForClipboard(selectedPJT);
                    navigator.clipboard.writeText(formattedContent);
                    toast({
                      title: "Copied to clipboard",
                      description: "Project details have been copied to your clipboard",
                    });
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              )}
            </div>
          </DialogHeader>
          
          {selectedPJT && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">PJT Code</h3>
                  <p>{selectedPJT.pjt_code}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">Status</h3>
                  <p>{selectedPJT.status}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold">Project Topic</h3>
                <p className="whitespace-pre-line">{selectedPJT.project_topic}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Client</h3>
                  <p>{selectedPJT.client}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">Contract Type</h3>
                  <p>{selectedPJT.contract_type}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold">Client PIC</h3>
                <div className="space-y-1">
                  <p>{selectedPJT.client_pic_name}</p>
                  <p className="text-muted-foreground">{selectedPJT.client_pic_email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Inquiry Date</h3>
                  <p>
                    {selectedPJT.inquiry_date 
                      ? format(new Date(selectedPJT.inquiry_date), 'dd/MM/yyyy')
                      : '-'}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold">Proposal Date</h3>
                  <p>
                    {selectedPJT.proposal_date 
                      ? format(new Date(selectedPJT.proposal_date), 'dd/MM/yyyy')
                      : '-'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold">Required Number of Calls</h3>
                <p>{selectedPJT.required_nr_of_calls}</p>
              </div>

              <div>
                <h3 className="font-semibold">Project Brief</h3>
                <p className="whitespace-pre-line">{selectedPJT.project_brief}</p>
              </div>

              <div>
                <h3 className="font-semibold">Research Priorities</h3>
                <p className="whitespace-pre-line">{selectedPJT.research_priorities}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 