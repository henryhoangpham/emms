'use client'

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { getTeamMembers, updateTeamMembers, TeamMember } from '@/utils/supabase/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Settings, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_ITEMS_PER_PAGE } from '@/utils/constants';
import { toast } from '@/components/ui/use-toast';
import BulkUploadButton from './BulkUploadButton';

interface TeamPageProps {
  user: User;
}

export default function TeamPage({ user }: TeamPageProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [editedMembers, setEditedMembers] = useState<{ [key: string]: Partial<TeamMember> }>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const router = useRouter();
  
  useEffect(() => {
    loadTeamMembers();
  }, [currentPage, itemsPerPage]);

  async function loadTeamMembers() {
    try {
      setLoading(true);
      const supabase = createClient();
      const { members, count } = await getTeamMembers(supabase, currentPage, itemsPerPage);
      if (members) {
        setMembers(members);
        setTotalItems(count || 0);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
      toast({
        title: "Error",
        description: "Failed to load team members. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const handleFieldChange = (email: string, field: keyof TeamMember, value: any) => {
    setEditedMembers(prev => ({
      ...prev,
      [email]: {
        ...prev[email],
        email,
        [field]: value
      }
    }));
  };

  const handleBulkUpdate = async () => {
    try {
      setLoading(true);
      const updates = Object.values(editedMembers);
      if (updates.length === 0) {
        toast({
          title: "Info",
          description: "No changes to save.",
        });
        return;
      }

      const supabase = createClient();
      await updateTeamMembers(supabase, updates);
      
      toast({
        title: "Success",
        description: `Updated ${updates.length} team members successfully.`,
      });
      
      setEditedMembers({});
      await loadTeamMembers();
    } catch (error: any) {
      console.error('Bulk update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update team members.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Team Members</CardTitle>
          <div className="space-x-2">
            <BulkUploadButton onSuccess={loadTeamMembers} />
            <Link href="/team/add">
              <Button variant="default">+ Add New</Button>
            </Link>
            <Button 
              variant="default"
              onClick={handleBulkUpdate}
              disabled={loading || Object.keys(editedMembers).length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="text-left bg-muted">
                <th className="p-2">Email</th>
                <th className="p-2">Nick</th>
                <th className="p-2">Name</th>
                <th className="p-2">Badge</th>
                <th className="p-2">Region</th>
                <th className="p-2">PM</th>
                <th className="p-2">Resource Allocation</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members?.map((member) => (
                <tr key={member.email} className="border-b hover:bg-muted/50">
                  <td className="p-2">{member.email}</td>
                  <td className="p-2">{member.nick}</td>
                  <td className="p-2">{member.name}</td>
                  <td className="p-2">
                    <Checkbox
                      checked={editedMembers[member.email]?.badge ?? member.badge}
                      onCheckedChange={(checked) => 
                        handleFieldChange(member.email, 'badge', checked)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Select
                      value={editedMembers[member.email]?.region ?? member.region}
                      onValueChange={(value) => 
                        handleFieldChange(member.email, 'region', value)
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Global">Global</SelectItem>
                        <SelectItem value="JP">JP</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Input
                      value={editedMembers[member.email]?.pm ?? member.pm}
                      onChange={(e) => 
                        handleFieldChange(member.email, 'pm', e.target.value)
                      }
                      className="w-[150px]"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={editedMembers[member.email]?.resource_allocation ?? member.resource_allocation}
                      onChange={(e) => 
                        handleFieldChange(member.email, 'resource_allocation', parseFloat(e.target.value))
                      }
                      className="w-[80px]"
                    />
                  </td>
                  <td className="p-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => router.push(`/team/edit/${encodeURIComponent(member.email)}`)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </CardContent>
      </Card>
    </div>
  );
} 