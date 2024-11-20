'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { getMasterData } from '@/utils/supabase/queries';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_ITEMS_PER_PAGE } from '@/utils/constants';

interface MasterDataListProps {
  user: User;
}

export default function MasterDataList({ user }: MasterDataListProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const { toast } = useToast();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { masterData, count } = await getMasterData(supabase, currentPage, itemsPerPage);
      
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
  }, [supabase, currentPage, itemsPerPage, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Master Data List</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="text-left bg-muted">
                <th className="p-2">Date</th>
                <th className="p-2">Name</th>
                <th className="p-2">Expert</th>
                <th className="p-2">Project</th>
                <th className="p-2">Channel</th>
                <th className="p-2">Position</th>
                <th className="p-2">Expert Fee</th>
                <th className="p-2">Client Fee</th>
                <th className="p-2">Net Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr 
                  key={item.id}
                  className="border-b hover:bg-muted/50"
                >
                  <td className="p-2">{item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}</td>
                  <td className="p-2">{item.name || '-'}</td>
                  <td className="p-2">{item.candidate_expert || '-'}</td>
                  <td className="p-2">{item.pjt || '-'}</td>
                  <td className="p-2">{item.channel || '-'}</td>
                  <td className="p-2">{item.position || '-'}</td>
                  <td className="p-2">
                    {item.fee_for_expert 
                      ? `${item.proposed_currency} ${item.fee_for_expert.toFixed(2)}` 
                      : '-'}
                  </td>
                  <td className="p-2">
                    {item.fee_from_client 
                      ? `${item.proposed_currency} ${item.fee_from_client.toFixed(2)}` 
                      : '-'}
                  </td>
                  <td className="p-2">
                    {item.net_revenue 
                      ? `${item.proposed_currency} ${item.net_revenue.toFixed(2)}` 
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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