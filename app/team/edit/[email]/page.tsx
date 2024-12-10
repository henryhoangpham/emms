'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import EditTeamMemberForm from '@/components/misc/EditTeamMemberForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/utils/supabase/client';
import { getTeamMember, TeamMember } from '@/utils/supabase/queries';

export default function EditTeamMember() {
  const { user, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const email = decodeURIComponent(params.email as string);
  const [member, setMember] = useState<TeamMember | null>(null);


  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Error",
        description: "Please sign in to access this page.",
        variant: "destructive",
      });
      router.push('/auth/signin');
    }

    // Fetch team member data
    const fetchMember = async () => {
      try {
        const supabase = createClient();
        const member = await getTeamMember(supabase, email);
        if (!member) {
          toast({
            title: "Error",
            description: "Team member not found.",
            variant: "destructive",
          });
          router.push('/team');
        }
        setMember(member);
      } catch (error) {
        console.error('Error fetching team member:', error);
        toast({
          title: "Error",
          description: "Failed to load team member data.",
          variant: "destructive",
        });
        router.push('/team');
      }
    };

    if (user) {
      fetchMember();
    }
  }, [user, loading, router, toast, email]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!member) {
    return null;
  }

  return (
    <div className="h-screen">
      <DashboardLayout user={user}>
        <EditTeamMemberForm member={member} />
      </DashboardLayout>
    </div>
  );
}
