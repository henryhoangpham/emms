'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AddProjectForm from '@/components/misc/AddProjectForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/components/ui/use-toast';

export default function EditProject() {
  const { user, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.id as string;

  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Error",
        description: "Please sign in to access this page.",
        variant: "destructive",
      });
      router.push('/auth/signin');
    }
  }, [user, loading, router, toast]);

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

  return (
    <div className="h-screen">
      <DashboardLayout user={user}>
        <AddProjectForm 
          projectId={projectId} 
          user={user}
        />
      </DashboardLayout>
    </div>
  );
}