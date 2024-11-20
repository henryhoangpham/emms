'use client'

import { useMemo, useState } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addWeeks, isSameMonth } from 'date-fns';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Allocation {
  id: string;
  employee_name: string;
  project_name: string;
  start_date: string;
  end_date: string;
  allocation_percentage: number;
}

interface ProjectHeatmapViewProps {
  allocations: Allocation[];
  weeks?: number;
}

export function ProjectHeatmapView({ allocations, weeks = 24 }: ProjectHeatmapViewProps) {
  const [startWeekOffset, setStartWeekOffset] = useState(0);

  // Generate weeks array for the heatmap
  const weeksArray = useMemo(() => {
    const result = [];
    const today = new Date();
    const startDate = startOfWeek(addWeeks(today, startWeekOffset));

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
  }, [weeks, startWeekOffset]);

  // Calculate workload for each project per week
  const projectWorkload = useMemo(() => {
    const workload: Record<string, Record<string, { total: number; employees: string[] }>> = {};

    allocations.forEach(allocation => {
      const projectName = allocation.project_name;
      if (!workload[projectName]) {
        workload[projectName] = {};
      }

      weeksArray.forEach(week => {
        const weekKey = format(week.start, 'yyyy-MM-dd');
        const allocationStart = new Date(allocation.start_date);
        const allocationEnd = new Date(allocation.end_date);

        // Check if allocation overlaps with this week
        if (allocationStart <= week.end && allocationEnd >= week.start) {
          if (!workload[projectName][weekKey]) {
            workload[projectName][weekKey] = { total: 0, employees: [] };
          }
          workload[projectName][weekKey].total += allocation.allocation_percentage;
          workload[projectName][weekKey].employees.push(allocation.employee_name);
        }
      });
    });

    return workload;
  }, [allocations, weeksArray]);

  // Function to determine cell color based on total allocation
  const getCellColor = (workload: number) => {
    if (workload === 0) return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400';
    if (workload <= 100) return 'bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-100';
    if (workload <= 200) return 'bg-yellow-200 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-100';
    if (workload <= 300) return 'bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100';
    return 'bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-100';
  };

  // Get unique project names
  const projects = Object.keys(projectWorkload).sort();

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between mb-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setStartWeekOffset(startWeekOffset - weeks)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setStartWeekOffset(startWeekOffset + weeks)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="min-w-max">
        {/* Header */}
        <div className="flex">
          <div className="w-48 shrink-0 p-2 font-medium border-b dark:border-zinc-700">Project</div>
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
        {projects.map(project => (
          <div key={project} className="flex border-b dark:border-zinc-700">
            <div className="w-48 shrink-0 p-2 truncate" title={project}>
              {project}
            </div>
            <div className="flex">
              {weeksArray.map((week, index) => {
                const weekKey = format(week.start, 'yyyy-MM-dd');
                const weekData = projectWorkload[project][weekKey] || { total: 0, employees: [] };
                const employeeCount = weekData.total / 100; // Convert percentage to number of employees
                return (
                  <div
                    key={index}
                    className={cn(
                      "w-12 h-12 border-r dark:border-zinc-700 flex items-center justify-center text-xs",
                      getCellColor(weekData.total)
                    )}
                    title={`${project}: ${employeeCount.toFixed(1)} employees
Employees: ${weekData.employees.join(', ')}
Week of ${format(week.start, 'MMM d')}`}
                  >
                    {employeeCount > 0 && employeeCount.toFixed(1)}
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
          <span>≤ 1.0</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-4 h-4 rounded",
            "bg-yellow-200 dark:bg-yellow-900/50"
          )}></div>
          <span>1.1-2.0</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-4 h-4 rounded",
            "bg-orange-200 dark:bg-orange-900/50"
          )}></div>
          <span>2.1-3.0</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-4 h-4 rounded",
            "bg-red-200 dark:bg-red-900/50"
          )}></div>
          <span>&gt; 3.0</span>
        </div>
      </div>
    </div>
  );
} 