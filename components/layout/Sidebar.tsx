'use client'

import { Button } from "@/components/ui/button";
import { Users, Briefcase, X, ChevronLeft, ChevronRight, Calendar, FolderTree, BookOpen, Database, BarChart, LineChart, UserCheck, Wrench, FileText } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { useState } from 'react';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

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
          {/* <Link href="/allocations">
            <Button 
              variant={pathname.startsWith('/allocations') ? "secondary" : "ghost"} 
              className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
              title="Allocations"
            >
              <Calendar className="h-4 w-4" />
              {isExpanded && <span className="ml-2">Allocations</span>}
            </Button>
          </Link>
          <Link href="/employees">
            <Button 
              variant={pathname.startsWith('/employees') ? "secondary" : "ghost"} 
              className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
              title="Employees"
            >
              <Users className="h-4 w-4" />
              {isExpanded && <span className="ml-2">Employees</span>}
            </Button>
          </Link>
          <Link href="/departments">
            <Button 
              variant={pathname.startsWith('/departments') ? "secondary" : "ghost"} 
              className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
              title="Departments"
            >
              <FolderTree className="h-4 w-4" />
              {isExpanded && <span className="ml-2">Departments</span>}
            </Button>
          </Link>
          <Link href="/clients">
            <Button 
              variant={pathname.startsWith('/clients') ? "secondary" : "ghost"} 
              className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
              title="Clients"
            >
              <Users className="h-4 w-4" />
              {isExpanded && <span className="ml-2">Clients</span>}
            </Button>
          </Link>
          <Link href="/projects">
            <Button 
              variant={pathname.startsWith('/projects') ? "secondary" : "ghost"} 
              className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
              title="Projects"
            >
              <Briefcase className="h-4 w-4" />
              {isExpanded && <span className="ml-2">Projects</span>}
            </Button>
          </Link>
          <Link href="/knowledge">
            <Button 
              variant={pathname.startsWith('/knowledge') ? "secondary" : "ghost"} 
              className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
              title="Knowledge"
            >
              <BookOpen className="h-4 w-4" />
              {isExpanded && <span className="ml-2">Knowledge</span>}
            </Button>
          </Link> */}
          <Link href="/pjt">
            <Button 
              variant={pathname.startsWith('/pjt') ? "secondary" : "ghost"} 
              className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
              title="PJT Data"
            >
              <Database className="h-4 w-4" />
              {isExpanded && <span className="ml-2">PJT</span>}
            </Button>
          </Link>
          <Link href="/master">
            <Button 
              variant={pathname.startsWith('/master') ? "secondary" : "ghost"} 
              className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
              title="Master Data 2024"
            >
              <Database className="h-4 w-4" />
              {isExpanded && <span className="ml-2">Master Data</span>}
            </Button>
          </Link>
          <Link href="/experts">
            <Button 
              variant={pathname.startsWith('/experts') ? "secondary" : "ghost"} 
              className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
              title="Experts Data"
            >
              <UserCheck className="h-4 w-4" />
              {isExpanded && <span className="ml-2">Experts</span>}
            </Button>
          </Link>
          <Link href="/operational-clients">
            <Button 
              variant={pathname.startsWith('/operational-clients') ? "secondary" : "ghost"} 
              className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
              title="Operational Clients"
            >
              <Users className="h-4 w-4" />
              {isExpanded && <span className="ml-2">Operational Clients</span>}
            </Button>
          </Link>
          <Link href="/client-stats">
            <Button 
              variant={pathname.startsWith('/client-stats') ? "secondary" : "ghost"} 
              className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
              title="Client Stats"
            >
              <BarChart className="h-4 w-4" />
              {isExpanded && <span className="ml-2">Client Stats</span>}
            </Button>
          </Link>
          {/* <Link href="/client-stats-2023">
            <Button 
              variant={pathname.startsWith('/client-stats-2023') ? "secondary" : "ghost"} 
              className={`w-full justify-start ${!isExpanded && 'justify-center'}`}
              title="Client Stats 2023"
            >
              <BarChart className="h-4 w-4" />
              {isExpanded && <span className="ml-2">Client Stats 2023</span>}
            </Button>
          </Link> */}

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

          {/* Tools Section */}
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground px-2 py-1">
              {isExpanded && "Tools"}
            </div>
            
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
          </div>

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

        </nav>
      </div>
    </aside>
  );
}