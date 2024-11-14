import AccountPage from '@/components/misc/AccountPage';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getUser } from '@/utils/supabase/queries';

export default async function Account() {
  const supabase = createClient();
  const user = await getUser(supabase);

  if (!user) {
    return redirect('/auth/signin');
  }

  return <AccountPage user={user} />;
}
