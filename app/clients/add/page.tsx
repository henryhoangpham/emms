'use client';

import { useAuth } from '@/hooks/useAuth';
import AddClientForm from '@/components/misc/AddClientForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function AddClient() {
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
        <AddClientForm clientId={null} />
      </DashboardLayout>
    </div>
  );
}