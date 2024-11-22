'use client';

import { useAuth } from '@/hooks/useAuth';
import AddEmployeeForm from '@/components/misc/AddEmployeeForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function AddEmployee() {
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
        <AddEmployeeForm employeeId={null} />
      </DashboardLayout>
    </div>
  );
}