import { LLMProvider } from './types';
import { APIProvider } from './api-provider';

export type LLMType = 'openai' | 'gemini';

export class LLMFactory {
  static createProvider(type: LLMType): LLMProvider {
    return new APIProvider(type);
  }
} 