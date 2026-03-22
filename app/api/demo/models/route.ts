import { NextResponse } from 'next/server';
import { AI_MODELS, routeModelByTask } from '../../../lib/ai-models.ts';

/**
 * Demo Route: Lists available models and performs a test routing.
 */
export async function GET() {
  const tasks = ['chat', 'code', 'logic'] as const;
  
  const routingDemo = tasks.map(task => ({
    task,
    selectedModel: routeModelByTask(task)
  }));

  return NextResponse.json({
    message: "Shadow Stack AI SDK Demo",
    availableModels: AI_MODELS,
    routingDemo,
    usage: {
      step1: "Set OPENAI_API_KEY in .env.local",
      step2: "Visit /chat for streaming UI",
      step3: "Use server/ai-service.js for Express tasks"
    }
  });
}
