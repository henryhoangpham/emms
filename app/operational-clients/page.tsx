import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import OperationalClientList from '@/components/misc/OperationalClientList';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default async function OperationalClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="h-screen">
      <DashboardLayout user={user}>
        <OperationalClientList user={user} />
      </DashboardLayout>
    </div>
  );
} 