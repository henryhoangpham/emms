'use client'

import { User } from '@supabase/supabase-js';
import { Navbar } from '../layout/Navbar';
import { Logo } from '../layout/Logo';
import { Features } from './Features';
import { Footer } from './Footer';

export default function LandingPage({ user }: { user: User | null }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <Logo iconOnly={true} />
          <Navbar user={user} onMenuClick={() => {}} />
        </div>
        <main className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Welcome to Next.js Supabase Boilerplate</h1>
            <p className="text-xl text-muted-foreground">
              A solid foundation for building scalable web applications
            </p>
          </div>
          <Features />
        </main>
      </div>
      <Footer />
    </div>
  );
}