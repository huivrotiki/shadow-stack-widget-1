import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getModelProvider, routeModelByTask } from '../../../lib/ai-models';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Use the models.dev router logic
  const modelId = routeModelByTask('chat');
  const model = getModelProvider(modelId);

  const result = await streamText({
    model,
    messages,
    tools: {
      query_files: tool({
        description: 'Query the project file system for a specific pattern.',
        inputSchema: z.object({
          pattern: z.string().describe('The search pattern (e.g., "*.md", "app/api/*")'),
        }),
        execute: async ({ pattern }: { pattern: string }) => {
          const res = await fetch('http://localhost:3001/api/gitops', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'queryFiles', params: { pattern } }),
          });
          return await res.json();
        },
      }),
      create_commit: tool({
        description: 'Create a new git commit for the specified files.',
        inputSchema: z.object({
          message: z.string().describe('The commit message.'),
          files: z.string().optional().default('.').describe('The files to stage (default is ".")'),
        }),
        execute: async ({ message, files }: { message: string, files: string }) => {
          const res = await fetch('http://localhost:3001/api/gitops', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'createCommit', params: { message, files } }),
          });
          return await res.json();
        },
      }),
    },
  });

  return result.toTextStreamResponse();
}
