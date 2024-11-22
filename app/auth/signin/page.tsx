import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import SignInForm from '@/components/misc/AuthForm';

export default async function SignIn() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    return redirect('/');
  }

  return <SignInForm />;
} 