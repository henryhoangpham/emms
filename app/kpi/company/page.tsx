import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import CompanyKPIReport from '@/components/misc/CompanyKPIReport';

export default async function CompanyKPIPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="h-screen">
      <DashboardLayout user={user}>
        <CompanyKPIReport user={user} />
      </DashboardLayout>
    </div>
  );
} 