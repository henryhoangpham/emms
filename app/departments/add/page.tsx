'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import AddDepartmentForm from '@/components/misc/AddDepartmentForm';
import { useToast } from '@/components/ui/use-toast';

export default function AddDepartment() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

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
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen">
      <DashboardLayout user={user}>
        <AddDepartmentForm departmentId={null} />
      </DashboardLayout>
    </div>
  );
} 