'use client';

import { NavigationMenu, NavigationMenuList } from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { Menu, LogOut } from 'lucide-react';
import { ModeToggle } from '../landing/mode-toggle';
import { User } from '@supabase/supabase-js';
import { createApiClient } from '@/utils/supabase/api';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/utils/tenant-context';

interface NavbarProps {
  user: User | null;
  onMenuClick: () => void;
}

export function Navbar({ user, onMenuClick }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();
  const { currentTenant } = useTenant();
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/signin');
  };

  return (
    <header className="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-slate-700 dark:bg-background">
      <div className="h-14 px-4 flex items-center justify-between lg:justify-end">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </Button>

        <div className="flex gap-2 items-center">
          {currentTenant && (
            <span className="text-sm font-medium">
              {currentTenant.name}
            </span>
          )}
          {user && (
            <Button
              onClick={handleSignOut}
              className="border"
              variant="secondary"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
} 