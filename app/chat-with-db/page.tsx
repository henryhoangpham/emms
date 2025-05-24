import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ChatWithDB from '@/components/chat-with-db/ChatWithDB';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export const metadata = {
  title: 'Chat with Database',
  description: 'Ask questions about your database using natural language',
};

export default async function ChatWithDBPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <div className="h-screen">
      <DashboardLayout user={user}>
        <div className="flex h-full flex-col">
          <h1 className="mb-6 text-center text-3xl font-bold">
            Database Chat Assistant
          </h1>
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <ChatWithDB />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </div>
  );
} 