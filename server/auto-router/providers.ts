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

// --- Provider Functions ---

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
  return openAICompatibleCall(
    'openrouter',
    'https://openrouter.ai/api/v1/chat/completions',
    apiKey,
    model,
    prompt,
  );
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
