import OpenAI from 'openai';
import { LLMConfig, LLMProvider, LLMResponse } from './types';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  async generateBio(prompt: string, context: string): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4',
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 1000,
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: context
          }
        ],
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error: any) {
      throw new Error(`OpenAI Error: ${error.message}`);
    }
  }
} 