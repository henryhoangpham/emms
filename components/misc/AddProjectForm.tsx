'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from '@/utils/supabase/client';
import { getClients, addProject, getProject, updateProject, searchClients, getKnowledges, getProjectKnowledges, addProjectKnowledge, removeProjectKnowledge } from '@/utils/supabase/queries';
import { SupabaseClient } from '@supabase/supabase-js';
import { Autocomplete } from '@/components/ui/autocomplete';
import { CustomCheckbox } from '@/components/ui/custom-checkbox';
import { useTenant } from '@/utils/tenant-context';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

interface FormData {
  code: string;
  name: string;
  client_id: string;
  currency: string;
  contract_owner: string;
  start_date: string;
  end_date: string;
  deal_status: string;
  billable: string;
  engagement_manager_email: string;
  note: string;
}

const initialFormData: FormData = {
  code: '',
  name: '',
  client_id: '',
  currency: '',
  contract_owner: '',
  start_date: '',
  end_date: '',
  deal_status: 'PENDING',
  billable: 'false',
  engagement_manager_email: '',
  note: '',
};

interface Client {
  id: string;
  name: string;
}

interface Knowledge {
  id: string;
  title: string;
}

export default function AddProjectForm({ projectId }: { projectId: string | null }) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const router = useRouter();
  const supabase: SupabaseClient = createClient();
  const { currentTenant } = useTenant();
  const [knowledges, setKnowledges] = useState<Knowledge[]>([]);
  const [selectedKnowledges, setSelectedKnowledges] = useState<string[]>([]);
  const [knowledgeSearchOpen, setKnowledgeSearchOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentTenant) {
        return;
      }

      try {
        setLoading(true);
        // Fetch clients
        const { clients: clientsData } = await getClients(supabase, currentTenant!.id);
        if (clientsData) {
          setClients(clientsData);
        }

        // Fetch knowledges
        const { knowledges: knowledgesData } = await getKnowledges(supabase, currentTenant.id);
        if (knowledgesData) {
          setKnowledges(knowledgesData);
        }

        // Fetch project if editing
        if (projectId) {
          const project = await getProject(supabase, projectId);
          if (project) {
            setFormData({
              ...initialFormData,
              ...project,
              start_date: project.start_date ? project.start_date.split('T')[0] : '',
              end_date: project.end_date ? project.end_date.split('T')[0] : '',
              billable: project.billable?.toString() || 'false',
              deal_status: project.deal_status || 'PENDING',
            });
          }

          // If editing, fetch project's knowledges
          const projectKnowledges = await getProjectKnowledges(supabase, projectId);
          if (projectKnowledges) {
            setSelectedKnowledges(projectKnowledges.map(pk => pk.knowledge_id));
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
  }, [projectId, currentTenant]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    console.log('Selected value:', value);
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

    if (!formData.code || !formData.name || !formData.client_id || !formData.contract_owner || !formData.engagement_manager_email) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      let data;
      const projectData = {
        ...formData,
        tenant_id: currentTenant.id
      };

      if (projectId) {
        data = await updateProject(supabase, { id: projectId, ...projectData });
        // Update knowledges
        await removeProjectKnowledge(supabase, projectId);
        if (selectedKnowledges.length > 0) {
          await addProjectKnowledge(supabase, projectId, selectedKnowledges);
        }
      } else {
        data = await addProject(supabase, projectData);
        // Add knowledges for new project
        if (data && selectedKnowledges.length > 0) {
          await addProjectKnowledge(supabase, data[0].id, selectedKnowledges);
        }
      }

      console.log('Project added/updated successfully:', data);
      router.push('/projects');
    } catch (error: any) {
      setError(error.message || 'Failed to add project.');
      console.error('Error adding project:', error);
    }
  };

  const ClientSelector = () => {
    if (!isSearchMode) {
      return (
        <Select 
          value={formData.client_id}
          onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Autocomplete
        options={clients}
        value={formData.client_id}
        onChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
        placeholder="Search clients..."
      />
    );
  };

  const handleKnowledgeSelect = (knowledgeId: string) => {
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto">
      <main className="flex-1 p-8">
        <Card>
          <CardHeader>
            <CardTitle>{projectId ? 'Edit Project' : 'Add New Project'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="code">Project Code *</Label>
                  <Input
                    id="code"
                    name="code"
                    value={formData.code || ''}
                    onChange={handleInputChange}
                    required
                    maxLength={50}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    required
                    maxLength={255}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="client_id">Client *</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSearchMode(!isSearchMode)}
                    >
                      {isSearchMode ? 'Show All' : 'Search Mode'}
                    </Button>
                  </div>
                  <ClientSelector />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    name="currency"
                    value={formData.currency || ''}
                    onChange={handleInputChange}
                    maxLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="contract_owner">Contract Owner *</Label>
                  <Input
                    id="contract_owner"
                    name="contract_owner"
                    value={formData.contract_owner || ''}
                    onChange={handleInputChange}
                    required
                    maxLength={50}
                  />
                </div>
                <div>
                  <Label htmlFor="engagement_manager_email">Engagement Manager Email *</Label>
                  <Input
                    id="engagement_manager_email"
                    name="engagement_manager_email"
                    type="email"
                    value={formData.engagement_manager_email || ''}
                    onChange={handleInputChange}
                    required
                    maxLength={255}
                  />
                </div>
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={formData.start_date || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    value={formData.end_date || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="deal_status">Deal Status *</Label>
                  <Select 
                    name="deal_status" 
                    onValueChange={(value) => handleSelectChange('deal_status', value)} 
                    value={formData.deal_status || 'PENDING'}
                    required 
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select deal status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="WON">Won</SelectItem>
                      <SelectItem value="LOST">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <CustomCheckbox
                    id="billable"
                    label="Billable"
                    checked={formData.billable === 'true'}
                    onChange={(checked) => 
                      setFormData(prev => ({ ...prev, billable: checked.toString() }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="note">Note</Label>
                  <Input
                    id="note"
                    name="note"
                    value={formData.note || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="knowledges">Required Knowledge</Label>
                  <Popover open={knowledgeSearchOpen} onOpenChange={setKnowledgeSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={knowledgeSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedKnowledges.length === 0 
                          ? "Select required knowledge..." 
                          : `${selectedKnowledges.length} selected`}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search knowledge..." />
                        <CommandEmpty>No knowledge found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {knowledges.map((knowledge) => (
                            <CommandItem
                              key={knowledge.id}
                              value={knowledge.title}
                              onSelect={() => handleKnowledgeSelect(knowledge.id)}
                              className="cursor-pointer"
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
                  <Button type="button" variant="outline" onClick={() => router.push('/projects')}>Cancel</Button>
                  <Button type="submit">Submit</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}