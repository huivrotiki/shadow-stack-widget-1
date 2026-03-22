import { generateText } from 'ai';
import { getModelProvider, routeModelByTask } from '../lib/ai-models.ts';

export async function generateGenericText(prompt) {
  try {
    // Standardized routing for server-side generic requests
    const modelId = routeModelByTask('chat');
    const model = getModelProvider(modelId);

    const { text } = await generateText({
      model,
      prompt: prompt,
    });
    return text;
  } catch (err) {
    console.error('AI SDK Error:', err);
    return `Error: ${err.message}`;
  }
}
