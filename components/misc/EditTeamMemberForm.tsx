'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { TeamMember } from '@/utils/supabase/queries';

interface EditTeamMemberFormProps {
  member: TeamMember;
}

export default function EditTeamMemberForm({ member }: EditTeamMemberFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: member.email,
    nick: member.nick || '',
    name: member.name || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('TeamMembers')
        .update({
          nick: formData.nick,
          name: formData.name
        })
        .eq('email', member.email);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team member updated successfully.",
      });
      router.push('/team');
      router.refresh();
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update team member.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this team member?')) return;
    
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('TeamMembers')
        .delete()
        .eq('email', member.email);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team member deleted successfully.",
      });
      router.push('/team');
      router.refresh();
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete team member.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Team Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="nick">Nick</Label>
              <Input
                id="nick"
                value={formData.nick}
                onChange={(e) => setFormData(prev => ({ ...prev, nick: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </Button>
              <div className="space-x-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 