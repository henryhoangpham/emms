import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ClientCombineStats from '@/components/misc/ClientCombineStats';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default async function ClientStatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="h-screen">
      <DashboardLayout user={user}>
        <ClientCombineStats user={user} />
      </DashboardLayout>
    </div>
  );
} 