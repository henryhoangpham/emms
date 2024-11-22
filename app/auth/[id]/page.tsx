'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import HomePage from '@/components/home/HomePage';

interface PageProps {
  params: {
    id: string;
  };
}

export default function AuthPage() {
  const { user, loading } = useAuth();
  const params = useParams();
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
      <HomePage user={user} />
    </div>
  );
}
