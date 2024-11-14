'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { verifyUserTenant } from '@/utils/auth-helpers';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  userTenants: Tenant[];
  setUserTenants: (tenants: Tenant[]) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentTenant');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const [userTenants, setUserTenants] = useState<Tenant[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userTenants');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  useEffect(() => {
    const initializeTenant = async () => {
      const supabase = createClient();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && !currentTenant) {
          // If we have a user but no tenant, verify and set default tenant
          const defaultTenant = await verifyUserTenant(supabase, user.id);
          setCurrentTenant(defaultTenant);
          setUserTenants([defaultTenant]); // Initialize userTenants with at least the default tenant
          
          // Store in localStorage
          localStorage.setItem('currentTenant', JSON.stringify(defaultTenant));
          localStorage.setItem('userTenants', JSON.stringify([defaultTenant]));
        }
      } catch (error) {
        console.error('Error initializing tenant:', error);
        // If there's an error, sign out the user
        await supabase.auth.signOut();
        setCurrentTenant(null);
        setUserTenants([]);
        localStorage.removeItem('currentTenant');
        localStorage.removeItem('userTenants');
      }
    };

    initializeTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ 
      currentTenant, 
      setCurrentTenant, 
      userTenants, 
      setUserTenants 
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}