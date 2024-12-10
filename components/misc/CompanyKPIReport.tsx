'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import BaseKPIReport, { Column, ColumnGroup } from './BaseKPIReport';
import { getCompanyKPI } from '@/utils/supabase/queries';
import { eachDayOfInterval, endOfMonth, format, isWeekend, startOfMonth } from 'date-fns';

interface CompanyKPIReportProps {
  user: User;
}

// Monthly targets
const CR_MONTHLY_TARGET = 2500; // Call Request monthly target
const CDD_MONTHLY_TARGET = 1800; // Candidate monthly target
const IV_MONTHLY_TARGET = 900;  // Interview monthly target
const REVENUE_MONTHLY_TARGET = 800000; // Example target, adjust as needed
const NET_REVENUE_MONTHLY_TARGET = 600000; // Example target, adjust as needed

interface DailyTargetData {
  date: string;
  day: string;
  target_progress: number;
  target_progress_accum: number;
  call_request_target_daily: number;
  call_request_target_accum: number;
  candidate_target_daily: number;
  candidate_target_accum: number;
  expert_target_daily: number;
  expert_target_accum: number;
}

interface ActualKPIData {
  call_request_actual: number | undefined;
  call_request_actual_accum: number | undefined;
  call_request_achievement: number | undefined;
  candidate_actual: number | undefined;
  candidate_actual_accum: number | undefined;
  candidate_achievement: number | undefined;
  candidate_from_db: number | undefined;
  expert_actual: number | undefined;
  expert_actual_accum: number | undefined;
  expert_achievement: number | undefined;
  revenue: number | undefined;
  revenue_accum: number | undefined;
  revenue_achievement: number | undefined;
  net_revenue: number | undefined;
  net_revenue_accum: number | undefined;
  net_revenue_achievement: number | undefined;
}

type CompanyKPIData = DailyTargetData & ActualKPIData;

const columnGroups: ColumnGroup[] = [
  { title: '', colspan: 4 }, // For frozen columns
  { title: 'Call Request (On-Going)', colspan: 5 },
  { title: 'Candidate', colspan: 6 },
  { title: 'Expert', colspan: 12 }
];

const columnSubgroups: { [key: string]: ColumnGroup[] } = {
  '': [ // For frozen columns
    { title: '', colspan: 4 }
  ],
  'Call Request (On-Going)': [
    { title: 'Target', colspan: 2 },
    { title: 'Actual(On-Going)', colspan: 3 }
  ],
  'Candidate': [
    { title: 'Target', colspan: 2 },
    { title: 'Actual', colspan: 4 },
  ],
  'Expert': [
    { title: 'Target', colspan: 2 },
    { title: 'Actual(Arranged IV)', colspan: 3 },
    { title: 'Revenue', colspan: 3 },
    { title: 'Net Revenue', colspan: 3 }
  ]
};

const columns: Column[] = [
  // Frozen columns
  { key: 'date', title: 'Date', frozen: true, group: '', subgroup: '' },
  { key: 'day', title: 'Day', frozen: true, group: '', subgroup: '' },
  { key: 'target_progress', title: 'Target Progress', frozen: true, group: '', subgroup: '' },
  { key: 'target_progress_accum', title: 'Target Progress', frozen: true, group: '', subgroup: '' },
  
  // Call Request (On-Going)
  { key: 'call_request_target_daily', title: 'Daily', group: 'Call Request (On-Going)', subgroup: 'Target' },
  { key: 'call_request_target_accum', title: 'Accum', group: 'Call Request (On-Going)', subgroup: 'Target' },
  { key: 'call_request_actual', title: 'On-Going', group: 'Call Request (On-Going)', subgroup: 'Actual(On-Going)' },
  { key: 'call_request_actual_accum', title: 'Accum', group: 'Call Request (On-Going)', subgroup: 'Actual(On-Going)' },
  { key: 'call_request_achievement', title: '%', group: 'Call Request (On-Going)', subgroup: 'Actual(On-Going)' },
  
  // Candidate
  { key: 'candidate_target_daily', title: 'Daily', group: 'Candidate', subgroup: 'Target' },
  { key: 'candidate_target_accum', title: 'Accum', group: 'Candidate', subgroup: 'Target' },
  { key: 'candidate_actual', title: 'Proposed', group: 'Candidate', subgroup: 'Actual' },
  { key: 'candidate_actual_accum', title: 'Accum', group: 'Candidate', subgroup: 'Actual' },
  { key: 'candidate_achievement', title: '%', group: 'Candidate', subgroup: 'Actual' },
  { key: 'candidate_from_db', title: 'DB', group: 'Candidate', subgroup: '' },
  
  // Expert
  { key: 'expert_target_daily', title: 'Daily', group: 'Expert', subgroup: 'Target' },
  { key: 'expert_target_accum', title: 'Accum', group: 'Expert', subgroup: 'Target' },
  { key: 'expert_actual', title: 'Arranged', group: 'Expert', subgroup: 'Actual(Arranged IV)' },
  { key: 'expert_actual_accum', title: 'Accum', group: 'Expert', subgroup: 'Actual(Arranged IV)' },
  { key: 'expert_achievement', title: '%', group: 'Expert', subgroup: 'Actual(Arranged IV)' },
  { key: 'revenue', title: 'Arranged', group: 'Expert', subgroup: 'Revenue' },
  { key: 'revenue_accum', title: 'Accum', group: 'Expert', subgroup: 'Revenue' },
  { key: 'revenue_achievement', title: '%', group: 'Expert', subgroup: 'Revenue' },
  { key: 'net_revenue', title: 'Arranged', group: 'Expert', subgroup: 'Net Revenue' },
  { key: 'net_revenue_accum', title: 'Accum', group: 'Expert', subgroup: 'Net Revenue' },
  { key: 'net_revenue_achievement', title: '%', group: 'Expert', subgroup: 'Net Revenue' }
];

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

export default function CompanyKPIReport({ user }: CompanyKPIReportProps) {
  const [data, setData] = useState<CompanyKPIData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTH_OPTIONS[0]);
  const supabase = createClient();

  // Calculate daily targets based on selected month
  const calculateDailyTargets = useCallback((yyyymm: string): DailyTargetData[] => {
    const year = parseInt(yyyymm.substring(0, 4));
    const month = parseInt(yyyymm.substring(4, 6)) - 1; // 0-based month
    const startDate = startOfMonth(new Date(year, month));
    const endDate = endOfMonth(startDate);
    
    // Get all days of the month
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Count working days (excluding weekends)
    const workingDays = days.filter(day => !isWeekend(day)).length;
    
    // Calculate daily progress percentage for working days
    const dailyProgress = 100 / workingDays;
    
    // Calculate daily targets
    const dailyCRTarget = Math.round(CR_MONTHLY_TARGET / workingDays);
    const dailyCDDTarget = Math.round(CDD_MONTHLY_TARGET / workingDays);
    const dailyIVTarget = Math.round(IV_MONTHLY_TARGET / workingDays);

    // Generate daily data
    let progressAccum = 0;
    let crTargetAccum = 0;
    let cddTargetAccum = 0;
    let ivTargetAccum = 0;

    return days.map(date => {
      const isWorkingDay = !isWeekend(date);
      const dayProgress = isWorkingDay ? dailyProgress : 0;
      progressAccum += dayProgress;

      const crDaily = isWorkingDay ? dailyCRTarget : 0;
      crTargetAccum += crDaily;

      const cddDaily = isWorkingDay ? dailyCDDTarget : 0;
      cddTargetAccum += cddDaily;

      const ivDaily = isWorkingDay ? dailyIVTarget : 0;
      ivTargetAccum += ivDaily;

      return {
        date: format(date, 'yyyy-MM-dd'),
        day: format(date, 'EEE'),
        target_progress: Number(dayProgress.toFixed(1)),
        target_progress_accum: Number(progressAccum.toFixed(1)),
        call_request_target_daily: crDaily,
        call_request_target_accum: crTargetAccum,
        candidate_target_daily: cddDaily,
        candidate_target_accum: cddTargetAccum,
        expert_target_daily: ivDaily,
        expert_target_accum: ivTargetAccum
      };
    });
  }, []);

  // Load data in two steps
  const fetchData = useCallback(async (yyyymm: string): Promise<CompanyKPIData[]> => {
    try {
      setLoading(true);

      // Step 1: Calculate daily targets
      const dailyTargets = calculateDailyTargets(yyyymm);
      
      // Step 2: Fetch actual KPI data
      const actualData = await getCompanyKPI(supabase, yyyymm);
      console.log('actualData', actualData);

      // Step 3: Calculate accumulations
      let callRequestAccum = 0;
      let candidateAccum = 0;
      let expertAccum = 0;
      let revenueAccum = 0;
      let netRevenueAccum = 0;

      // Merge daily targets with actual data
      const mergedData = dailyTargets.map(dayData => {
        const actualDay = actualData.find(d => d.date === dayData.date);
        
        // Calculate accumulations
        if (actualDay) {
          callRequestAccum += actualDay.call_request_actual;
          candidateAccum += actualDay.candidate_actual;
          expertAccum += actualDay.expert_actual;
          revenueAccum += actualDay.revenue;
          netRevenueAccum += actualDay.net_revenue;
        }

        // Calculate achievements
        const callRequestAchievement = dayData.call_request_target_accum > 0 
          ? (callRequestAccum / dayData.call_request_target_accum) * 100 
          : 0;

        const candidateAchievement = dayData.candidate_target_accum > 0 
          ? (candidateAccum / dayData.candidate_target_accum) * 100 
          : 0;

        const expertAchievement = dayData.expert_target_accum > 0 
          ? (expertAccum / dayData.expert_target_accum) * 100 
          : 0;


        const revenueAchievement = REVENUE_MONTHLY_TARGET > 0 
          ? (revenueAccum / REVENUE_MONTHLY_TARGET) * 100 
          : 0;

        const netRevenueAchievement = NET_REVENUE_MONTHLY_TARGET > 0 
          ? (netRevenueAccum / NET_REVENUE_MONTHLY_TARGET) * 100 
          : 0;

        return {
          ...dayData,
          call_request_actual: actualDay?.call_request_actual,
          call_request_actual_accum: callRequestAccum,
          call_request_achievement: callRequestAchievement,
          candidate_actual: actualDay?.candidate_actual,
          candidate_actual_accum: candidateAccum,
          candidate_achievement: candidateAchievement,
          candidate_from_db: actualDay?.candidate_actual_from_db,
          expert_actual: actualDay?.expert_actual,
          expert_actual_accum: expertAccum,
          expert_achievement: expertAchievement,
          revenue: actualDay?.revenue,
          revenue_accum: revenueAccum,
          revenue_achievement: revenueAchievement,
          net_revenue: actualDay?.net_revenue,
          net_revenue_accum: netRevenueAccum,
          net_revenue_achievement: netRevenueAchievement
        };
      });

      setData(mergedData);
      console.log('mergedData', mergedData);
      return mergedData;
    } catch (error) {
      console.error('Error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [calculateDailyTargets, supabase]);

  const formatValue = useCallback((key: string, value: any) => {
    if (value === null) return '-';
    
    if (key.includes('achievement') || key.includes('progress')) {
      return `${value?.toFixed(1)}%`;
    }
    if (key === 'date') {
      return value;
    }
    if (key === 'day') {
      return value;
    }
    if (key.includes('revenue')) {
      return value ? `$${value.toLocaleString()}` : '-';
    }
    return value?.toString() || '-';
  }, []);

  const getRowClassName = useCallback((data: CompanyKPIData) => {
    const date = new Date(data.date);
    const today = new Date();
    const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    
    if (isToday) {
      // Use the main theme color with opacity for today's row
      return 'bg-primary/20';
    }
    
    // Make weekends darker than before
    return isWeekend(date) ? 'bg-muted/90' : '';
  }, []);

  return (
    <BaseKPIReport
      user={user}
      title="Company KPI"
      fetchData={fetchData}
      columns={columns}
      columnGroups={columnGroups}
      columnSubgroups={columnSubgroups}
      formatValue={formatValue}
      getRowClassName={getRowClassName}
    />
  );
} 