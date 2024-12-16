import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ExpertsList from '@/components/misc/ExpertsList';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default async function ExpertsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="h-screen">
      <DashboardLayout user={user}>
        <ExpertsList user={user} />
      </DashboardLayout>
    </div>
  );
} 