'use client';

import { useCallback, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_ITEMS_PER_PAGE } from '@/utils/constants';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { TableWrapper } from '@/components/ui/table-wrapper';
import { getZoomPhoneRecordings, PhoneRecording } from '@/utils/supabase/queries';

interface ZoomPhoneRecordingListProps {
  user: User;
}

export default function ZoomPhoneRecordingsList({ user }: ZoomPhoneRecordingListProps) {
  const [phoneRecordings, setPhoneRecordings] = useState<PhoneRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const { toast } = useToast();

  const fetchRecordings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getZoomPhoneRecordings(currentPage, itemsPerPage);
      
      setPhoneRecordings(data.phone_recordings);
      setTotalItems(data.total_records);
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch recordings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, toast]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const formatFileName = (recording: PhoneRecording) => {
    return `phone_${format(new Date(recording.date_time), 'yyyyMMdd_HHmmss')}_${recording.caller_number}_${recording.callee_number}.mp3`;
  };

  const handleDownload = async (recording: PhoneRecording) => {
    try {
      const response = await fetch('/api/zoom/phone-recordings/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          downloadUrl: recording.download_url
        })
      });

      if (!response.ok) {
        console.error('Failed to download recording:', response);
        throw new Error('Failed to download recording');
      }

      // Create blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = formatFileName(recording);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Error',
        description: 'Failed to download recording',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>Phone Recordings</CardTitle>
        </CardHeader>
        <CardContent>
          {phoneRecordings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No phone recordings found
            </div>
          ) : (
            <>
              <TableWrapper>
                <table className="w-full">
                  <thead>
                    <tr className="text-left bg-muted">
                      <th className="p-2 whitespace-nowrap">Direction</th>
                      <th className="p-2 whitespace-nowrap">Caller</th>
                      <th className="p-2 whitespace-nowrap">Callee</th>
                      <th className="p-2 whitespace-nowrap">Date & Time</th>
                      <th className="p-2 whitespace-nowrap">Duration</th>
                      <th className="p-2 whitespace-nowrap">Type</th>
                      <th className="p-2 whitespace-nowrap">Site</th>
                      <th className="p-2 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phoneRecordings.map((recording) => (
                      <tr 
                        key={recording.id}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="p-2 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            recording.direction === 'inbound' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {recording.direction}
                          </span>
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          <div>{recording.caller_name}</div>
                          <div className="text-sm text-muted-foreground">{recording.caller_number}</div>
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          <div>{recording.callee_name}</div>
                          <div className="text-sm text-muted-foreground">{recording.callee_number}</div>
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          <div>{format(new Date(recording.date_time), 'yyyy/MM/dd HH:mm')}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(recording.end_time), 'HH:mm')}
                          </div>
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          {Math.floor(recording.duration / 60)}:{(recording.duration % 60).toString().padStart(2, '0')}
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          {recording.recording_type}
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          {recording.site.name}
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => handleDownload(recording)}
                            title="Download recording"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrapper>

              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItems}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
