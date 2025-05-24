'use client'

import { Button } from "@/components/ui/button";
import { Users, Briefcase, X, ChevronLeft, ChevronRight, Calendar, FolderTree, BookOpen, Database, BarChart, LineChart, UserCheck, Wrench, FileText, Video, MessageSquare } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { useState } from 'react';
import { User } from "@supabase/supabase-js";

interface SidebarProps {
  onClose?: () => void;
  user: User | null;
}

const shouldShowOnlyBioCreator = (user: User | null) => {
  return user?.email === 'bio-creator@arches-global.com';
};

const shouldShowOnlyZoomRecordings = (user: User | null) => {
  return user?.email === 'zoom@arches-global.com';
};

export function Sidebar({ onClose, user }: SidebarProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const isBioCreator = shouldShowOnlyBioCreator(user);
  const isZoomRecordings = shouldShowOnlyZoomRecordings(user);

  return (
    <aside className={`bg-card shadow-md flex flex-col h-full transition-all duration-300 ${
      isExpanded ? 'w-64' : 'w-20'
    }`}>
      <div className="p-4">
        {/* Logo and Title */}
        <div className="mb-8 flex items-center justify-between">
          <Logo iconOnly={!isExpanded} />
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hidden lg:flex"
            >
              {isExpanded ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {/* Show all navigation items if user is not restricted */}
          {!isBioCreator && !isZoomRecordings && (
            <>
              {/* Main Navigation */}
              <Link href="/pjt">
                <Button
                  variant={pathname?.startsWith('/pjt') ? "secondary" : "ghost"}
                  className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
                  title="PJT Data"
                >
                  <Database className="h-4 w-4" />
                  {isExpanded && <span className="ml-2">PJT</span>}
                </Button>
              </Link>
              <Link href="/master">
                <Button
                  variant={pathname?.startsWith('/master') ? "secondary" : "ghost"}
                  className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
                  title="Master Data 2024"
                >
                  <Database className="h-4 w-4" />
                  {isExpanded && <span className="ml-2">Master Data</span>}
                </Button>
              </Link>
              <Link href="/experts">
                <Button
                  variant={pathname?.startsWith('/experts') ? "secondary" : "ghost"}
                  className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
                  title="Experts Data"
                >
                  <UserCheck className="h-4 w-4" />
                  {isExpanded && <span className="ml-2">Experts</span>}
                </Button>
              </Link>
              <Link href="/operational-clients">
                <Button
                  variant={pathname?.startsWith('/operational-clients') ? "secondary" : "ghost"}
                  className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
                  title="Operational Clients"
                >
                  <Users className="h-4 w-4" />
                  {isExpanded && <span className="ml-2">Operational Clients</span>}
                </Button>
              </Link>
              <Link href="/client-stats">
                <Button
                  variant={pathname?.startsWith('/client-stats') ? "secondary" : "ghost"}
                  className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
                  title="Client Stats"
                >
                  <BarChart className="h-4 w-4" />
                  {isExpanded && <span className="ml-2">Client Stats</span>}
                </Button>
              </Link>

              {/* KPI Section */}
              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground px-2 py-1">
                  {isExpanded && "KPI Reports"}
                </div>

                <Link href="/kpi/company">
                  <Button
                    variant={pathname === '/kpi/company' ? "secondary" : "ghost"}
                    className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
                    title="Company KPI"
                  >
                    <LineChart className="h-4 w-4" />
                    {isExpanded && <span className="ml-2">Company</span>}
                  </Button>
                </Link>

                <Link href="/kpi/member">
                  <Button
                    variant={pathname === '/kpi/member' ? "secondary" : "ghost"}
                    className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
                    title="Member KPI"
                  >
                    <LineChart className="h-4 w-4" />
                    {isExpanded && <span className="ml-2">Member</span>}
                  </Button>
                </Link>

                <Link href="/kpi/rec-mngt">
                  <Button
                    variant={pathname === '/kpi/rec-mngt' ? "secondary" : "ghost"}
                    className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
                    title="Rec Mngt KPI"
                  >
                    <LineChart className="h-4 w-4" />
                    {isExpanded && <span className="ml-2">Rec Mngt</span>}
                  </Button>
                </Link>

                <Link href="/kpi/account">
                  <Button
                    variant={pathname === '/kpi/account' ? "secondary" : "ghost"}
                    className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
                    title="Account KPI"
                  >
                    <LineChart className="h-4 w-4" />
                    {isExpanded && <span className="ml-2">Account</span>}
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Tools Section */}
          <div className={`${!isBioCreator && !isZoomRecordings ? 'pt-2 border-t' : ''}`}>
            {isExpanded && !isBioCreator && !isZoomRecordings && (
              <div className="text-sm text-muted-foreground px-2 py-1">
                Tools
              </div>
            )}

            {/* Show BIO Creator if user is bio creator or has full access */}
            {(isBioCreator || (!isBioCreator && !isZoomRecordings)) && (
              <Link href="/bio-creator">
                <Button
                  variant={pathname === '/bio-creator' ? "secondary" : "ghost"}
                  className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
                  title="BIO Creator"
                >
                  <FileText className="h-4 w-4" />
                  {isExpanded && <span className="ml-2">BIO Creator</span>}
                </Button>
              </Link>
            )}

            {/* Show Phone Recordings if user is zoom recordings user or has full access */}
            {(isZoomRecordings || (!isBioCreator && !isZoomRecordings)) && (
              <Link href="/phone-recordings">
                <Button
                  variant={pathname === '/phone-recordings' ? "secondary" : "ghost"}
                  className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
                  title="Phone Recordings"
                >
                  <Video className="h-4 w-4" />
                  {isExpanded && <span className="ml-2">Phone Recordings</span>}
                </Button>
              </Link>
            )}

            {/* Show Chat with DB for all users */}
            {(!isBioCreator && !isZoomRecordings) && (
              <Link href="/chat-with-db">
                <Button
                  variant={pathname === '/chat-with-db' ? "secondary" : "ghost"}
                  className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
                  title="Chat with Database"
                >
                  <MessageSquare className="h-4 w-4" />
                  {isExpanded && <span className="ml-2">Chat with DB</span>}
                </Button>
              </Link>
            )}
          </div>

          {/* Show additional sections only for full access users */}
          {!isBioCreator && !isZoomRecordings && (
            <>
              {/* Invoice Section */}
              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground px-2 py-1">
                  {isExpanded && "Invoice"}
                </div>

                <Link href="/invoice/monthly">
                  <Button
                    variant={pathname === '/invoice/monthly' ? "secondary" : "ghost"}
                    className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
                    title="Monthly Invoice"
                  >
                    <LineChart className="h-4 w-4" />
                    {isExpanded && <span className="ml-2">Monthly</span>}
                  </Button>
                </Link>

                <Link href="/invoice/payg">
                  <Button
                    variant={pathname === '/invoice/payg' ? "secondary" : "ghost"}
                    className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
                    title="PayG Invoice"
                  >
                    <LineChart className="h-4 w-4" />
                    {isExpanded && <span className="ml-2">PayG</span>}
                  </Button>
                </Link>
              </div>

              {/* Settings Section */}
              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground px-2 py-1">
                  {isExpanded && "Settings"}
                </div>

                <Link href="/settings/kpi">
                  <Button
                    variant={pathname === '/settings/kpi' ? "secondary" : "ghost"}
                    className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
                    title="KPI Settings"
                  >
                    <LineChart className="h-4 w-4" />
                    {isExpanded && <span className="ml-2">KPI</span>}
                  </Button>
                </Link>

                <Link href="/team">
                  <Button
                    variant={pathname === '/teams' ? "secondary" : "ghost"}
                    className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
                    title="Team Settings"
                  >
                    <LineChart className="h-4 w-4" />
                    {isExpanded && <span className="ml-2">Teams</span>}
                  </Button>
                </Link>
              </div>
            </>
          )}
        </nav>
      </div>
    </aside>
  );
}