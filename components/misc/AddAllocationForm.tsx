'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from '@/utils/supabase/client';
import { addAllocation, updateAllocation, getAllocation, getEmployees, getProjects } from '@/utils/supabase/queries';
import { SupabaseClient } from '@supabase/supabase-js';
import { Autocomplete } from '@/components/ui/autocomplete';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';

interface FormattedOption {
  id: string;
  name: string;
}

export default function AddAllocationForm({ allocationId }: { allocationId: string | null }) {
  const [formData, setFormData] = useState({
    employee_id: '',
    project_id: '',
    start_date: '',
    end_date: '',
    allocation_percentage: '',
    is_deleted: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<FormattedOption[]>([]);
  const [projects, setProjects] = useState<FormattedOption[]>([]);
  const router = useRouter();
  const supabase: SupabaseClient = createClient();
  const { currentTenant } = useTenant();

  useEffect(() => {
    const fetchData = async () => {
      if (!currentTenant) {
        return;
      }

      try {
        // Fetch employees
        const { employees: employeesData } = await getEmployees(supabase, currentTenant.id);
        if (employeesData) {
          const formattedEmployees: FormattedOption[] = employeesData.map(emp => ({
            id: emp.id,
            name: `${emp.given_name} ${emp.surname}`
          }));
          setEmployees(formattedEmployees);
        }

        // Fetch projects
        const { projects: projectsData } = await getProjects(supabase, currentTenant.id);
        if (projectsData) {
          const formattedProjects: FormattedOption[] = projectsData.map(proj => ({
            id: proj.id,
            name: `${proj.code} - ${proj.name}`
          }));
          setProjects(formattedProjects);
        }

        // Fetch allocation if editing
        if (allocationId) {
          const allocation = await getAllocation(supabase, allocationId);
          if (allocation && allocation.tenant_id === currentTenant.id) {
            setFormData({
              ...allocation,
              start_date: allocation.start_date.split('T')[0],
              end_date: allocation.end_date.split('T')[0],
              allocation_percentage: allocation.allocation_percentage.toString(),
            });
          } else {
            toast({
              title: "Error",
              description: "Allocation not found or belongs to different tenant.",
              variant: "destructive",
            });
            router.push('/allocations');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      }
    };

    fetchData();
  }, [allocationId, currentTenant]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentTenant) {
      setError('No tenant selected. Please select a tenant from account settings.');
      return;
    }

    if (!formData.employee_id || !formData.project_id || !formData.start_date || !formData.end_date || !formData.allocation_percentage) {
      setError('Please fill in all required fields.');
      return;
    }

    const percentage = parseFloat(formData.allocation_percentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      setError('Allocation percentage must be between 0 and 100.');
      return;
    }

    try {
      const allocationData = {
        ...formData,
        tenant_id: currentTenant.id
      };

      if (allocationId) {
        await updateAllocation(supabase, { id: allocationId, ...allocationData });
      } else {
        await addAllocation(supabase, allocationData);
      }
      router.push('/allocations');
    } catch (error: any) {
      setError(error.message || 'Failed to save allocation.');
      console.error('Error saving allocation:', error);
    }
  };

  if (!currentTenant) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold">No Tenant Selected</h2>
          <p className="text-muted-foreground">Please select a tenant from your account settings.</p>
          <Button 
            className="mt-4"
            onClick={() => router.push('/account')}
          >
            Go to Account Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{allocationId ? 'Edit Allocation' : 'Add New Allocation'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="employee_id">Employee *</Label>
                <Autocomplete
                  options={employees}
                  value={formData.employee_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}
                  placeholder="Select an employee..."
                />
              </div>
              <div>
                <Label htmlFor="project_id">Project *</Label>
                <Autocomplete
                  options={projects}
                  value={formData.project_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
                  placeholder="Select a project..."
                />
              </div>
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="allocation_percentage">Allocation Percentage * (1-100)</Label>
                <Input
                  id="allocation_percentage"
                  name="allocation_percentage"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.allocation_percentage}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {error && <div className="text-red-500 bg-red-100 p-2 rounded">{error}</div>}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => router.push('/allocations')}>Cancel</Button>
                <Button type="submit">Submit</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 