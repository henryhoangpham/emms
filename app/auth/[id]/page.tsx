import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AuthForm, { AuthState } from '@/components/misc/AuthForm';
import { Navbar } from '@/components/layout/Navbar';

export default async function Auth({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    return redirect('/');
  }

  const currState = params.id as AuthState;
  if (!['signin', 'signup', 'forgot_password'].includes(currState)) {
    return redirect('/auth/signin');
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar user={user} onMenuClick={() => {}} />
      <div className="flex grow justify-center items-center">
        <AuthForm state={currState} />
      </div>
    </div>
  );
}
