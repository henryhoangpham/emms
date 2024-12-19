'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Copy, ChevronDown, ChevronUp, Save, Search, History } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LLMFactory, LLMType } from '@/utils/llm/factory';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { getPJTMasterData, getExpertsData, saveBIOHistory } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import { BIOHistoryDialog } from './BIOHistoryDialog';

const DEFAULT_PROMPT = `Create a professional profile for the expert that will maximize their chances of project approval. The profile should:

1. Content Guidelines:
- Extract and emphasize experience relevant to project requirements
- Showcase concrete achievements with measurable impacts
- Highlight domain expertise and technical depth
- Demonstrate regional/market knowledge
- Focus on recent experience (past 1-2 years)

2. Writing Style:
- Use clear, confident language
- Be specific rather than general
- Focus on facts and achievements
- Maintain professional tone
- Avoid technical jargon unless specifically relevant

3. Structure Requirements:
- Begin with a powerful executive summary
- Organize information in logical sections
- Include relevant metrics and outcomes
- Highlight project-specific qualifications
- Keep total length to 300 words maximum

4. Essential Elements:
- Relevant technical/domain expertise
- Recent project experience
- Industry knowledge
- Consulting track record
- Geographic expertise
- Language capabilities
- Current availability
`;

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

// Add language type and options
type Language = 'EN' | 'JP' | 'KR' | 'CN' | 'VN' | 'TH';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'EN', label: 'English' },
  { value: 'JP', label: 'Japanese' },
  { value: 'KR', label: 'Korean' },
  { value: 'CN', label: 'Chinese' },
  { value: 'VN', label: 'Vietnamese' },
  { value: 'TH', label: 'Thai' }
];

const DEFAULT_SAMPLE_OUTPUT = `EXPERT CREDENTIALS

Executive Summary:
[2-3 impactful sentences highlighting core expertise and value proposition]

Domain Expertise:
- [Primary area of specialization]
- [Key technical competencies]
- [Relevant methodologies/frameworks]

Recent Achievements:
- [Key project outcome 1]
- [Key project outcome 2]
- [Key project outcome 3]

Industry Experience:
- [Sector expertise]
- [Types of organizations served]
- [Notable solutions delivered]

Geographic Coverage:
- [Regional experience]
- [Market knowledge]
- [Cultural understanding]

Additional Information:
- Languages: [List relevant languages]
- Availability: [Current status]
- Location: [Base location/time zone]

Value Proposition:
[1-2 sentences on unique qualifications and potential contribution]`;

// Add user prop to component
interface BIOCreatorProps {
  user: any;
}

export default function BIOCreator({ user }: BIOCreatorProps) {
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
      isExpanded: false,
      placeholder: 'Generated bio will appear here...'
    }
  ]);

  const [projectSearch, setProjectSearch] = useState('');
  const [expertSearch, setExpertSearch] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLLM, setSelectedLLM] = useState<LLMType>('openai');

  // Add language state
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('EN');

  // Add state
  const [historyOpen, setHistoryOpen] = useState(false);

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

  // Update handleCreate to save history
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

      const languagePrompt = selectedLanguage === 'EN' 
        ? promptSection.content 
        : `${promptSection.content}\n\nPlease generate the bio in ${LANGUAGES.find(l => l.value === selectedLanguage)?.label} language.`;

      const context = `
\n\n
---
Project Information:
${projectSection.content}
---
\n\n
---
Expert Information:
${expertSection.content}
---
\n\n
${sampleSection?.content ? `Sample Output:
${sampleSection.content}` : ''}`;

      const llmProvider = LLMFactory.createProvider(selectedLLM);
      const generatedBio = await llmProvider.generateBio(
        languagePrompt,
        context
      );
      console.log(`generatedBio: ${generatedBio}`);

      // Save to history using the new query function
      await saveBIOHistory(supabase, {
        user_email: user.email,
        llm_type: selectedLLM,
        language: selectedLanguage,
        prompt: promptSection.content,
        project_info: projectSection.content,
        expert_info: expertSection.content,
        sample_output: sampleSection?.content || '',
        generated_bio: generatedBio
      });

      updateContent('output', generatedBio);
    } catch (error: any) {
      console.error('Error generating bio:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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

  // Initialize sample output
  useEffect(() => {
    updateContent('sample', DEFAULT_SAMPLE_OUTPUT);
  }, []);

  // Add handler
  const handleHistorySelect = (history: any) => {
    // Update each section with the history data
    setSections(sections.map(section => {
      switch (section.id) {
        case 'prompt':
          return { ...section, content: history.prompt };
        case 'project':
          return { ...section, content: history.project_info };
        case 'expert':
          return { ...section, content: history.expert_info };
        case 'sample':
          return { ...section, content: history.sample_output };
        case 'output':
          return { ...section, content: history.generated_bio };
        default:
          return section;
      }
    }));

    // Update other states
    setSelectedLLM(history.llm_type as LLMType);
    setSelectedLanguage(history.language as Language);
  };

  return (
    <div className="w-full mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>BIO Creator</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project and Expert Search/Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project Section */}
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

            {/* Expert Section */}
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

          {/* Prompt and Sample Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prompt Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Prompt</Label>
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

            {/* Sample Output Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Sample Output</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('sample')}
                >
                  {sections[3].isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Textarea
                placeholder={sections[3].placeholder}
                value={sections[3].content}
                onChange={(e) => updateContent('sample', e.target.value)}
                rows={sections[3].isExpanded ? 20 : 5}
                className="resize-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Output Section with Floating Copy Button */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Generated BIO</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('output')}
              >
                {sections[4].isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="relative">
              <Textarea
                placeholder={sections[4].placeholder}
                value={sections[4].content}
                onChange={(e) => updateContent('output', e.target.value)}
                rows={sections[4].isExpanded ? 20 : 5}
                className="resize-none transition-all duration-200"
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Select
              value={selectedLLM}
              onValueChange={(value: LLMType) => setSelectedLLM(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select LLM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI GPT-4o</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="grok">XAI Grok</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedLanguage}
              onValueChange={(value: Language) => setSelectedLanguage(value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleCreate}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Create BIO"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <BIOHistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={handleHistorySelect}
        userEmail={user.email}
      />
    </div>
  );
} 