import { SupabaseClient } from '@supabase/supabase-js';
import { getUserTenants } from './supabase/queries';

export async function verifyUserTenant(supabase: SupabaseClient, userId: string) {
  try {
    // Get user's tenants
    const userTenants = await getUserTenants(supabase, userId);
    
    if (!userTenants || userTenants.length === 0) {
      // No tenants found - sign out the user
      await supabase.auth.signOut();
      throw new Error('No tenant access. Please contact your administrator.');
    }

    // Return the first tenant as default
    return userTenants[0].tenant;
  } catch (error) {
    console.error('Error verifying tenant:', error);
    throw error;
  }
} 