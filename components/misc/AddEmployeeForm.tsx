'use client'

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from '@/utils/supabase/client';
import { Employee, Department, Knowledge } from '@/utils/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { CustomCheckbox } from '@/components/ui/custom-checkbox';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import { 
  addEmployee, 
  updateEmployee, 
  getEmployee, 
  getDepartments, 
  addEmployeeDepartments, 
  removeEmployeeDepartments, 
  getKnowledges, 
  getEmployeeKnowledge,
  addEmployeeKnowledge, 
  removeEmployeeKnowledge 
} from '@/utils/supabase/queries';

interface FormattedDepartment extends Department {
  level: number;
  displayName: string;
}

export default function AddEmployeeForm({ employeeId }: { employeeId: string | null }) {
  const [formData, setFormData] = useState<Employee | {}>({
    given_name: '',
    surname: '',
    company_email: '',
    personal_email: '',
    citizenship: '',
    tax_residence: '',
    location: '',
    mobile_number: '',
    home_address: '',
    birth_date: '',
    is_active: true,
    is_deleted: false,
  });
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [departments, setDepartments] = useState<FormattedDepartment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { currentTenant } = useTenant();
  const [knowledges, setKnowledges] = useState<Knowledge[]>([]);
  const [selectedKnowledges, setSelectedKnowledges] = useState<string[]>([]);
  const [knowledgeSearchOpen, setKnowledgeSearchOpen] = useState(false);

  // Function to format departments into hierarchical structure
  const formatDepartmentsHierarchy = (
    allDepartments: Department[],
    parentId: string | null = null,
    level: number = 0
  ): FormattedDepartment[] => {
    const result: FormattedDepartment[] = [];
    
    const depts = allDepartments.filter(d => d.parent_department_id === parentId);
    
    depts.forEach(dept => {
      const prefix = '—'.repeat(level);
      result.push({
        ...dept,
        level,
        displayName: level > 0 ? `${prefix} ${dept.name}` : dept.name
      });
      
      const children = formatDepartmentsHierarchy(allDepartments, dept.id, level + 1);
      result.push(...children);
    });
    
    return result;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!currentTenant) return;

      try {
        const supabase: SupabaseClient = createClient();

        // Fetch departments
        const { departments: departmentsData } = await getDepartments(supabase, currentTenant.id);
        if (departmentsData) {
          const formattedDepts = formatDepartmentsHierarchy(departmentsData);
          setDepartments(formattedDepts);
        }

        // Fetch knowledges
        const { knowledges: knowledgesData } = await getKnowledges(supabase, currentTenant.id);
        if (knowledgesData) {
          setKnowledges(knowledgesData);
        }

        // Fetch employee if editing
        if (employeeId) {
          const employee = await getEmployee(supabase, employeeId);
          if (employee && employee.tenant_id === currentTenant.id) {
            setFormData(employee);
            // Fetch employee's departments
            const { data: employeeDepts } = await supabase
              .from('EmployeeDepartments')
              .select('department_id')
              .eq('employee_id', employeeId);
            
            if (employeeDepts) {
              setSelectedDepartments(employeeDepts.map(ed => ed.department_id));
            }

            // Fetch employee's knowledges
            const employeeKnowledges = await getEmployeeKnowledge(supabase, employeeId);
            if (employeeKnowledges) {
              setSelectedKnowledges(employeeKnowledges.map(ek => ek.knowledge_id));
            }
          } else {
            toast({
              title: "Error",
              description: "Employee not found or belongs to different tenant.",
              variant: "destructive",
            });
            router.push('/employees');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      }
    };

    fetchData();
  }, [employeeId, currentTenant]);

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

    if (!(formData as Employee).given_name || !(formData as Employee).company_email || !(formData as Employee).personal_email) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const supabase = createClient();
      const employeeData = {
        ...formData,
        tenant_id: currentTenant.id
      };

      if (employeeId) {
        await updateEmployee(supabase, { id: employeeId, ...employeeData });
        // Update departments
        await removeEmployeeDepartments(supabase, employeeId);
        if (selectedDepartments.length > 0) {
          await addEmployeeDepartments(supabase, employeeId, selectedDepartments);
        }

        // Update knowledges
        await removeEmployeeKnowledge(supabase, employeeId);
        if (selectedKnowledges.length > 0) {
          await addEmployeeKnowledge(supabase, employeeId, selectedKnowledges);
        }
      } else {
        const data = await addEmployee(supabase, employeeData);
        // Add departments for new employee
        if (data && selectedDepartments.length > 0) {
          await addEmployeeDepartments(supabase, data[0].id, selectedDepartments);
        }
      }

      router.push('/employees');
    } catch (error: any) {
      setError(error.message || 'Failed to save employee.');
      console.error('Error saving employee:', error);
    }
  };

  const handleKnowledgeSelect = (knowledgeId: string) => {
    console.log('handleKnowledgeSelect selected', knowledgeId);
    setSelectedKnowledges(current => {
      if (current.includes(knowledgeId)) {
        return current.filter(id => id !== knowledgeId);
      }
      return [...current, knowledgeId];
    });
  };

  const removeKnowledge = (knowledgeId: string) => {
    setSelectedKnowledges(current => current.filter(id => id !== knowledgeId));
  };

  useEffect(() => {
    console.log('selectedKnowledges updated:', selectedKnowledges);
  }, [selectedKnowledges]);

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
          <CardTitle>{employeeId ? 'Edit Employee' : 'Add New Employee'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="given_name">Given Name *</Label>
                <Input
                  id="given_name"
                  name="given_name"
                  value={(formData as Employee).given_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="surname">Surname</Label>
                <Input
                  id="surname"
                  name="surname"
                  value={(formData as Employee).surname}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="company_email">Company Email *</Label>
                <Input
                  id="company_email"
                  name="company_email"
                  type="email"
                  value={(formData as Employee).company_email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="personal_email">Personal Email *</Label>
                <Input
                  id="personal_email"
                  name="personal_email"
                  type="email"
                  value={(formData as Employee).personal_email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="citizenship">Citizenship (2-letter code)</Label>
                <Input
                  id="citizenship"
                  name="citizenship"
                  value={(formData as Employee).citizenship}
                  onChange={handleInputChange}
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="tax_residence">Tax Residence (2-letter code)</Label>
                <Input
                  id="tax_residence"
                  name="tax_residence"
                  value={(formData as Employee).tax_residence}
                  onChange={handleInputChange}
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="location">Location (2-letter code)</Label>
                <Input
                  id="location"
                  name="location"
                  value={(formData as Employee).location}
                  onChange={handleInputChange}
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="mobile_number">Mobile Number</Label>
                <Input
                  id="mobile_number"
                  name="mobile_number"
                  value={(formData as Employee).mobile_number}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="home_address">Home Address</Label>
                <Input
                  id="home_address"
                  name="home_address"
                  value={(formData as Employee).home_address}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="birth_date">Birth Date</Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  value={(formData as Employee).birth_date}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <CustomCheckbox
                  id="is_active"
                  label="Active"
                  checked={(formData as Employee).is_active}
                  onChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_active: checked }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="departments">Departments</Label>
                <Select 
                  value={selectedDepartments.join(',')}
                  onValueChange={(value) => setSelectedDepartments(value.split(',').filter(Boolean))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select departments" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem 
                        key={dept.id} 
                        value={dept.id}
                      >
                        {dept.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="knowledges">Knowledges</Label>
                <Popover open={knowledgeSearchOpen} onOpenChange={setKnowledgeSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={knowledgeSearchOpen}
                      className="w-full justify-between"
                    >
                      {selectedKnowledges.length === 0 
                        ? "Select knowledges..." 
                        : `${selectedKnowledges.length} selected`}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search knowledges..." />
                      <CommandEmpty>No knowledge found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {knowledges.map((knowledge) => (
                          <CommandItem
                            key={knowledge.id}
                            value={knowledge.title}
                            onSelect={() => {
                              console.log('onSelect', knowledge.id);
                              handleKnowledgeSelect(knowledge.id);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "h-4 w-4 border rounded-sm flex items-center justify-center",
                                selectedKnowledges.includes(knowledge.id) ? "bg-primary border-primary" : "border-input"
                              )}>
                                {selectedKnowledges.includes(knowledge.id) && 
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                }
                              </div>
                              {knowledge.title}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>                
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedKnowledges.map((knowledgeId) => {
                    const knowledge = knowledges.find(k => k.id === knowledgeId);
                    return knowledge ? (
                      <Badge
                        key={knowledge.id}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {knowledge.title}
                        <button
                          type="button"
                          className="ml-1 hover:bg-muted rounded-full"
                          onClick={(e) => {
                            e.preventDefault();
                            removeKnowledge(knowledge.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>

              {error && <div className="text-red-500 bg-red-100 p-2 rounded">{error}</div>}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => router.push('/employees')}>Cancel</Button>
                <Button type="submit">Submit</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}