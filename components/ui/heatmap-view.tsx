'use client'

import { useMemo } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addWeeks, isSameMonth } from 'date-fns';
import { cn } from '@/utils/cn';

interface Allocation {
  id: string;
  employee_name: string;
  project_name: string;
  start_date: string;
  end_date: string;
  allocation_percentage: number;
}

interface HeatmapViewProps {
  allocations: Allocation[];
  weeks?: number; // Number of weeks to display
}

export function HeatmapView({ allocations, weeks = 12 }: HeatmapViewProps) {
  // Generate weeks array for the heatmap
  const weeksArray = useMemo(() => {
    const result = [];
    const today = new Date();
    const startDate = startOfWeek(today);

    for (let i = 0; i < weeks; i++) {
      const weekStart = addWeeks(startDate, i);
      const weekEnd = endOfWeek(weekStart);
      result.push({
        start: weekStart,
        end: weekEnd,
        days: eachDayOfInterval({ start: weekStart, end: weekEnd })
      });
    }
    return result;
  }, [weeks]);

  // Calculate workload for each employee per week
  const employeeWorkload = useMemo(() => {
    const workload: Record<string, Record<string, number>> = {};

    allocations.forEach(allocation => {
      const employeeName = allocation.employee_name;
      if (!workload[employeeName]) {
        workload[employeeName] = {};
      }

      weeksArray.forEach(week => {
        const weekKey = format(week.start, 'yyyy-MM-dd');
        const allocationStart = new Date(allocation.start_date);
        const allocationEnd = new Date(allocation.end_date);

        // Check if allocation overlaps with this week
        if (allocationStart <= week.end && allocationEnd >= week.start) {
          workload[employeeName][weekKey] = (workload[employeeName][weekKey] || 0) + 
            allocation.allocation_percentage;
        }
      });
    });

    return workload;
  }, [allocations, weeksArray]);

  // Function to determine cell color based on workload
  const getCellColor = (workload: number) => {
    if (workload === 0) return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400';
    if (workload <= 50) return 'bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-100';
    if (workload <= 80) return 'bg-yellow-200 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-100';
    if (workload <= 100) return 'bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100';
    return 'bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-100';
  };

  // Get unique employee names
  const employees = Object.keys(employeeWorkload).sort();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        {/* Header */}
        <div className="flex">
          <div className="w-48 shrink-0 p-2 font-medium border-b dark:border-zinc-700">Employee</div>
          <div className="flex">
            {weeksArray.map((week, index) => (
              <div 
                key={index}
                className={cn(
                  "w-12 text-center text-xs p-1 border-b dark:border-zinc-700",
                  isSameMonth(week.start, new Date()) 
                    ? "bg-blue-50 dark:bg-blue-950/30" 
                    : ""
                )}
              >
                {format(week.start, 'MMM d')}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        {employees.map(employee => (
          <div key={employee} className="flex border-b dark:border-zinc-700">
            <div className="w-48 shrink-0 p-2 truncate" title={employee}>
              {employee}
            </div>
            <div className="flex">
              {weeksArray.map((week, index) => {
                const weekKey = format(week.start, 'yyyy-MM-dd');
                const workload = employeeWorkload[employee][weekKey] || 0;
                return (
                  <div
                    key={index}
                    className={cn(
                      "w-12 h-12 border-r dark:border-zinc-700 flex items-center justify-center text-xs",
                      getCellColor(workload)
                    )}
                    title={`${employee}: ${workload}% (${format(week.start, 'MMM d')})`}
                  >
                    {workload > 0 && workload}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-4 h-4 rounded",
            "bg-green-200 dark:bg-green-900/50"
          )}></div>
          <span>≤ 50%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-4 h-4 rounded",
            "bg-yellow-200 dark:bg-yellow-900/50"
          )}></div>
          <span>51-80%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-4 h-4 rounded",
            "bg-orange-200 dark:bg-orange-900/50"
          )}></div>
          <span>81-100%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-4 h-4 rounded",
            "bg-red-200 dark:bg-red-900/50"
          )}></div>
          <span>&gt; 100%</span>
        </div>
      </div>
    </div>
  );
} 