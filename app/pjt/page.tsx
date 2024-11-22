import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import PJTDataList from '@/components/misc/PJTDataList';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
export default async function PJTDataPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="h-screen">
      <DashboardLayout user={user}>
        <PJTDataList user={user} />
      </DashboardLayout>
    </div>
  );
}