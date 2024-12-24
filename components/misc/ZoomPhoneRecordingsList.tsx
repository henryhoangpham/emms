'use client';

import { useCallback, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { DEFAULT_ITEMS_PER_PAGE, ITEMS_PER_PAGE_OPTIONS } from '@/utils/constants';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { TableWrapper } from '@/components/ui/table-wrapper';
import { getZoomPhoneRecordings, PhoneRecording, PhoneRecordingFilters } from '@/utils/supabase/queries';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import { addDays, startOfDay, endOfDay } from "date-fns";

interface ZoomPhoneRecordingListProps {
  user: User;
}

export default function ZoomPhoneRecordingsList({ user }: ZoomPhoneRecordingListProps) {
  const [phoneRecordings, setPhoneRecordings] = useState<PhoneRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string>('');
  const [pageTokens, setPageTokens] = useState<string[]>(['']); // Store tokens for each page
  const [selectedRecordings, setSelectedRecordings] = useState<Set<string>>(new Set());
  const [downloadingRecordings, setDownloadingRecordings] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const fetchRecordings = useCallback(async () => {
    try {
      setLoading(true);
      const pageToken = pageTokens[currentPage - 1] || '';
      
      const filters: PhoneRecordingFilters = {
        dateFrom: dateFrom,
        dateTo: dateTo
      };

      const data = await getZoomPhoneRecordings(pageToken, itemsPerPage, filters);
      console.log('filters', filters);
      console.log('recordings data', data);
      
      setPhoneRecordings(data.phone_recordings);
      setTotalItems(data.total_records);
      setNextPageToken(data.next_page_token);

      if (data.next_page_token && !pageTokens[currentPage]) {
        setPageTokens(prev => {
          const next = [...prev];
          next[currentPage] = data.next_page_token;
          return next;
        });
      }

      setSelectedRecordings(new Set());
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
  }, [currentPage, itemsPerPage, pageTokens, toast, dateFrom, dateTo]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const formatFileName = (recording: PhoneRecording) => {
    return `phone_${format(new Date(recording.date_time), 'yyyyMMdd_HHmmss')}_${recording.caller_number}_${recording.callee_number}.mp3`;
  };

  const handleDownload = async (recording: PhoneRecording) => {
    try {
      setDownloadingRecordings(prev => new Set(prev).add(recording.id));
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
    } finally {
      setDownloadingRecordings(prev => {
        const next = new Set(prev);
        next.delete(recording.id);
        return next;
      });
    }
  };

  const handleBulkDownload = async () => {
    const selectedRecordingsList = phoneRecordings.filter(r => selectedRecordings.has(r.id));
    
    for (const recording of selectedRecordingsList) {
      await handleDownload(recording);
      // Add a small delay between downloads to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const toggleAllRecordings = (checked: boolean) => {
    if (checked) {
      setSelectedRecordings(new Set(phoneRecordings.map(r => r.id)));
    } else {
      setSelectedRecordings(new Set());
    }
  };

  const toggleRecording = (recordingId: string) => {
    setSelectedRecordings(prev => {
      const next = new Set(prev);
      if (next.has(recordingId)) {
        next.delete(recordingId);
      } else {
        next.add(recordingId);
      }
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    // Only allow moving one page at a time
    if (Math.abs(newPage - currentPage) > 1) {
      return;
    }

    // For next page, check if we have the token
    if (newPage > currentPage && !nextPageToken) {
      return;
    }

    // For previous page, only allow if we're not on first page
    if (newPage < currentPage && currentPage === 1) {
      return;
    }

    setCurrentPage(newPage);
  };

  const formatDateRange = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    return {
      date: format(start, 'yyyy/MM/dd'),
      timeRange: `${format(start, 'HH:mm')} ~ ${format(end, 'HH:mm')}`
    };
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setPageTokens(['']); // Reset page tokens
    setNextPageToken('');
  };

  const resetFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const allSelected = phoneRecordings.length > 0 && phoneRecordings.every(r => selectedRecordings.has(r.id));
  const someSelected = selectedRecordings.size > 0;

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Phone Recordings</CardTitle>
          {someSelected && (
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleBulkDownload}
              disabled={downloadingRecordings.size > 0}
            >
              {downloadingRecordings.size > 0 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download Selected ({selectedRecordings.size})
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="mb-4 flex justify-end">
            <Button
              variant="outline"
              onClick={resetFilters}
              size="sm"
            >
              Reset Filters
            </Button>
          </div>

          <TableWrapper>
            <table className="w-full">
              <thead>
                <tr className="text-left bg-muted">
                  <th className="p-2 whitespace-nowrap">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAllRecordings}
                      aria-label="Select all recordings"
                      disabled={loading}
                    />
                  </th>
                  <th className="p-2 whitespace-nowrap">Direction</th>
                  <th className="p-2 whitespace-nowrap">Caller</th>
                  <th className="p-2 whitespace-nowrap">Callee</th>
                  <th className="p-2 whitespace-nowrap">Date & Time</th>
                  <th className="p-2 whitespace-nowrap">Duration</th>
                  <th className="p-2 whitespace-nowrap">Type</th>
                  <th className="p-2 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </td>
                  </tr>
                ) : phoneRecordings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      No phone recordings found
                    </td>
                  </tr>
                ) : (
                  phoneRecordings.map((recording) => (
                    <tr 
                      key={recording.id}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="p-2 whitespace-nowrap">
                        <Checkbox
                          checked={selectedRecordings.has(recording.id)}
                          onCheckedChange={() => toggleRecording(recording.id)}
                          aria-label={`Select recording ${recording.id}`}
                        />
                      </td>
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
                        {recording.date_time && recording.end_time && (
                          <>
                            <div className="font-medium">
                              {formatDateRange(recording.date_time, recording.end_time).date}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDateRange(recording.date_time, recording.end_time).timeRange}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {Math.floor(recording.duration / 60)}:{(recording.duration % 60).toString().padStart(2, '0')}
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {recording.recording_type}
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => handleDownload(recording)}
                          disabled={downloadingRecordings.has(recording.id)}
                          title="Download recording"
                        >
                          {downloadingRecordings.has(recording.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrapper>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
              </div>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => handleItemsPerPageChange(Number(value))}
                disabled={loading}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!nextPageToken || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
