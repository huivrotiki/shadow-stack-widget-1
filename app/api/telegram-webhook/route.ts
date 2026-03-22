import { NextResponse } from 'next/server';
import { z } from 'zod';
import { routeRequest, getAllUsage } from '../../../server/auto-router/index.js';

// --- Zod Schemas ---

const TelegramMessageSchema = z.object({
  message_id: z.number(),
  from: z.object({
    id: z.number(),
    first_name: z.string(),
    username: z.string().optional(),
  }),
  chat: z.object({
    id: z.number(),
    type: z.enum(['private', 'group', 'supergroup', 'channel']),
  }),
  date: z.number(),
  text: z.string().optional(),
});

const TelegramUpdateSchema = z.object({
  update_id: z.number(),
  message: TelegramMessageSchema.optional(),
});

// --- Constants ---

const COMMANDS = ['/status', '/deploy', '/premium', '/deep', '/grok', '/kimi', '/help', '/reset'] as const;

const HELP_TEXT = `🤖 *Shadow Stack Auto-Router*

Команды:
/help — список команд
/status — статус оркестратора
/deploy — Vercel production deploy
/premium — Claude Sonnet (платно)
/deep — Perplexity поиск
/grok — Grok AI
/kimi — Kimi (Moonshot)
/reset — сброс сессии
/test-router — тест роутинга (показывает route без вызова LLM)
/usage — текущие квоты провайдеров

Обычный текст → автоматический роутинг:
• < 80 символов → Ollama qwen2.5-coder:3b (локально)
• >= 80 символов → Ollama qwen2.5:7b (локально)
• Fallback → OpenRouter (бесплатно)`;

// --- Telegram API ---

async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is not set');
    return;
  }

  const truncated = text.slice(0, 4096);

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: truncated,
      parse_mode: 'Markdown',
    }),
  });
}

// --- Command Parser ---

function parseCommand(text: string): { command: string | null; rest: string } {
  const match = text.match(/^(\/\w+)(?:\s+(.*))?$/s);
  if (!match) return { command: null, rest: text };
  return { command: match[1], rest: match[2]?.trim() || '' };
}

// --- Webhook Handler ---

export async function POST(req: Request) {
  try {
    // Security: verify webhook secret
    const secret = req.headers.get('x-telegram-bot-api-secret-token');
    const expectedSecret = process.env.TELEGRAM_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const body = await req.json();
    const update = TelegramUpdateSchema.parse(body);

    if (!update.message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const { command, rest } = parseCommand(update.message.text);

    // Handle commands
    switch (command) {
      case '/help': {
        await sendTelegramMessage(chatId, HELP_TEXT);
        return NextResponse.json({ ok: true });
      }

      case '/status': {
        try {
          const resp = await fetch('http://localhost:3001/api/orchestrator/prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'status', sessionId: 'telegram' }),
          });
          const data = await resp.json();
          await sendTelegramMessage(chatId, `📊 Status: ${JSON.stringify(data, null, 2)}`);
        } catch {
          await sendTelegramMessage(chatId, '⚠️ Orchestrator недоступен');
        }
        return NextResponse.json({ ok: true });
      }

      case '/reset': {
        await sendTelegramMessage(chatId, '🔄 Сессия сброшена');
        return NextResponse.json({ ok: true });
      }

      case '/test-router': {
        const testPrompt = rest || 'test message';
        const result = await routeRequest({
          text: testPrompt,
          sessionId: `tg-test-${chatId}`,
        });
        const msg = `🧪 *Test Router Result*\n\nInput: "${testPrompt}"\nRoute: ${result.route}\nModel: ${result.model}\nProvider: ${result.provider}\nStatus: ${result.status}\nTime: ${result.executionTimeMs}ms\nFallback: ${result.fallbackUsed}`;
        await sendTelegramMessage(chatId, msg);
        return NextResponse.json({ ok: true });
      }

      case '/usage': {
        const usage = getAllUsage();
        const lines = Object.entries(usage).map(([provider, data]) => {
          const bar = '█'.repeat(Math.round(data.percent / 10)) + '░'.repeat(10 - Math.round(data.percent / 10));
          return `${provider}: ${bar} ${data.count}/${data.limit} (${data.percent}%)`;
        });
        await sendTelegramMessage(chatId, `📊 *Provider Usage*\n\n${lines.join('\n')}`);
        return NextResponse.json({ ok: true });
      }

      default: {
        // Route through Auto-Router
        const prompt = rest || update.message.text;

        // Send "processing" for long operations
        if (command === '/deploy' || command === '/premium') {
          await sendTelegramMessage(chatId, '⏳ Обработка...');
        }

        const result = await routeRequest({
          text: prompt,
          command: command ?? undefined,
          chatId,
          sessionId: `tg-${chatId}`,
        });

        const statusIcon = result.status === 'success' ? '✅' : result.status === 'fallback' ? '🔄' : '❌';
        const header = `${statusIcon} [${result.route}] ${result.model} (${result.executionTimeMs}ms)`;
        const message = `${header}\n\n${result.response}`;

        await sendTelegramMessage(chatId, message);
        return NextResponse.json({ ok: true });
      }
    }
  } catch (err: any) {
    console.error('Telegram webhook error:', err);

    if (err.name === 'ZodError') {
      return NextResponse.json({ ok: false, error: 'Invalid update format' }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
