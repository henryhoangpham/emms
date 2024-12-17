import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMConfig, LLMProvider } from './types';

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenerativeAI;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  async generateBio(prompt: string, context: string): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: this.config.model || 'gemini-pro'
      });

      const result = await model.generateContent([
        { text: prompt },
        { text: context }
      ]);

      const response = await result.response;
      return response.text();
    } catch (error: any) {
      throw new Error(`Gemini Error: ${error.message}`);
    }
  }
} 