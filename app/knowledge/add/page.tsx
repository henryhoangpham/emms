'use client';

import { useAuth } from '@/hooks/useAuth';
import AddKnowledgeForm from '@/components/misc/AddKnowledgeForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function AddKnowledge() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen">
      <DashboardLayout user={user}>
        <AddKnowledgeForm knowledgeId={null} />
      </DashboardLayout>
    </div>
  );
} 