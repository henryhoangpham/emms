'use client';

import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { User } from '@supabase/supabase-js';
import { useState, Suspense } from 'react';

interface DashboardLayoutProps {
  user: User;
  children: React.ReactNode;
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col">
        <Navbar user={user} onMenuClick={() => {}} />
        <main className="flex-1 p-4 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}