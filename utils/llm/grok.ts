interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function callGrokAPI(messages: GrokMessage[]): Promise<string> {
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`
      },
      body: JSON.stringify({
        messages,
        model: 'grok-beta',
        stream: false,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.statusText}`);
    }

    const data: GrokResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error: any) {
    throw new Error(`Grok API Error: ${error.message}`);
  }
} 