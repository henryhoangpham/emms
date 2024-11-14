'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyUserTenant } from '@/utils/auth-helpers';
import { useTenant } from '@/utils/tenant-context';

export type AuthState = 'signin' | 'signup' | 'forgot_password';

interface AuthFormProps {
  state?: AuthState;
}

export default function AuthForm({ state = 'signin' }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setCurrentTenant } = useTenant();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      
      if (state === 'signin') {
        // Sign in the user
        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        if (!user) throw new Error('No user returned from sign-in');

        // Verify tenant access and get default tenant
        const defaultTenant = await verifyUserTenant(supabase, user.id);
        
        // Set the default tenant in context
        setCurrentTenant(defaultTenant);

        // Store tenant in localStorage for persistence
        localStorage.setItem('currentTenant', JSON.stringify(defaultTenant));

        // Redirect to home page
        router.push('/');
        router.refresh();
      } else if (state === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        
        // Show success message and redirect to sign in
        router.push('/auth/signin');
      } else if (state === 'forgot_password') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
        if (resetError) throw resetError;
        
        // Show success message
        alert('Password reset email sent');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
      // If there was an error during sign in, make sure we're signed out
      if (state === 'signin') {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (state) {
      case 'signup': return 'Sign Up';
      case 'forgot_password': return 'Reset Password';
      default: return 'Sign In';
    }
  };

  const getDescription = () => {
    switch (state) {
      case 'signup': return 'Create your account';
      case 'forgot_password': return 'Enter your email to reset your password';
      default: return 'Enter your credentials to access your account';
    }
  };

  const getButtonText = () => {
    switch (state) {
      case 'signup': return loading ? 'Creating Account...' : 'Create Account';
      case 'forgot_password': return loading ? 'Sending...' : 'Send Reset Link';
      default: return loading ? 'Signing in...' : 'Sign In';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getTitle()}</CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          {state !== 'forgot_password' && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
          )}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {getButtonText()}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
