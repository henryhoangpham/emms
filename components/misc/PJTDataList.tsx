'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { getPJTMasterData } from '@/utils/supabase/queries';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_ITEMS_PER_PAGE } from '@/utils/constants';

interface PJTDataListProps {
  user: User;
}

export default function PJTDataList({ user }: PJTDataListProps) {
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
      const { pjtData, count } = await getPJTMasterData(supabase, currentPage, itemsPerPage);
      
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
          <CardTitle>PJT Data List</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="text-left bg-muted">
                <th className="p-2">PJT Code</th>
                <th className="p-2">Project Topic</th>
                <th className="p-2">Client</th>
                <th className="p-2">Client PIC</th>
                <th className="p-2">Contract Type</th>
                <th className="p-2">Inquiry Date</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr 
                  key={item.id}
                  className="border-b hover:bg-muted/50"
                >
                  <td className="p-2">{item.pjt_code || '-'}</td>
                  <td className="p-2">{item.project_topic || '-'}</td>
                  <td className="p-2">{item.client || '-'}</td>
                  <td className="p-2">
                    <div>
                      <div>{item.client_pic_name || '-'}</div>
                      <div className="text-sm text-muted-foreground">{item.client_pic_email || '-'}</div>
                    </div>
                  </td>
                  <td className="p-2">{item.contract_type || '-'}</td>
                  <td className="p-2">
                    {item.inquiry_date ? format(new Date(item.inquiry_date), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="p-2">{item.status || '-'}</td>
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