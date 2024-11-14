'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from '@/utils/supabase/client';
import { addDepartment, updateDepartment, getDepartment, getDepartments } from '@/utils/supabase/queries';
import { Department } from '@/utils/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { CustomCheckbox } from '@/components/ui/custom-checkbox';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';

interface FormattedDepartment extends Department {
  level: number;
  displayName: string;
}

export default function AddDepartmentForm({ departmentId }: { departmentId: string | null }) {
  const [formData, setFormData] = useState<Department | {}>({
    name: '',
    parent_department_id: null,
    is_active: true,
    is_deleted: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<FormattedDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase: SupabaseClient = createClient();
  const { currentTenant } = useTenant();

  // Function to format departments into hierarchical structure
  const formatDepartmentsHierarchy = (
    allDepartments: Department[],
    parentId: string | null = null,
    level: number = 0
  ): FormattedDepartment[] => {
    const result: FormattedDepartment[] = [];
    
    // Get departments at current level
    const depts = allDepartments.filter(d => d.parent_department_id === parentId);
    
    depts.forEach(dept => {
      // Add current department with proper indentation
      const prefix = '—'.repeat(level);
      result.push({
        ...dept,
        level,
        displayName: level > 0 ? `${prefix} ${dept.name}` : dept.name
      });
      
      // Recursively add children
      const children = formatDepartmentsHierarchy(allDepartments, dept.id, level + 1);
      result.push(...children);
    });
    
    return result;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!currentTenant) {
        return;
      }

      try {
        setLoading(true);
        // Fetch all departments
        const { departments: departmentsData } = await getDepartments(supabase, currentTenant.id);
        if (departmentsData) {
          // Format departments into hierarchical structure
          const formattedDepts = formatDepartmentsHierarchy(departmentsData);
          setDepartments(formattedDepts);
        }

        // Fetch department if editing
        if (departmentId) {
          const department = await getDepartment(supabase, departmentId);
          if (department && department.tenant_id === currentTenant.id) {
            setFormData(department);
          } else {
            toast({
              title: "Error",
              description: "Department not found or belongs to different tenant.",
              variant: "destructive",
            });
            router.push('/departments');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [departmentId, currentTenant]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentTenant) {
      setError('No tenant selected. Please select a tenant from account settings.');
      return;
    }

    if (!(formData as Department).name) {
      setError('Please fill in all required fields.');
      return;
    }

    // Check for circular dependency
    if (departmentId && (formData as Department).parent_department_id === departmentId) {
      setError('A department cannot be its own parent.');
      return;
    }

    try {
      const departmentData = {
        ...formData,
        tenant_id: currentTenant.id
      };

      if (departmentId) {
        await updateDepartment(supabase, { id: departmentId, ...departmentData });
      } else {
        await addDepartment(supabase, departmentData);
      }
      router.push('/departments');
    } catch (error: any) {
      setError(error.message || 'Failed to save department.');
      console.error('Error saving department:', error);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{departmentId ? 'Edit Department' : 'Add New Department'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Department Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={(formData as Department).name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="parent_department_id">Parent Department</Label>
                <Select 
                  value={(formData as Department).parent_department_id || 'null'}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    parent_department_id: value === 'null' ? null : value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">None</SelectItem>
                    {departments
                      .filter(d => d.id !== departmentId) // Exclude current department
                      .map((dept) => (
                        <SelectItem 
                          key={dept.id} 
                          value={dept.id}
                          className={`pl-${dept.level * 4}`}
                        >
                          {dept.displayName}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div>
                <CustomCheckbox
                  id="is_active"
                  label="Active"
                  checked={(formData as Department).is_active}
                  onChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_active: checked }))
                  }
                />
              </div>
              {error && <div className="text-red-500 bg-red-100 p-2 rounded">{error}</div>}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => router.push('/departments')}>Cancel</Button>
                <Button type="submit">Submit</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 