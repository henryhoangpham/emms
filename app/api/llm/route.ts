import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { callGrokAPI } from '@/utils/llm/grok';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { provider, prompt, context } = await req.json();

    let result = '';

    switch (provider) {
      case 'openai':
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          temperature: 0.7,
          max_tokens: 10000,
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
        result = completion.choices[0]?.message?.content || '';
        break;

      case 'gemini':
        const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
        const response = await model.generateContent([
          { text: prompt },
          { text: context }
        ]);
        result = response.response.text();
        break;

      case 'grok':
        result = await callGrokAPI([
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: context
          }
        ]);
        break;

      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }

    return NextResponse.json({ content: result });
  } catch (error: any) {
    console.error('LLM API Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 