import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import BIOCreator from '@/components/misc/BIOCreator';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default async function BIOCreatorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="h-screen">
      <DashboardLayout user={user}>
        <BIOCreator user={user} />
      </DashboardLayout>
    </div>
  );
} 