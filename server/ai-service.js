/**
 * AI Service (ESM)
 */
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export async function generateGenericText(prompt) {
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: prompt,
  });

  return text;
}
