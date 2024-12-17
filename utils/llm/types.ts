export interface LLMConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  generateBio(prompt: string, context: string): Promise<string>;
}

export interface LLMResponse {
  content?: string;
  error?: string;
}

export type LLMType = 'openai' | 'gemini' | 'grok'; 