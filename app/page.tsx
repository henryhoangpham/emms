import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import HomePage from '@/components/home/HomePage';

export default async function Home() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('landing');
  }

  return <HomePage user={user} />;
}