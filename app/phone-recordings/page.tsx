import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import ZoomPhoneRecordingsList from '@/components/misc/ZoomPhoneRecordingsList';

export default async function ZoomPhoneRecordingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="h-screen">
      <DashboardLayout user={user}>
        <ZoomPhoneRecordingsList user={user} />
      </DashboardLayout>
    </div>
  );
} 