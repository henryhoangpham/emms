'use client'

import { User } from '@supabase/supabase-js'
import { useState } from 'react'
import EmployeesPage from "@/components/misc/EmployeesPage"
import ClientsPage from "@/components/misc/ClientsPage"
import ProjectsPage from "@/components/misc/ProjectsPage"
import KnowledgePage from "@/components/misc/KnowledgePage"
import AllocationsPage from "@/components/misc/AllocationsPage"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import MasterDataList from '@/components/misc/MasterDataList';
import PJTDataList from '@/components/misc/PJTDataList';
import OperationalClientList from '@/components/misc/OperationalClientList';
import BIOCreator from '@/components/misc/BIOCreator';
import ZoomPhoneRecordingsList from '../misc/ZoomPhoneRecordingsList'

export default function HomePage({ user }: { user: User }) {
  const [activeTab, setActiveTab] = user.email === 'zoom@arches-global.com' ? useState('phone-recordings') : useState('bio-creator');

  return (
    <DashboardLayout user={user}>
      {/* {activeTab === 'allocations' && <AllocationsPage user={user} />}
      {activeTab === 'employees' && <EmployeesPage user={user} />}
      {activeTab === 'clients' && <ClientsPage user={user} />}
      {activeTab === 'projects' && <ProjectsPage user={user} />}
      {activeTab === 'knowledge' && <KnowledgePage user={user} />} */}
      {activeTab === 'pjt' && <PJTDataList user={user} />}
      {activeTab === 'master' && <MasterDataList user={user} />}
      {activeTab === 'operational-clients' && <OperationalClientList user={user} />}
      {activeTab === 'bio-creator' && <BIOCreator user={user} />}
      {activeTab === 'phone-recordings' && <ZoomPhoneRecordingsList user={user} />}
    </DashboardLayout>
  );
} 