import { LLMProvider, LLMResponse } from './types';

export class APIProvider implements LLMProvider {
  private provider: string;

  constructor(provider: string) {
    this.provider = provider;
  }

  async generateBio(prompt: string, context: string): Promise<string> {
    try {
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: this.provider,
          prompt,
          context,
        }),
      });

      const data: LLMResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data.content || '';
    } catch (error: any) {
      console.log(`LLM API Error: ${error.message}`);
      throw new Error(`LLM API Error: ${error.message}`);
    }
  }
} 