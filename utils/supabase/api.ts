import { SupabaseClient } from '@supabase/supabase-js';

export const createApiClient = (supabase: SupabaseClient) => ({
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
});
