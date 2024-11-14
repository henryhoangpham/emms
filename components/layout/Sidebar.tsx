'use client'

import { Button } from "@/components/ui/button";
import { Users, Briefcase, X, ChevronLeft, ChevronRight, Calendar, FolderTree, BookOpen } from "lucide-react";
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
          <Link href="/allocations">
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
          </Link>
        </nav>
      </div>
    </aside>
  );
}