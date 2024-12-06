'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Download } from "lucide-react";
import { format } from 'date-fns';
import { cn } from '@/utils/cn';

// Generate YYYYMM options from 202301 to current month
const MONTH_OPTIONS = (() => {
  const options: string[] = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  for (let year = 2023; year <= currentYear; year++) {
    const maxMonth = year === currentYear ? currentMonth : 12;
    for (let month = 1; month <= maxMonth; month++) {
      options.push(`${year}${month.toString().padStart(2, '0')}`);
    }
  }
  return options.reverse();
})();

export interface ColumnGroup {
  title: string;
  colspan: number;
}

export interface Column {
  key: string;
  title: string;
  frozen?: boolean;
  group?: string;
  subgroup?: string;
}

interface BaseKPIReportProps {
  user: User;
  title: string;
  fetchData: (yyyymm: string) => Promise<any[]>;
  columns: Column[];
  columnGroups: ColumnGroup[];
  columnSubgroups: { [key: string]: ColumnGroup[] };
  formatValue?: (key: string, value: any) => string;
  getRowClassName?: (data: any) => string;
}

export default function BaseKPIReport({ 
  user, 
  title,
  fetchData,
  columns,
  columnGroups,
  columnSubgroups,
  formatValue = (key: string, value: any) => value?.toString() || '-',
  getRowClassName
}: BaseKPIReportProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTH_OPTIONS[0]);
  const { toast } = useToast();

  const loadData = useCallback(async (yyyymm: string) => {
    try {
      setLoading(true);
      const result = await fetchData(yyyymm);
      setData(result);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch KPI data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchData, toast]);

  useEffect(() => {
    loadData(selectedMonth);
  }, [selectedMonth, loadData]);

  const handleExport = async () => {
    try {
      setLoading(true);
      toast({
        title: "Exporting...",
        description: "Please wait while we prepare your data.",
      });

      const csvData = [
        columns.map(col => col.title).join(','),
        ...data.map(row => 
          columns.map(col => 
            `"${formatValue(col.key, row[col.key])}"`
          ).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_${selectedMonth}.csv`);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  const frozenColumns = columns.filter(col => col.frozen);
  const scrollableColumns = columns.filter(col => !col.frozen);

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[120px]">
                <SelectValue>{selectedMonth}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
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
          <div className="relative overflow-auto">
            <div className="flex min-w-[800px]">
              {/* Frozen Columns */}
              {frozenColumns.length > 0 && (
                <div className="sticky left-0 z-10 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  <table className="w-auto">
                    <thead>
                      {/* Main Groups - First row */}
                      <tr className="bg-muted">
                        <th 
                          colSpan={frozenColumns.length}
                          className="p-2 text-center whitespace-nowrap text-xs font-medium border h-9"
                        >
                          {columnGroups[0].title}
                        </th>
                      </tr>
                      {/* Subgroups - Second row */}
                      <tr className="bg-muted">
                        <th 
                          colSpan={frozenColumns.length}
                          className="p-2 text-center whitespace-nowrap text-xs font-medium border h-9"
                        >
                          {columnSubgroups[''][0].title}
                        </th>
                      </tr>
                      {/* Column Headers - Third row */}
                      <tr className="bg-muted">
                        {frozenColumns.map(col => (
                          <th 
                            key={col.key} 
                            className="p-2 text-center whitespace-nowrap text-xs font-medium border h-9"
                          >
                            {col.title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, idx) => (
                        <tr key={idx} className={cn(
                          "border-b hover:bg-muted/50",
                          getRowClassName?.(row) || ''
                        )}>
                          {frozenColumns.map(col => (
                            <td 
                              key={col.key} 
                              className="p-2 text-xs border-r text-right"
                            >
                              {formatValue(col.key, row[col.key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Scrollable Columns */}
              <div className="flex-1 overflow-auto">
                <table className="w-full">
                  <thead>
                    {/* Main Groups */}
                    <tr className="bg-muted">
                      {columnGroups.slice(1).map((group, idx) => (
                        <th 
                          key={idx} 
                          colSpan={group.colspan}
                          className="p-2 text-center whitespace-nowrap text-xs font-medium border h-9"
                        >
                          {group.title}
                        </th>
                      ))}
                    </tr>
                    {/* Subgroups */}
                    <tr className="bg-muted">
                      {columnGroups.slice(1).map((group, idx) => {
                        const subgroups = columnSubgroups[group.title] || [{ title: '', colspan: group.colspan }];
                        return subgroups.map((subgroup, subIdx) => (
                          <th 
                            key={`${idx}-${subIdx}`} 
                            colSpan={subgroup.colspan}
                            className="p-2 text-center whitespace-nowrap text-xs font-medium border h-9"
                          >
                            {subgroup.title}
                          </th>
                        ));
                      })}
                    </tr>
                    {/* Column Headers */}
                    <tr className="bg-muted">
                      {scrollableColumns.map(col => (
                        <th 
                          key={col.key} 
                          className="p-2 text-center whitespace-nowrap text-xs font-medium border h-9"
                        >
                          {col.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, idx) => (
                      <tr key={idx} className={cn(
                        "border-b hover:bg-muted/50",
                        getRowClassName?.(row) || ''
                      )}>
                        {scrollableColumns.map(col => (
                          <td 
                            key={col.key} 
                            className="p-2 text-xs border-r text-right"
                          >
                            {formatValue(col.key, row[col.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 