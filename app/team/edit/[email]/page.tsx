import EditTeamMemberForm from '@/components/misc/EditTeamMemberForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getUser, getTeamMember, TeamMember } from '@/utils/supabase/queries';

export default async function EditTeamMember({ params }: { params: { email: string } }) {
  const supabase = await createClient();
  const user = await getUser(supabase);
  
  if (!user) {
    redirect('/auth/signin');
  }

  const email: string = decodeURIComponent(params.email);
  const member: TeamMember | null = await getTeamMember(supabase, email);

  if (!member) {
    redirect('/team');
  }

  return (
    <div className="h-screen">
      <DashboardLayout user={user}>
        <EditTeamMemberForm member={member} />
      </DashboardLayout>
    </div>
  );
} 