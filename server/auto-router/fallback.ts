import logger from '../logger.js';
import {
  ProviderError,
  callOllama,
  callAntigravityGemini,
  callOpenRouter,
  callKimi,
  callClaude,
  checkOllamaHealth,
  checkAntigravityHealth,
  isQuotaExhausted,
} from './providers.js';

export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  label = 'unknown',
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isRetryable = err instanceof ProviderError && err.isRetryable;
      if (!isRetryable || attempt === retries - 1) {
        throw err;
      }
      const delay = Math.pow(2, attempt) * 1000;
      logger.warn(`[Fallback] Retry ${attempt + 1}/${retries} for ${label} after ${delay}ms: ${err.message}`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}

export interface FallbackResult {
  route: string;
  model: string;
  provider: string;
  response: string;
}

// Full cascade: Ollama → Antigravity Gemini → OpenRouter → Kimi → Claude
export async function executeFallbackCascade(
  prompt: string,
  excludeRoute?: string,
): Promise<FallbackResult> {
  const chain: Array<{
    route: string;
    model: string;
    provider: string;
    call: () => Promise<string>;
    healthCheck?: () => Promise<boolean>;
    isFree: boolean;
  }> = [
    {
      route: 'ollama-short',
      model: 'qwen2.5-coder:3b',
      provider: 'ollama',
      call: () => callOllama('qwen2.5-coder:3b', prompt),
      healthCheck: checkOllamaHealth,
      isFree: true,
    },
    {
      route: 'antigravity-gemini',
      model: 'gemini-2.0-flash',
      provider: 'antigravity',
      call: () => callAntigravityGemini(prompt),
      healthCheck: checkAntigravityHealth,
      isFree: true,
    },
    {
      route: 'openrouter-free',
      model: 'qwen/qwen-2.5-coder-32b-instruct',
      provider: 'openrouter',
      call: () => callOpenRouter('qwen/qwen-2.5-coder-32b-instruct', prompt),
      isFree: true,
    },
    {
      route: 'kimi',
      model: 'moonshot-v1-8k',
      provider: 'kimi',
      call: () => callKimi(prompt),
      isFree: false,
    },
    {
      route: 'claude-premium',
      model: 'claude-sonnet-4-20250514',
      provider: 'claude',
      call: () => callClaude(prompt),
      isFree: false,
    },
  ];

  for (const step of chain) {
    if (step.route === excludeRoute) continue;

    // Skip if quota exhausted (90% threshold)
    if (isQuotaExhausted(step.provider)) {
      logger.warn(`[Fallback] Skipping ${step.route} — quota exhausted (${step.provider})`);
      continue;
    }

    // Health check if available
    if (step.healthCheck) {
      const alive = await step.healthCheck();
      if (!alive) {
        logger.warn(`[Fallback] Skipping ${step.route} — ${step.provider} is down`);
        continue;
      }
    }

    // Skip paid providers unless explicitly enabled
    if (!step.isFree && !process.env[`${step.provider.toUpperCase()}_API_KEY`] && step.provider !== 'kimi') {
      logger.warn(`[Fallback] Skipping ${step.route} — no API key for ${step.provider}`);
      continue;
    }

    try {
      logger.info(`[Fallback] Trying ${step.route} (${step.model})`);
      const response = await executeWithRetry(() => step.call(), 2, step.route);
      logger.info(`[Fallback] Success via ${step.route}`);
      return {
        route: step.route,
        model: step.model,
        provider: step.provider,
        response,
      };
    } catch (err: any) {
      logger.error(`[Fallback] ${step.route} failed: ${err.message}`);
    }
  }

  throw new ProviderError(
    'fallback',
    503,
    'All providers in fallback cascade failed. Check: Ollama, Antigravity, OpenRouter, API keys.',
  );
}
