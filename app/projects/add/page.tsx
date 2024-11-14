import AddProjectForm from '@/components/misc/AddProjectForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { createClient } from '@/utils/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { getUser } from '@/utils/supabase/queries';
import { toast } from '@/components/ui/use-toast';

export default async function AddProject() {
  const supabase: SupabaseClient = createClient();
  let user;

  try {
    user = await getUser(supabase);
  } catch (error) {
    console.error("Error fetching user:", error);
    toast({
      title: "Error",
      description: "Failed to fetch user data. Please try again.",
      variant: "destructive",
    });
    return redirect('/projects');
  }

  if (!user) {
    return redirect('/auth/signin');
  }

  return (
    <DashboardLayout user={user}>
      <AddProjectForm projectId={null}/>
    </DashboardLayout>
  );
}