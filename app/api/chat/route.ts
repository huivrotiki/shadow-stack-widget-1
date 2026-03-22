import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    messages,
    tools: {
      query_files: {
        description: 'Query the project file system for a specific pattern.',
        parameters: z.object({
          pattern: z.string().describe('The search pattern (e.g., "*.md", "app/api/*")'),
        }),
        execute: async ({ pattern }) => {
          const res = await fetch('http://localhost:3001/api/gitops', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'queryFiles', params: { pattern } }),
          });
          return await res.json();
        },
      },
      create_commit: {
        description: 'Create a new git commit for the specified files.',
        parameters: z.object({
          message: z.string().describe('The commit message.'),
          files: z.string().optional().default('.').describe('The files to stage (default is ".")'),
        }),
        execute: async ({ message, files }) => {
          const res = await fetch('http://localhost:3001/api/gitops', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'createCommit', params: { message, files } }),
          });
          return await res.json();
        },
      },
    },
  });

  return result.toTextStreamResponse();
}
