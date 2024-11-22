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
  const { toast } = useToast();
  const supabase = createClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchData = useCallback(async (
    skipDebounce: boolean = false,
    currentSearchTerm?: string,
    currentInvoiceEntity?: string,
    currentContractType?: string,
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
        currentSearchTerm ?? searchTerm
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
  }, [supabase, currentPage, itemsPerPage, searchTerm, invoiceEntity, contractType, toast]);

  const debouncedSearch = useCallback((
    fromSearchInput: boolean = false,
    newSearchTerm?: string,
    newInvoiceEntity?: string,
    newContractType?: string,
  ) => {
    if (searchTimeoutRef.current) {
      console.log('debouncedSearch: clearing timeout');
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      console.log('debouncedSearch: executing search');
      setCurrentPage(1);
      fetchData(true, newSearchTerm, newInvoiceEntity, newContractType);
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
    <div className="container mx-auto">
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
              </div>
            </div>

            {/* Search box */}
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

          <TableWrapper>
            <table className="w-full">
              <thead>
                <tr className="text-left bg-muted">
                  <th className="p-2 whitespace-nowrap">Client Code</th>
                  <th className="p-2 whitespace-nowrap">Contract Type</th>
                  <th className="p-2 whitespace-nowrap">Country</th>
                  <th className="p-2 whitespace-nowrap">Company Segment</th>
                  <th className="p-2 whitespace-nowrap">Priority</th>
                  <th className="p-2 whitespace-nowrap">AM</th>
                  <th className="p-2 whitespace-nowrap">Client Facing</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr 
                    key={item.id}
                    className="border-b hover:bg-muted/50"
                  >
                    <td className="p-2 whitespace-nowrap">{item.client_code_name || '-'}</td>
                    <td className="p-2 whitespace-nowrap">{item.contract_type || '-'}</td>
                    <td className="p-2 whitespace-nowrap">{item.country_code || '-'}</td>
                    <td className="p-2 whitespace-nowrap">{item.company_segment || '-'}</td>
                    <td className={`p-2 whitespace-nowrap ${getPriorityColor(item.existing_account_priority)}`}>
                      {item.existing_account_priority || '-'}
                    </td>
                    <td className="p-2 whitespace-nowrap">{item.am || '-'}</td>
                    <td className="p-2 whitespace-nowrap">{item.client_facing || '-'}</td>
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