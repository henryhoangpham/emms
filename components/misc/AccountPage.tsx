'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/layout/Logo';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { createApiClient } from '@/utils/supabase/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenant } from '@/utils/tenant-context';
import { getUserTenants } from '@/utils/supabase/queries';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
}

export default function AccountPage({
  user
}: {
  user: User;
}) {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { currentTenant, setCurrentTenant, userTenants, setUserTenants } = useTenant();

  useEffect(() => {
    const loadTenants = async () => {
      if (!user.id || loading) return;
      
      try {
        setLoading(true);
        const tenants = await getUserTenants(supabase, user.id);
        
        if (tenants && tenants.length > 0) {
          const formattedTenants = tenants.map(ut => ut.tenant as Tenant);
          setUserTenants(formattedTenants);
          localStorage.setItem('userTenants', JSON.stringify(formattedTenants));

          // If no current tenant is selected, set the first one
          if (!currentTenant && formattedTenants.length > 0) {
            setCurrentTenant(formattedTenants[0]);
            localStorage.setItem('currentTenant', JSON.stringify(formattedTenants[0]));
          }
        }
      } catch (error) {
        console.error('Error loading tenants:', error);
        toast({
          title: "Error",
          description: "Failed to load tenants. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTenants();
  }, [user.id]);

  const handleTenantChange = (tenantId: string) => {
    const selectedTenant = userTenants.find((t: Tenant) => t.id === tenantId);
    
    if (selectedTenant) {
      setCurrentTenant(selectedTenant);
      localStorage.setItem('currentTenant', JSON.stringify(selectedTenant));
      toast({
        title: "Tenant Changed",
        description: `Now working with ${selectedTenant.name}`,
      });
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const api = createApiClient(supabase);
      await api.signOut();
      
      setCurrentTenant(null);
      setUserTenants([]);
      localStorage.removeItem('currentTenant');
      localStorage.removeItem('userTenants');
      
      toast({
        title: 'Signed out successfully!'
      });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-slate-700 dark:bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <Logo />
            <div className="flex items-center gap-4">
              <Button
                onClick={handleSignOut}
                className="border"
                variant="secondary"
                disabled={loading}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="text-3xl font-semibold">Account</h1>
        </div>
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
          <nav className="grid gap-4 text-sm text-muted-foreground">
            <Link href="#" className="font-semibold text-primary">
              General
            </Link>
            <Link href="mailto:">Support</Link>
          </nav>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Email</CardTitle>
                <CardDescription>
                  The email associated with your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form>
                  <Input placeholder="Email" value={user.email} disabled />
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Current Tenant</CardTitle>
                <CardDescription>
                  Select the tenant you want to work with
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div>Loading tenants...</div>
                ) : (
                  <Select 
                    value={currentTenant?.id} 
                    onValueChange={handleTenantChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {userTenants?.map((tenant: Tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}