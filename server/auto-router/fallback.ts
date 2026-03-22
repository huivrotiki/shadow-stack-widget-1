import logger from '../logger.js';
import { ProviderError, callOllama, callOpenRouter, checkOllamaHealth } from './providers.js';

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

export async function executeFallbackCascade(
  prompt: string,
  excludeRoute?: string,
): Promise<FallbackResult> {
  const chain: Array<{
    route: string;
    model: string;
    provider: string;
    call: () => Promise<string>;
  }> = [
    {
      route: 'ollama-short',
      model: 'qwen2.5-coder:3b',
      provider: 'ollama',
      call: () => callOllama('qwen2.5-coder:3b', prompt),
    },
    {
      route: 'openrouter-free',
      model: 'qwen/qwen-2.5-coder-32b-instruct',
      provider: 'openrouter',
      call: () => callOpenRouter('qwen/qwen-2.5-coder-32b-instruct', prompt),
    },
  ];

  // Check Ollama health before trying it in cascade
  const ollamaAlive = await checkOllamaHealth();

  for (const step of chain) {
    if (step.route === excludeRoute) continue;
    if (step.provider === 'ollama' && !ollamaAlive) {
      logger.warn(`[Fallback] Skipping ${step.route} — Ollama is down`);
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
    'All providers in fallback cascade failed. Check Ollama status and OPENROUTER_API_KEY.',
  );
}
