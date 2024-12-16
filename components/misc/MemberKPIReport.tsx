'use client';

import { useCallback, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import BaseKPIReport, { Column, ColumnGroup } from './BaseKPIReport';
import { format } from 'date-fns';

interface MemberKPIReportProps {
  user: User;
}

// Monthly targets (same as CompanyKPIReport)
const CR_MONTHLY_TARGET = 2500;
const CDD_MONTHLY_TARGET = 1800;
const IV_MONTHLY_TARGET = 900;
const REVENUE_MONTHLY_TARGET = 800000;
const NET_REVENUE_MONTHLY_TARGET = 600000;

interface MemberKPIData {
  recruiter: string;
  badge: boolean;
  region: 'Global' | 'JP';
  pm: string;
  resource_allocation: number;
  call_request_actual: number;
  call_request_actual_accum: number;
  call_request_achievement: number;
  candidate_actual: number;
  candidate_actual_accum: number;
  candidate_achievement: number;
  candidate_from_db: number;
  expert_actual: number;
  expert_actual_accum: number;
  expert_achievement: number;
  revenue: number;
  revenue_accum: number;
  revenue_achievement: number;
  net_revenue: number;
  net_revenue_accum: number;
  net_revenue_achievement: number;
}

const columnGroups: ColumnGroup[] = [
  { title: '', colspan: 5 }, // For frozen columns
  { title: 'Call Request (On-Going)', colspan: 5 },
  { title: 'Candidate', colspan: 6 },
  { title: 'Expert', colspan: 12 }
];

const columnSubgroups: { [key: string]: ColumnGroup[] } = {
  '': [ // For frozen columns
    { title: '', colspan: 5 }
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
  { key: 'recruiter', title: 'Recruiter', frozen: true, group: '', subgroup: '' },
  { key: 'badge', title: 'Badge', frozen: true, group: '', subgroup: '' },
  { key: 'region', title: 'Region', frozen: true, group: '', subgroup: '' },
  { key: 'pm', title: 'PM', frozen: true, group: '', subgroup: '' },
  { key: 'resource_allocation', title: 'RA', frozen: true, group: '', subgroup: '' },
  
  // Rest of the columns remain the same as CompanyKPIReport
  { key: 'call_request_target_daily', title: 'Daily', group: 'Call Request (On-Going)', subgroup: 'Target' },
  { key: 'call_request_target_accum', title: 'Accum', group: 'Call Request (On-Going)', subgroup: 'Target' },
  { key: 'call_request_actual', title: 'On-Going', group: 'Call Request (On-Going)', subgroup: 'Actual(On-Going)' },
  { key: 'call_request_actual_accum', title: 'Accum', group: 'Call Request (On-Going)', subgroup: 'Actual(On-Going)' },
  { key: 'call_request_achievement', title: '%', group: 'Call Request (On-Going)', subgroup: 'Actual(On-Going)' },
  
  { key: 'candidate_target_daily', title: 'Daily', group: 'Candidate', subgroup: 'Target' },
  { key: 'candidate_target_accum', title: 'Accum', group: 'Candidate', subgroup: 'Target' },
  { key: 'candidate_actual', title: 'Proposed', group: 'Candidate', subgroup: 'Actual' },
  { key: 'candidate_actual_accum', title: 'Accum', group: 'Candidate', subgroup: 'Actual' },
  { key: 'candidate_achievement', title: '%', group: 'Candidate', subgroup: 'Actual' },
  { key: 'candidate_from_db', title: 'DB', group: 'Candidate', subgroup: 'Actual' },
  
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

// Mock data based on the image
const mockData: MemberKPIData[] = [
  {
    recruiter: 'Zoe',
    badge: false,
    region: 'Global',
    pm: 'Zoe',
    resource_allocation: 0,
    call_request_actual: 10,
    call_request_actual_accum: 50,
    call_request_achievement: 45,
    candidate_actual: 8,
    candidate_actual_accum: 40,
    candidate_achievement: 42,
    candidate_from_db: 5,
    expert_actual: 4,
    expert_actual_accum: 20,
    expert_achievement: 38,
    revenue: 50000,
    revenue_accum: 250000,
    revenue_achievement: 35,
    net_revenue: 35000,
    net_revenue_accum: 175000,
    net_revenue_achievement: 32
  },
  // Add more mock data for other recruiters from the image
//   {
//     recruiter: 'Sheila',
//     badge: false,
//     region: 'Global',
//     pm: 'Zoe',
//     resource_allocation: 1.0,
//     // ... add rest of the data
//   },
  // ... add more recruiters
];

export default function MemberKPIReport({ user }: MemberKPIReportProps) {
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = useCallback(async (yyyymm: string): Promise<MemberKPIData[]> => {
    try {
      setLoading(true);
      // In real implementation, fetch from API
      // For now, return mock data
      return mockData;
    } catch (error) {
      console.error('Error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const formatValue = useCallback((key: string, value: any) => {
    if (value === null) return '-';
    
    if (key === 'badge') {
      return value ? '✓' : '';
    }
    if (key === 'resource_allocation') {
      return `${(value * 100).toFixed(0)}%`;
    }
    if (key.includes('achievement')) {
      return `${value?.toFixed(1)}%`;
    }
    if (key.includes('revenue')) {
      return value ? `$${value.toLocaleString()}` : '-';
    }
    return value?.toString() || '-';
  }, []);

  return (
    <BaseKPIReport
      user={user}
      title="Member KPI"
      fetchData={fetchData}
      columns={columns}
      columnGroups={columnGroups}
      columnSubgroups={columnSubgroups}
      formatValue={formatValue}
    />
  );
} 