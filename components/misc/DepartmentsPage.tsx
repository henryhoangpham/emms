'use client'

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { getDepartments } from '@/utils/supabase/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings, ChevronRight, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { Department } from '@/utils/types';

interface DepartmentsPageProps {
  user: User;
}

interface DepartmentNodeProps {
  department: Department;
  level: number;
  onEdit: (id: string) => void;
  allDepartments: Department[];
}

const DepartmentNode = ({ department, level, onEdit, allDepartments }: DepartmentNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const childDepartments = allDepartments.filter(d => d.parent_department_id === department.id);
  const hasChildren = childDepartments.length > 0;

  return (
    <div className="w-full">
      <div 
        className={`flex items-center p-2 hover:bg-muted/50 ${level > 0 ? 'ml-6' : ''}`}
      >
        <div className="flex-1 flex items-center gap-2">
          {hasChildren && (
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-1">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          <span>{department.name}</span>
          <span className={`ml-2 text-xs ${department.is_active ? 'text-green-600' : 'text-red-600'}`}>
            ({department.is_active ? 'Active' : 'Inactive'})
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onEdit(department.id)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      {hasChildren && isExpanded && (
        <div className="border-l ml-3">
          {childDepartments.map((child) => (
            <DepartmentNode
              key={child.id}
              department={child}
              level={level + 1}
              onEdit={onEdit}
              allDepartments={allDepartments}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function DepartmentsPage({ user }: DepartmentsPageProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { currentTenant } = useTenant();
  
  useEffect(() => {
    if (currentTenant) {
      loadDepartments();
    }
  }, [currentTenant]);

  async function loadDepartments() {
    try {
      setLoading(true);
      const supabase = createClient();
      const { departments } = await getDepartments(supabase, currentTenant!.id);
      if (departments) {
        setDepartments(departments);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      toast({
        title: "Error",
        description: "Failed to load departments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (id: string) => {
    router.push(`/departments/edit/${id}`);
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

  const rootDepartments = departments.filter(d => !d.parent_department_id);

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Department List</CardTitle>
          <Link href="/departments/add">
            <Button variant="default">+ Add New</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            {rootDepartments.map((department) => (
              <DepartmentNode
                key={department.id}
                department={department}
                level={0}
                onEdit={handleEdit}
                allDepartments={departments}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 