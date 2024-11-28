import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ClientCombineStats2023 from '@/components/misc/ClientCombineStats2023';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default async function ClientStats2023Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="h-screen">
      <DashboardLayout user={user}>
        <ClientCombineStats2023 user={user} />
      </DashboardLayout>
    </div>
  );
} 