'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { getMasterDataUnified } from '@/utils/supabase/queries';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_ITEMS_PER_PAGE } from '@/utils/constants';
import { Button } from '@/components/ui/button';
import { ChevronDown, X, Check, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import { TableWrapper } from '@/components/ui/table-wrapper';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const RECORD_TYPES = [
  'Candidate',
  'Expert',
  'Expert(30min)',
  'Follow up Questions',
  'Transcription',
  'Translator',
  'Translation (Document)',
  'Referral Partner',
  'ES: Survey',
  'Others'
] as const;

const YEAR_OPTIONS = (() => {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let year = 2023; year <= currentYear; year++) {
    years.push(year.toString());
  }
  return years.reverse();
})();

interface MasterDataListProps {
  user: User;
}

export default function MasterDataList({ user }: MasterDataListProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedRecordTypes, setSelectedRecordTypes] = useState<string[]>([]);
  const [recordTypeSearchOpen, setRecordTypeSearchOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const { toast } = useToast();
  const supabase = createClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchData = useCallback(async (
    skipDebounce: boolean = false,
    currentSearchTerm?: string,
    currentDateFrom?: string,
    currentDateTo?: string,
    currentRecordTypes?: string[],
    currentYear?: string
  ) => {
    try {
      setLoading(true);
      
      const effectiveRecordTypes = (currentRecordTypes ?? selectedRecordTypes).length === 0 
        ? [...RECORD_TYPES] 
        : (currentRecordTypes ?? selectedRecordTypes);

      const validDateFrom = (currentDateFrom ?? dateFrom)?.trim() || null;
      const validDateTo = (currentDateTo ?? dateTo)?.trim() || null;

      const { masterData, count } = await getMasterDataUnified(
        supabase,
        currentPage,
        itemsPerPage,
        validDateFrom,
        validDateTo,
        effectiveRecordTypes,
        currentSearchTerm ?? searchTerm,
        currentYear ?? selectedYear
      );
      
      if (masterData) {
        setData(masterData);
        setTotalItems(count || 0);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch master data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, currentPage, itemsPerPage, searchTerm, dateFrom, dateTo, selectedRecordTypes, selectedYear]);

  // Debounced search function
  const debouncedSearch = useCallback((
    fromSearchInput: boolean = false,
    newSearchTerm?: string,
    newDateFrom?: string,
    newDateTo?: string,
    newRecordTypes?: string[],
    newYear?: string
  ) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1); // Reset to first page
      fetchData(true, newSearchTerm, newDateFrom, newDateTo, newRecordTypes, newYear);
      if (fromSearchInput && searchInputRef.current) {
        searchInputRef.current.focus();
      }
      searchTimeoutRef.current = undefined;
    }, 1000);
  }, [fetchData]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    debouncedSearch(true, newValue, dateFrom, dateTo, selectedRecordTypes, selectedYear);
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDateFrom(newValue);
    debouncedSearch(false, searchTerm, newValue, dateTo, selectedRecordTypes, selectedYear);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDateTo(newValue);
    debouncedSearch(false, searchTerm, dateFrom, newValue, selectedRecordTypes, selectedYear);
  };

  const handleRecordTypeSelect = (recordType: string) => {
    setSelectedRecordTypes(current => {
      const newTypes = current.includes(recordType)
        ? current.filter(t => t !== recordType)
        : [...current, recordType];
      debouncedSearch(false, searchTerm, dateFrom, dateTo, newTypes, selectedYear);
      return newTypes;
    });
  };

  const removeRecordType = (recordType: string) => {
    setSelectedRecordTypes(current => {
      const newTypes = current.filter(t => t !== recordType);
      debouncedSearch(false, searchTerm, dateFrom, dateTo, newTypes, selectedYear);
      return newTypes;
    });
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    debouncedSearch(false, searchTerm, dateFrom, dateTo, selectedRecordTypes, year);
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      toast({
        title: "Exporting...",
        description: "Please wait while we prepare your data.",
      });

      const { masterData } = await getMasterDataUnified(
        supabase,
        1,
        1000000, // Large number to get all records
        dateFrom,
        dateTo,
        selectedRecordTypes,
        searchTerm,
        selectedYear
      );

      if (!masterData) throw new Error('No data to export');

      const columns = [
        'Date',
        'Record Type',
        'Project',
        'Channel',
        'Client',
        'Expert Fee',
        'USD Expert Fee',
        'USD Client Fee',
        'USD Net Revenue',
        'Recruiter',
        'Expert Name',
        'Position'
      ];

      const csvData = [
        columns.join(','),
        ...masterData.map(item => [
          item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-',
          item.candidate_expert || '-',
          `"${item.pjt || '-'}"`,
          item.channel || '-',
          `"${item.true_client || '-'}"`,
          item.actual_expert_fee ? `${item.proposed_currency} ${item.actual_expert_fee.toFixed(2)}` : '-',
          item.usd_actual_expert_fee ? item.usd_actual_expert_fee.toFixed(2) : '-',
          item.usd_actual_client_fee ? item.usd_actual_client_fee.toFixed(2) : '-',
          item.usd_actual_net_revenue ? item.usd_actual_net_revenue.toFixed(2) : '-',
          `"${item.recruiter || '-'}"`,
          `"${item.name || '-'}"`,
          `"${item.position || '-'}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `master_data_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`);
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

  // Initial load
  useEffect(() => {
    fetchData(true);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle pagination changes
  useEffect(() => {
    fetchData(true);
  }, [currentPage, itemsPerPage]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Master Data</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue>{selectedYear}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Other controls - spans half width on desktop */}
            <div className="order-1">
              <div className="flex gap-4">
                <div className="w-40">
                  <Label>Record Type</Label>
                  <Popover open={recordTypeSearchOpen} onOpenChange={setRecordTypeSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={recordTypeSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedRecordTypes.length === 0 
                          ? "All types" 
                          : `${selectedRecordTypes.length} selected`}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search record types..." />
                        <CommandEmpty>No type found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {RECORD_TYPES.map((recordType) => (
                            <CommandItem
                              key={recordType}
                              value={recordType}
                              onSelect={() => handleRecordTypeSelect(recordType)}
                            >
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "h-4 w-4 border rounded-sm flex items-center justify-center",
                                  selectedRecordTypes.includes(recordType) ? "bg-primary border-primary" : "border-input"
                                )}>
                                  {selectedRecordTypes.includes(recordType) && 
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                  }
                                </div>
                                {recordType}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedRecordTypes.map((recordType) => (
                      <Badge
                        key={recordType}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {recordType}
                        <button
                          type="button"
                          className="ml-1 hover:bg-muted rounded-full"
                          onClick={() => removeRecordType(recordType)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex gap-2">
                  <div className="w-1/2">
                    <Label htmlFor="dateFrom">From</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={dateFrom}
                      onChange={handleDateFromChange}
                    />
                  </div>
                  <div className="w-1/2">
                    <Label htmlFor="dateTo">To</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateTo}
                      onChange={handleDateToChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Search box - spans half width on desktop */}
            <div className="order-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                ref={searchInputRef}
                placeholder="Search PJT Code, Client, Recruiter, Expert Name, Position..."
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
                  <th className="p-2 whitespace-nowrap">Date</th>
                  <th className="p-2 whitespace-nowrap">Record Type</th>
                  <th className="p-2 whitespace-nowrap">Project</th>
                  <th className="p-2 whitespace-nowrap">Channel</th>
                  <th className="p-2 whitespace-nowrap">Client</th>
                  <th className="p-2 whitespace-nowrap">Expert Fee</th>
                  <th className="p-2 whitespace-nowrap">USD Expert Fee</th>
                  <th className="p-2 whitespace-nowrap">USD Client Fee</th>
                  <th className="p-2 whitespace-nowrap">USD Net Revenue</th>
                  <th className="p-2 whitespace-nowrap">Recruiter</th>
                  <th className="p-2 whitespace-nowrap">Expert Name</th>
                  <th className="p-2 whitespace-nowrap">Position</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr 
                    key={item.id}
                    className="border-b hover:bg-muted/50"
                  >
                    <td className="p-2 whitespace-nowrap">
                      {item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="p-2 whitespace-nowrap">{item.candidate_expert || '-'}</td>
                    <td className="p-2 max-w-md break-words">{item.pjt || '-'}</td>
                    <td className="p-2 whitespace-nowrap">{item.channel || '-'}</td>
                    <td className="p-2 whitespace-nowrap">{item.true_client || '-'}</td>
                    <td className="p-2 whitespace-nowrap">
                      {item.actual_expert_fee 
                        ? `${item.proposed_currency} ${item.actual_expert_fee.toFixed(2)}` 
                        : '-'}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {item.usd_actual_expert_fee 
                        ? `${item.usd_actual_expert_fee.toFixed(2)}` 
                        : '-'}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {item.usd_actual_client_fee 
                        ? `${item.usd_actual_client_fee.toFixed(2)}` 
                        : '-'}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {item.usd_actual_net_revenue 
                        ? `${item.usd_actual_net_revenue.toFixed(2)}` 
                        : '-'}
                    </td>
                    <td className="p-2 max-w-md break-words">{item.recruiter || '-'}</td>
                    <td className="p-2 max-w-md break-words">{item.name || '-'}</td>
                    <td className="p-2 max-w-[200px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="line-clamp-2 break-words cursor-default">
                              {item.position || '-'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px] break-words">
                            <p>{item.position || '-'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </CardContent>
      </Card>
    </div>
  );
} 