'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getExpertsData } from '@/utils/supabase/queries';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_ITEMS_PER_PAGE } from '@/utils/constants';
import { Input } from '@/components/ui/input';
import { TableWrapper } from '@/components/ui/table-wrapper';
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy } from 'lucide-react';
import { formatExpertForClipboard } from '@/utils/clipboard';
import { Button } from '@/components/ui/button';

interface ExpertCareer {
  job_from: string;
  job_to: string;
  company: string;
  title: string;
}

interface ExpertDetails {
  name: string;
  email: string;
  careers: ExpertCareer[];
  experience: string;
  description: string;
}

function parseCareerHistory(expert: any): ExpertCareer[] {
  const job_froms = (expert.job_from || '').split('\n').filter(Boolean);
  const job_tos = (expert.job_to || '').split('\n').filter(Boolean);
  const companies = (expert.company || '').split('\n').filter(Boolean);
  const titles = (expert.title || '').split('\n').filter(Boolean);

  const maxLength = Math.max(
    job_froms.length,
    job_tos.length,
    companies.length,
    titles.length
  );

  const careers: ExpertCareer[] = [];
  for (let i = 0; i < maxLength; i++) {
    careers.push({
      job_from: job_froms[i] || '',
      job_to: job_tos[i] || '',
      company: companies[i] || '',
      title: titles[i] || ''
    });
  }

  return careers;
}

interface ExpertsListProps {
  user: User;
}

export default function ExpertsList({ user }: ExpertsListProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const supabase = createClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const [selectedExpert, setSelectedExpert] = useState<ExpertDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = useCallback(async (
    skipDebounce: boolean = false,
    currentSearchTerm?: string
  ) => {
    try {
      setLoading(true);
      
      const { expertsData, count } = await getExpertsData(
        supabase, 
        currentPage, 
        itemsPerPage,
        currentSearchTerm ?? searchTerm
      );
      
      if (expertsData) {
        setData(expertsData);
        setTotalItems(count || 0);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch experts data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, currentPage, itemsPerPage, searchTerm, toast]);

  // Debounced search function
  const debouncedSearch = useCallback((
    fromSearchInput: boolean = false,
    newSearchTerm?: string
  ) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1); // Reset to first page
      fetchData(true, newSearchTerm);
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
    debouncedSearch(true, newValue);
  };

  // Handle pagination changes
  useEffect(() => {
    fetchData(true);
  }, [currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = undefined;
      }
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (items: number) => {
    if (items !== itemsPerPage) {
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
  }, []);

  const handleRowClick = (expert: any) => {
    const careers = parseCareerHistory(expert);
    setSelectedExpert({
      name: expert.name || '',
      email: expert.email || '',
      careers,
      experience: expert.experience || '',
      description: expert.description || ''
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
          <CardTitle>Experts Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label>Search</Label>
            <Input
              ref={searchInputRef}
              placeholder="Search by name, email, company, title, description, experience..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full"
            />
          </div>

          <TableWrapper>
            <table className="w-full">
              <thead>
                <tr className="text-left bg-muted">
                  <th className="p-2 whitespace-nowrap w-40">Name</th>
                  <th className="p-2 whitespace-nowrap w-48">Email</th>
                  <th className="p-2 whitespace-nowrap w-32">Phone</th>
                  <th className="p-2 whitespace-nowrap w-48">Company</th>
                  <th className="p-2 whitespace-nowrap w-48">Title</th>
                  <th className="p-2 whitespace-nowrap w-64">Experience</th>
                  <th className="p-2 whitespace-nowrap">Rate</th>
                  <th className="p-2 whitespace-nowrap">Recruiter</th>
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
                              {item.name || '-'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.name || '-'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="truncate w-48">
                              {item.email || '-'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.email || '-'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="truncate w-32">
                              {item.phone_number || '-'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.phone_number || '-'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="line-clamp-2 w-48">
                              {item.company || '-'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.company || '-'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="line-clamp-2 w-48">
                              {item.title || '-'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.title || '-'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="line-clamp-2 w-64">
                              {item.experience || '-'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.experience || '-'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-2 whitespace-nowrap">{item.rate || '-'}</td>
                    <td className="p-2 whitespace-nowrap">{item.recruiter || '-'}</td>
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
              <DialogTitle>Expert Details</DialogTitle>
              {selectedExpert && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex gap-2"
                  onClick={() => {
                    const formattedContent = formatExpertForClipboard(selectedExpert);
                    navigator.clipboard.writeText(formattedContent);
                    toast({
                      title: "Copied to clipboard",
                      description: "Expert details have been copied to your clipboard",
                    });
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              )}
            </div>
          </DialogHeader>
          
          {selectedExpert && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Name</h3>
                <p>{selectedExpert.name}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Email</h3>
                <p>{selectedExpert.email}</p>
              </div>

              <div>
                <h3 className="font-semibold">Career History</h3>
                <div className="space-y-2">
                  {selectedExpert.careers.map((career, index) => (
                    <div key={index} className="border p-2 rounded">
                      <p>
                        {career.job_from} ~ {career.job_to}
                      </p>
                      <p className="font-medium">{career.company}</p>
                      <p className="text-muted-foreground">{career.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold">Experience</h3>
                <p className="whitespace-pre-line">{selectedExpert.experience}</p>
              </div>

              <div>
                <h3 className="font-semibold">Description</h3>
                <p className="whitespace-pre-line">{selectedExpert.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 