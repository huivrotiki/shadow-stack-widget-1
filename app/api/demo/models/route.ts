import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { AI_MODELS, routeModelByTask, getModelProvider } from '../../../../lib/ai-models';

/**
 * Demo Route: Lists available models and performs a test routing.
 * Requirement: 4 (Демонстрационный сценарий)
 */
export async function GET() {
  const tasks = ['chat', 'code', 'image', 'logic'] as const;
  
  const routingDemo = tasks.map(task => ({
    task,
    selectedModel: routeModelByTask(task)
  }));

  let testResult = null;
  const testModelId = routeModelByTask('chat');
  const testModel = getModelProvider(testModelId);

  try {
    const { text } = await generateText({
      model: testModel,
      prompt: "Reply with 'Shadow Stack Connected!' if you hear me.",
    });
    testResult = text;
  } catch (error: any) {
    testResult = `Error: ${error.message}. (Ensure OPENAI_API_KEY is set in .env.local)`;
  }

  return NextResponse.json({
    message: "Shadow Stack AI SDK Demo",
    availableModels: AI_MODELS,
    routingDemo,
    testExecution: {
      model: testModelId,
      prompt: "Status check",
      response: testResult
    },
    usage: {
      environment: "Set OPENAI_API_KEY in .env.local",
      frontend: "/chat (Dashboard with Vercel AI SDK)",
      backend: "/api/chat (Express SSE)",
      docs: "Read README.md for AI section"
    }
  });
}
