import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Allow responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    messages,
  });

  return result.toTextStreamResponse();
}
