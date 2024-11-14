'use client'

import { User } from '@supabase/supabase-js'
import { useState } from 'react'
import EmployeesPage from "@/components/misc/EmployeesPage"
import ClientsPage from "@/components/misc/ClientsPage"
import ProjectsPage from "@/components/misc/ProjectsPage"
import KnowledgePage from "@/components/misc/KnowledgePage"
import AllocationsPage from "@/components/misc/AllocationsPage"
import { DashboardLayout } from "@/components/layout/DashboardLayout"

export default function HomePage({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState('allocations');

  return (
    <DashboardLayout user={user}>
      {activeTab === 'allocations' && <AllocationsPage user={user} />}
      {activeTab === 'employees' && <EmployeesPage user={user} />}
      {activeTab === 'clients' && <ClientsPage user={user} />}
      {activeTab === 'projects' && <ProjectsPage user={user} />}
      {activeTab === 'knowledge' && <KnowledgePage user={user} />}
    </DashboardLayout>
  );
} 