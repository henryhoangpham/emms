import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/queries';
import AddClientForm from '@/components/misc/AddClientForm';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';

export default async function EditClient({ params }: { params: { id: string } }) {
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
    return redirect('/clients');
  }

  if (!user) {
    return redirect('/auth/signin');
  }

  return (
    <div className="h-screen">
      <DashboardLayout user={user}>
        <AddClientForm clientId={params.id} />
      </DashboardLayout>
    </div>
  );
}