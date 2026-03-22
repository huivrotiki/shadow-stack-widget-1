import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// --- ProviderError ---

export class ProviderError extends Error {
  constructor(
    public provider: string,
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }

  get isRetryable(): boolean {
    return this.status === 429 || this.status >= 500;
  }
}

// --- Helpers ---

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ProviderError('env', 0, `Missing required env var: ${name}`);
  }
  return value;
}

async function openAICompatibleCall(
  provider: string,
  url: string,
  apiKey: string,
  model: string,
  prompt: string,
  extraHeaders?: Record<string, string>,
): Promise<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ProviderError(provider, res.status, `${provider} HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// --- Usage Tracking (in-memory, resets hourly) ---

interface UsageEntry {
  count: number;
  resetAt: number;
}

const usageStore = new Map<string, UsageEntry>();

const PROVIDER_LIMITS: Record<string, number> = {
  ollama: Infinity,
  antigravity: 50,    // Gemini free pool ~50 req/hr
  openrouter: 100,    // OpenRouter free tier
  perplexity: 30,     // Subscription tier
  grok: 30,
  kimi: 50,
  claude: 20,         // Pay-per-use, keep low
};

export function trackUsage(provider: string): void {
  const now = Date.now();
  const entry = usageStore.get(provider);
  if (!entry || now > entry.resetAt) {
    usageStore.set(provider, { count: 1, resetAt: now + 3600_000 });
  } else {
    entry.count++;
  }
}

export function getUsage(provider: string): { count: number; limit: number; percent: number } {
  const entry = usageStore.get(provider);
  const count = entry && Date.now() < entry.resetAt ? entry.count : 0;
  const limit = PROVIDER_LIMITS[provider] ?? 100;
  return { count, limit, percent: Math.round((count / limit) * 100) };
}

export function isQuotaExhausted(provider: string, threshold = 90): boolean {
  const { percent } = getUsage(provider);
  return percent >= threshold;
}

export function getAllUsage(): Record<string, { count: number; limit: number; percent: number }> {
  const result: Record<string, { count: number; limit: number; percent: number }> = {};
  for (const provider of Object.keys(PROVIDER_LIMITS)) {
    result[provider] = getUsage(provider);
  }
  return result;
}

// --- Provider Functions ---

export async function callAntigravityGemini(prompt: string): Promise<string> {
  const endpoint = process.env.OPENCODE_ENDPOINT || 'http://localhost:3001';
  const token = process.env.ANTIGRAVITY_OAUTH_TOKEN;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${endpoint}/v1/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'gemini-2.0-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ProviderError('antigravity', res.status, `Antigravity Gemini HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  trackUsage('antigravity');
  return data.choices?.[0]?.message?.content ?? '';
}

export async function checkAntigravityHealth(): Promise<boolean> {
  try {
    const endpoint = process.env.OPENCODE_ENDPOINT || 'http://localhost:3001';
    const res = await fetch(`${endpoint}/v1/models`, {
      signal: AbortSignal.timeout(2_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function callOllama(model: string, prompt: string): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ProviderError('ollama', res.status, `Ollama HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  trackUsage('ollama');
  return data.response ?? '';
}

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(2_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function callOpenRouter(model: string, prompt: string): Promise<string> {
  const apiKey = requireEnv('OPENROUTER_API_KEY');
  const result = await openAICompatibleCall(
    'openrouter',
    'https://openrouter.ai/api/v1/chat/completions',
    apiKey,
    model,
    prompt,
  );
  trackUsage('openrouter');
  return result;
}

export async function callPerplexity(prompt: string): Promise<string> {
  const apiKey = requireEnv('PERPLEXITY_API_KEY');
  return openAICompatibleCall(
    'perplexity',
    'https://api.perplexity.ai/chat/completions',
    apiKey,
    'sonar',
    prompt,
  );
}

export async function callGrok(prompt: string): Promise<string> {
  const apiKey = requireEnv('GROK_API_KEY');
  return openAICompatibleCall(
    'grok',
    'https://api.x.ai/v1/chat/completions',
    apiKey,
    'grok-2',
    prompt,
  );
}

export async function callKimi(prompt: string): Promise<string> {
  const apiKey = requireEnv('KIMI_API_KEY');
  return openAICompatibleCall(
    'kimi',
    'https://api.moonshot.cn/v1/chat/completions',
    apiKey,
    'moonshot-v1-8k',
    prompt,
  );
}

export async function callClaude(prompt: string): Promise<string> {
  const apiKey = requireEnv('ANTHROPIC_API_KEY');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ProviderError('claude', res.status, `Claude HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

export async function callVercelDeploy(): Promise<string> {
  const token = requireEnv('VERCEL_TOKEN');
  try {
    const { stdout, stderr } = await execAsync(
      `vercel --prod --yes --token=${token}`,
      { timeout: 120_000, cwd: process.cwd() },
    );
    return stdout || stderr;
  } catch (err: any) {
    throw new ProviderError('vercel', 1, `Vercel deploy failed: ${err.message?.slice(0, 200)}`);
  }
}
