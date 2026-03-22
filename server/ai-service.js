import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function generateGenericText(prompt) {
  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: prompt,
    });
    return text;
  } catch (err) {
    console.error('AI SDK Error:', err);
    return `Error: ${err.message}`;
  }
}
