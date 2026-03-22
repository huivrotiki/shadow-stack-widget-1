import { createOpenAI } from '@ai-sdk/openai';

/**
 * AI Models Configuration based on models.dev
 */
export const AI_MODELS = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    class: 'cheap',
    description: 'Fast and cheap model for simple tasks.',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    class: 'default',
    description: 'Versatile and high-performance model.',
  },
  {
    id: 'o1-mini',
    name: 'o1 Mini',
    provider: 'openai',
    class: 'high-quality',
    description: 'Advanced reasoning model for coding and logic.',
  },
] as const;

export type AIModelId = typeof AI_MODELS[number]['id'];

/**
 * Get model instance based on models.dev classification
 */
export function getModelProvider(modelId: AIModelId) {
  // Normally we would use different provider instances here
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return openai(modelId);
}

/**
 * Simple router to select model by task type
 */
export function routeModelByTask(task: 'chat' | 'code' | 'logic') {
  switch (task) {
    case 'code':
      return 'o1-mini';
    case 'logic':
      return 'gpt-4o';
    case 'chat':
    default:
      return 'gpt-4o-mini';
  }
}
