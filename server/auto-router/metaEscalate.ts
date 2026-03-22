import logger from '../logger.js';
import { callPerplexity, callOpenRouter, ProviderError } from './providers';
import { executeWithRetry } from './fallback';

// --- Types ---

export type EscalationStatus = 'resolved' | 'waiting_for_human' | 'all_failed';

export interface EscalationResult {
  status: EscalationStatus;
  resolvedBy: string;
  response: string;
  attempts: EscalationAttempt[];
  timestamp: string;
}

interface EscalationAttempt {
  tier: string;
  success: boolean;
  error?: string;
  durationMs: number;
}

// --- Telegram Human Escalation ---

async function escalateToHuman(problem: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    logger.error('[MetaEscalate] Cannot escalate to human: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
    return false;
  }

  const message = `🚨 *Meta-Escalation: Human Required*\n\n` +
    `*Problem:*\n${problem.slice(0, 3000)}\n\n` +
    `*All AI tiers failed.* Please respond with a solution.\n` +
    `_Timestamp: ${new Date().toISOString()}_`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch (err: any) {
    logger.error(`[MetaEscalate] Telegram send failed: ${err.message}`);
    return false;
  }
}

// --- Meta-Escalation Chain ---

export async function metaEscalate(problem: string): Promise<EscalationResult> {
  const attempts: EscalationAttempt[] = [];
  const escalationPrompt = `You are a senior engineer debugging an AI orchestration system called Shadow Stack.
The system encountered a problem it cannot solve autonomously.

PROBLEM:
${problem}

Provide a concrete, actionable solution. If you need more context, say exactly what information is missing.
Be specific: file paths, code snippets, commands to run.`;

  logger.info(`[MetaEscalate] Starting escalation chain for: "${problem.slice(0, 100)}..."`);

  // --- Tier 1: Perplexity (search + context) ---
  const t1Start = Date.now();
  try {
    const response = await executeWithRetry(
      () => callPerplexity(escalationPrompt),
      2,
      'meta-perplexity',
    );
    attempts.push({ tier: 'perplexity', success: true, durationMs: Date.now() - t1Start });
    logger.info(`[MetaEscalate] Resolved by Perplexity in ${Date.now() - t1Start}ms`);
    return {
      status: 'resolved',
      resolvedBy: 'perplexity',
      response,
      attempts,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    attempts.push({ tier: 'perplexity', success: false, error: err.message, durationMs: Date.now() - t1Start });
    logger.warn(`[MetaEscalate] Perplexity failed: ${err.message}`);
  }

  // --- Tier 2: GPT-4o via OpenRouter ---
  const t2Start = Date.now();
  try {
    const response = await executeWithRetry(
      () => callOpenRouter('openai/gpt-4o', escalationPrompt),
      2,
      'meta-gpt4o',
    );
    attempts.push({ tier: 'gpt-4o-openrouter', success: true, durationMs: Date.now() - t2Start });
    logger.info(`[MetaEscalate] Resolved by GPT-4o in ${Date.now() - t2Start}ms`);
    return {
      status: 'resolved',
      resolvedBy: 'gpt-4o-openrouter',
      response,
      attempts,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    attempts.push({ tier: 'gpt-4o-openrouter', success: false, error: err.message, durationMs: Date.now() - t2Start });
    logger.warn(`[MetaEscalate] GPT-4o failed: ${err.message}`);
  }

  // --- Tier 3: Telegram Human ---
  const t3Start = Date.now();
  const humanSent = await escalateToHuman(problem);
  attempts.push({
    tier: 'telegram-human',
    success: humanSent,
    error: humanSent ? undefined : 'Failed to send Telegram message',
    durationMs: Date.now() - t3Start,
  });

  if (humanSent) {
    logger.info('[MetaEscalate] Escalated to human via Telegram, awaiting response');
    return {
      status: 'waiting_for_human',
      resolvedBy: 'telegram-human',
      response: 'Problem escalated to human operator via Telegram. Awaiting response.',
      attempts,
      timestamp: new Date().toISOString(),
    };
  }

  // --- All tiers failed ---
  logger.error('[MetaEscalate] All escalation tiers failed');
  return {
    status: 'all_failed',
    resolvedBy: 'none',
    response: 'All escalation tiers failed (Perplexity, GPT-4o, Telegram). Manual intervention required.',
    attempts,
    timestamp: new Date().toISOString(),
  };
}
