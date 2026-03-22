import { z } from 'zod';
import logger from '../logger.js';
import {
  callOllama,
  callAntigravityGemini,
  callOpenRouter,
  callPerplexity,
  callGrok,
  callKimi,
  callClaude,
  callVercelDeploy,
  checkOllamaHealth,
  checkAntigravityHealth,
  isQuotaExhausted,
  getAllUsage,
  ProviderError,
} from './providers.js';
import { executeWithRetry, executeFallbackCascade } from './fallback.js';

// --- Zod Schemas ---

export const RouteRequestSchema = z.object({
  text: z.string().min(1).max(10000),
  command: z.string().optional(),
  chatId: z.number().optional(),
  sessionId: z.string().default('default'),
  isPremium: z.boolean().default(false),
});

export type RouteRequest = z.infer<typeof RouteRequestSchema>;

export const ROUTE_NAMES = [
  'ollama-short',
  'ollama-analysis',
  'antigravity-gemini',
  'openrouter-free',
  'perplexity',
  'grok',
  'kimi',
  'claude-premium',
  'vercel-deploy',
] as const;

export type RouteName = (typeof ROUTE_NAMES)[number];

export const RouteResponseSchema = z.object({
  route: z.enum(ROUTE_NAMES),
  model: z.string(),
  provider: z.string(),
  status: z.enum(['success', 'error', 'fallback']),
  timestamp: z.string(),
  response: z.string(),
  fallbackUsed: z.boolean(),
  executionTimeMs: z.number(),
});

export type RouteResponse = z.infer<typeof RouteResponseSchema>;

// --- State Machine ---

type RouterState = 'IDLE' | 'ROUTING' | 'EXECUTING' | 'DONE' | 'ERROR';

interface RouteClassification {
  route: RouteName;
  model: string;
  provider: string;
}

// --- Route Mapping ---

const ROUTE_MAP: Record<string, RouteClassification> = {
  '/deploy': { route: 'vercel-deploy', model: 'vercel-cli', provider: 'vercel' },
  '/premium': { route: 'claude-premium', model: 'claude-sonnet-4-20250514', provider: 'anthropic' },
  '/deep': { route: 'perplexity', model: 'sonar', provider: 'perplexity' },
  '/grok': { route: 'grok', model: 'grok-2', provider: 'xai' },
  '/kimi': { route: 'kimi', model: 'moonshot-v1-8k', provider: 'moonshot' },
};

// --- Classification ---

function classifyRoute(input: RouteRequest): RouteClassification {
  // 1. Explicit command routing
  if (input.command && ROUTE_MAP[input.command]) {
    return ROUTE_MAP[input.command];
  }

  // 2. Length-based routing for plain text
  const ollamaRoute: RouteClassification = input.text.length < 80
    ? { route: 'ollama-short', model: 'qwen2.5-coder:3b', provider: 'ollama' }
    : { route: 'ollama-analysis', model: 'qwen2.5:7b', provider: 'ollama' };

  // 3. Quota-aware: if Ollama quota exhausted, try Antigravity Gemini first
  if (isQuotaExhausted('ollama')) {
    logger.info('[AutoRouter] Ollama quota near limit, routing to Antigravity Gemini');
    return { route: 'antigravity-gemini', model: 'gemini-2.0-flash', provider: 'antigravity' };
  }

  return ollamaRoute;
}

// --- Provider Executor ---

async function executeProvider(
  classification: RouteClassification,
  prompt: string,
): Promise<string> {
  switch (classification.route) {
    case 'ollama-short':
      return callOllama('qwen2.5-coder:3b', prompt);
    case 'ollama-analysis':
      return callOllama('qwen2.5:7b', prompt);
    case 'antigravity-gemini':
      return callAntigravityGemini(prompt);
    case 'openrouter-free':
      return callOpenRouter('qwen/qwen-2.5-coder-32b-instruct', prompt);
    case 'perplexity':
      return callPerplexity(prompt);
    case 'grok':
      return callGrok(prompt);
    case 'kimi':
      return callKimi(prompt);
    case 'claude-premium':
      return callClaude(prompt);
    case 'vercel-deploy':
      return callVercelDeploy();
  }
}

// --- Main Entry Point ---

export async function routeRequest(rawInput: unknown): Promise<RouteResponse> {
  const startTime = Date.now();
  let state: RouterState = 'IDLE';

  try {
    // IDLE → ROUTING
    state = 'ROUTING';
    const input = RouteRequestSchema.parse(rawInput);
    logger.info(`[AutoRouter:${input.sessionId}] IDLE → ROUTING | text="${input.text.slice(0, 50)}..." command=${input.command ?? 'none'}`);

    const classification = classifyRoute(input);
    logger.info(`[AutoRouter:${input.sessionId}] Route: ${classification.route} | Model: ${classification.model} | Provider: ${classification.provider}`);

    // ROUTING → EXECUTING
    state = 'EXECUTING';
    logger.info(`[AutoRouter:${input.sessionId}] ROUTING → EXECUTING`);

    // For Ollama routes, check health first
    let needsFallback = false;
    if (classification.provider === 'ollama') {
      const ollamaAlive = await checkOllamaHealth();
      if (!ollamaAlive) {
        logger.warn(`[AutoRouter:${input.sessionId}] Ollama is down, switching to fallback`);
        needsFallback = true;
      }
    }

    let response: string;
    let finalRoute = classification.route;
    let finalModel = classification.model;
    let finalProvider = classification.provider;
    let fallbackUsed = false;

    if (needsFallback) {
      // Direct fallback cascade
      const fallbackResult = await executeFallbackCascade(input.text, classification.route);
      response = fallbackResult.response;
      finalRoute = fallbackResult.route as RouteName;
      finalModel = fallbackResult.model;
      finalProvider = fallbackResult.provider;
      fallbackUsed = true;
    } else {
      try {
        response = await executeWithRetry(
          () => executeProvider(classification, input.text),
          3,
          classification.route,
        );
      } catch (err) {
        // Primary provider failed after retries → fallback cascade
        logger.warn(`[AutoRouter:${input.sessionId}] Primary provider failed, entering fallback cascade`);
        const fallbackResult = await executeFallbackCascade(input.text, classification.route);
        response = fallbackResult.response;
        finalRoute = fallbackResult.route as RouteName;
        finalModel = fallbackResult.model;
        finalProvider = fallbackResult.provider;
        fallbackUsed = true;
      }
    }

    // EXECUTING → DONE
    state = 'DONE';
    const executionTimeMs = Date.now() - startTime;
    logger.info(`[AutoRouter:${input.sessionId}] EXECUTING → DONE | ${executionTimeMs}ms | fallback=${fallbackUsed}`);

    return {
      route: finalRoute,
      model: finalModel,
      provider: finalProvider,
      status: fallbackUsed ? 'fallback' : 'success',
      timestamp: new Date().toISOString(),
      response,
      fallbackUsed,
      executionTimeMs,
    };
  } catch (err: any) {
    // → ERROR
    state = 'ERROR';
    const executionTimeMs = Date.now() - startTime;
    logger.error(`[AutoRouter] → ERROR | ${executionTimeMs}ms | ${err.message}`);

    return {
      route: 'ollama-short',
      model: 'error',
      provider: 'none',
      status: 'error',
      timestamp: new Date().toISOString(),
      response: `Error: ${err.message}`,
      fallbackUsed: false,
      executionTimeMs,
    };
  }
}
