'use client';

import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Copy, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LLMFactory, LLMType } from '@/utils/llm/factory';

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
}

export default function BIOCreator() {
  const { toast } = useToast();
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
      placeholder: 'Enter project information here...'
    },
    {
      id: 'expert',
      title: 'Expert Information',
      content: '',
      isExpanded: false,
      placeholder: 'Enter expert information here...'
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

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>BIO Creator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Search Project</Label>
              <Input
                placeholder="Search for a project..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
              />
            </div>
            <div>
              <Label>Search Expert</Label>
              <Input
                placeholder="Search for an expert..."
                value={expertSearch}
                onChange={(e) => setExpertSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Sections */}
          {sections.map((section) => (
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
                  <SelectItem value="grok">Grok</SelectItem>
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