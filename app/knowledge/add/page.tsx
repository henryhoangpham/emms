import AddKnowledgeForm from '@/components/misc/AddKnowledgeForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getUser } from '@/utils/supabase/queries';
import { toast } from '@/components/ui/use-toast';

export default async function AddKnowledge() {
  const supabase = createClient();
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
    return redirect('/knowledge');
  }

  if (!user) {
    return redirect('/auth/signin');
  }

  return (
    <div className="h-screen">
      <DashboardLayout user={user}>
        <AddKnowledgeForm knowledgeId={null} />
      </DashboardLayout>
    </div>
  );
} 