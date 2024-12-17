'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Copy, ChevronDown, ChevronUp, Save, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LLMFactory, LLMType } from '@/utils/llm/factory';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { getPJTMasterData, getExpertsData } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';

const DEFAULT_PROMPT = `Please create a professional bio for an expert that highlights their relevant experience and expertise for the given project. The bio should:
1. Focus on experience relevant to the project requirements
2. Highlight key achievements and responsibilities
3. Use professional and concise language
4. Be approximately 200-300 words
5. Maintain anonymity by not using specific company names
6. Format the text with proper paragraphs`;

interface Section {
  id: string;
  title: string;
  content: string;
  isExpanded: boolean;
  placeholder: string;
  searchValue?: string;
}

interface SearchResult {
  projects: any[];
  experts: any[];
}

// Add interface for expert data
interface ExpertData {
  id: number;
  name: string;
  email: string;
  job_from?: string;
  job_to?: string;
  company?: string;
  title?: string;
  experience?: string;
  description?: string;
}

export default function BIOCreator() {
  const { toast } = useToast();
  const supabase = createClient();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // State for search results and popover
  const [searchResults, setSearchResults] = useState<SearchResult>({
    projects: [],
    experts: []
  });
  const [projectSearchOpen, setProjectSearchOpen] = useState(false);
  const [expertSearchOpen, setExpertSearchOpen] = useState(false);

  const [sections, setSections] = useState<Section[]>([
    {
      id: 'prompt',
      title: 'Prompt',
      content: DEFAULT_PROMPT,
      isExpanded: false,
      placeholder: 'Enter your prompt here...'
    },
    {
      id: 'project',
      title: 'Project Information',
      content: '',
      isExpanded: false,
      placeholder: 'Enter project information here...',
      searchValue: ''
    },
    {
      id: 'expert',
      title: 'Expert Information',
      content: '',
      isExpanded: false,
      placeholder: 'Enter expert information here...',
      searchValue: ''
    },
    {
      id: 'sample',
      title: 'Sample Output',
      content: '',
      isExpanded: false,
      placeholder: 'Enter sample output here...'
    },
    {
      id: 'output',
      title: 'Generated BIO',
      content: '',
      isExpanded: true,
      placeholder: 'Generated bio will appear here...'
    }
  ]);

  const [projectSearch, setProjectSearch] = useState('');
  const [expertSearch, setExpertSearch] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLLM, setSelectedLLM] = useState<LLMType>('openai');

  const toggleSection = (id: string) => {
    setSections(sections.map(section => 
      section.id === id 
        ? { ...section, isExpanded: !section.isExpanded }
        : section
    ));
  };

  const updateContent = (id: string, content: string) => {
    setSections(sections.map(section => 
      section.id === id 
        ? { ...section, content }
        : section
    ));
  };

  const handleCreate = async () => {
    setIsGenerating(true);
    try {
      const promptSection = sections.find(s => s.id === 'prompt');
      const projectSection = sections.find(s => s.id === 'project');
      const expertSection = sections.find(s => s.id === 'expert');
      const sampleSection = sections.find(s => s.id === 'sample');

      if (!promptSection?.content || !projectSection?.content || !expertSection?.content) {
        throw new Error('Please fill in all required fields');
      }

      const context = `
Project Information:
${projectSection.content}

Expert Information:
${expertSection.content}

${sampleSection?.content ? `Sample Output:
${sampleSection.content}` : ''}`;

      const llmProvider = LLMFactory.createProvider(selectedLLM);
      const generatedBio = await llmProvider.generateBio(
        promptSection.content,
        context
      );

      updateContent('output', generatedBio);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      // TODO: Implement save logic
      toast({
        title: "Success",
        description: "BIO Creator data saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save data",
        variant: "destructive",
      });
    }
  };

  const handleCopy = () => {
    const outputSection = sections.find(s => s.id === 'output');
    if (outputSection?.content) {
      navigator.clipboard.writeText(outputSection.content);
      toast({
        title: "Copied",
        description: "BIO copied to clipboard",
      });
    }
  };

  const debouncedProjectSearch = useCallback((searchTerm: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) {
      setSearchResults(prev => ({ ...prev, projects: [] }));
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { pjtData } = await getPJTMasterData(
          supabase,
          1,
          5,
          trimmedTerm,
          'All',
          ['0.Proposal', '1. On going']
        );
        setSearchResults(prev => ({ ...prev, projects: pjtData }));
        setProjectSearchOpen(true);
      } catch (error) {
        console.error('Error searching projects:', error);
        toast({
          title: "Error",
          description: "Failed to search projects",
          variant: "destructive",
        });
      }
      searchTimeoutRef.current = undefined;
    }, 300);
  }, [supabase, toast]);

  const debouncedExpertSearch = useCallback((searchTerm: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) {
      setSearchResults(prev => ({ ...prev, experts: [] }));
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { expertsData } = await getExpertsData(
          supabase,
          1,
          5,
          trimmedTerm
        );
        setSearchResults(prev => ({ ...prev, experts: expertsData }));
        setExpertSearchOpen(true);
      } catch (error) {
        console.error('Error searching experts:', error);
        toast({
          title: "Error",
          description: "Failed to search experts",
          variant: "destructive",
        });
      }
      searchTimeoutRef.current = undefined;
    }, 300);
  }, [supabase, toast]);

  const handleProjectSearchChange = (value: string) => {
    setSections(prev => prev.map(s => 
      s.id === 'project' ? { ...s, searchValue: value } : s
    ));
    debouncedProjectSearch(value);
  };

  const handleExpertSearchChange = (value: string) => {
    setSections(prev => prev.map(s => 
      s.id === 'expert' ? { ...s, searchValue: value } : s
    ));
    debouncedExpertSearch(value);
  };

  const handleProjectSelect = (project: any) => {
    const projectInfo = formatProjectInfo(project);
    updateContent('project', projectInfo);
    setSections(prev => prev.map(s => 
      s.id === 'project' ? { ...s, searchValue: '' } : s
    ));
    setProjectSearchOpen(false);
    setSearchResults(prev => ({ ...prev, projects: [] }));
  };

  const handleExpertSelect = (expert: any) => {
    const expertInfo = formatExpertInfo(expert);
    updateContent('expert', expertInfo);
    setSections(prev => prev.map(s => 
      s.id === 'expert' ? { ...s, searchValue: '' } : s
    ));
    setExpertSearchOpen(false);
    setSearchResults(prev => ({ ...prev, experts: [] }));
  };

  const formatProjectInfo = (project: any) => {
    return `Project Code: ${project.pjt_code}
Status: ${project.status}

Project Topic:
${project.project_topic}

Project Brief:
${project.tag3 || ''}

Research Priorities:
${project.tag4 || ''}

Client: ${project.client}
Contract Type: ${project.contract_type}

Required Number of Calls: ${project.required_nr_of_calls || 0}`;
  };

  const formatExpertInfo = (expert: ExpertData) => {
    const careers = expert.job_from?.split('\n').map((_: string, index: number) => ({
      job_from: expert.job_from?.split('\n')[index] || '',
      job_to: expert.job_to?.split('\n')[index] || '',
      company: expert.company?.split('\n')[index] || '',
      title: expert.title?.split('\n')[index] || ''
    })) || [];

    return `Name: ${expert.name}
Email: ${expert.email}

Career History:
${careers.map(career => 
  `${career.job_from} ~ ${career.job_to}
${career.company}
${career.title}`
).join('\n\n')}

Experience:
${expert.experience || ''}

Description:
${expert.description || ''}`;
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>BIO Creator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prompt Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>{sections[0].title}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('prompt')}
              >
                {sections[0].isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Textarea
              placeholder={sections[0].placeholder}
              value={sections[0].content}
              onChange={(e) => updateContent('prompt', e.target.value)}
              rows={sections[0].isExpanded ? 20 : 5}
              className="resize-none transition-all duration-200"
            />
          </div>

          {/* Project and Expert Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project Info */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Project Information</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('project')}
                >
                  {sections[1].isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Popover 
                open={projectSearchOpen && searchResults.projects.length > 0} 
                onOpenChange={setProjectSearchOpen}
              >
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for a project..."
                      className="pl-8"
                      value={sections.find(s => s.id === 'project')?.searchValue || ''}
                      onChange={(e) => handleProjectSearchChange(e.target.value)}
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <div className="max-h-[300px] overflow-y-auto">
                    {searchResults.projects.map((project) => (
                      <div
                        key={project.id}
                        className="p-2 hover:bg-muted cursor-pointer"
                        onClick={() => handleProjectSelect(project)}
                      >
                        <div className="font-medium">{project.pjt_code}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {project.project_topic}
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Textarea
                placeholder={sections[1].placeholder}
                value={sections[1].content}
                onChange={(e) => updateContent('project', e.target.value)}
                rows={sections[1].isExpanded ? 20 : 5}
                className="resize-none transition-all duration-200"
              />
            </div>

            {/* Expert Info */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Expert Information</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('expert')}
                >
                  {sections[2].isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Popover 
                open={expertSearchOpen && searchResults.experts.length > 0} 
                onOpenChange={setExpertSearchOpen}
              >
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for an expert..."
                      className="pl-8"
                      value={sections.find(s => s.id === 'expert')?.searchValue || ''}
                      onChange={(e) => handleExpertSearchChange(e.target.value)}
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <div className="max-h-[300px] overflow-y-auto">
                    {searchResults.experts.map((expert) => (
                      <div
                        key={expert.id}
                        className="p-2 hover:bg-muted cursor-pointer"
                        onClick={() => handleExpertSelect(expert)}
                      >
                        <div className="font-medium">{expert.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {expert.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Textarea
                placeholder={sections[2].placeholder}
                value={sections[2].content}
                onChange={(e) => updateContent('expert', e.target.value)}
                rows={sections[2].isExpanded ? 20 : 5}
                className="resize-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Sample and Output Sections */}
          {sections.slice(3).map((section) => (
            <div key={section.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>{section.title}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection(section.id)}
                >
                  {section.isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Textarea
                placeholder={section.placeholder}
                value={section.content}
                onChange={(e) => updateContent(section.id, e.target.value)}
                rows={section.isExpanded ? 20 : 5}
                className="resize-none transition-all duration-200"
              />
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <div className="space-x-2 flex items-center">
              <Select
                value={selectedLLM}
                onValueChange={(value: LLMType) => setSelectedLLM(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select LLM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="grok">XAI Grok</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleCreate}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Create BIO"}
              </Button>
              <Button
                variant="outline"
                onClick={handleSave}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy BIO
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 