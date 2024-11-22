import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Omit<ResponseCookie, 'name' | 'value'>) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            // Handle any errors that occur when setting cookies
          }
        },
        remove(name: string, options: Omit<ResponseCookie, 'name' | 'value'>) {
          try {
            // Pass options as a single object instead of separate arguments
            cookieStore.delete({
              name,
              ...options
            });
          } catch (error) {
            // Handle any errors that occur when removing cookies
          }
        },
      },
    }
  );
}
