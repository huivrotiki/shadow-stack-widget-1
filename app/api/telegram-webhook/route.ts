import { NextResponse } from 'next/server';
import { z } from 'zod';
import { routeRequest, getAllUsage, metaEscalate } from '../../../server/auto-router/index';

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
/escalate — мета-эскалация проблемы (AI chain → human)

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
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4096),
        parse_mode: 'Markdown',
      }),
    });
  } catch (err) {
    console.error('sendTelegramMessage failed:', err);
  }
}

// --- Command Parser ---

function parseCommand(text: string): { command: string | null; rest: string } {
  const match = text.match(/^(\/\w+)(?:\s+(.*))?$/s);
  if (!match) return { command: null, rest: text };
  return { command: match[1], rest: match[2]?.trim() || '' };
}

// --- Background Handler ---
// Runs after 200 is returned to Telegram — never blocks the response.

async function handleUpdate(body: unknown): Promise<void> {
  let update: z.infer<typeof TelegramUpdateSchema>;

  try {
    update = TelegramUpdateSchema.parse(body);
  } catch (err) {
    console.error('Invalid Telegram update:', err);
    return;
  }

  if (!update.message?.text) return;

  const chatId = update.message.chat.id;
  const { command, rest } = parseCommand(update.message.text);

  try {
    switch (command) {
      case '/help': {
        await sendTelegramMessage(chatId, HELP_TEXT);
        break;
      }

      case '/status': {
        try {
          const resp = await fetch('http://localhost:3001/api/orchestrator/prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'status', sessionId: 'telegram' }),
            signal: AbortSignal.timeout(10_000),
          });
          const data = await resp.json();
          await sendTelegramMessage(chatId, `📊 Status:\n\`\`\`\n${JSON.stringify(data, null, 2).slice(0, 3500)}\n\`\`\``);
        } catch {
          await sendTelegramMessage(chatId, '⚠️ Orchestrator недоступен');
        }
        break;
      }

      case '/reset': {
        await sendTelegramMessage(chatId, '🔄 Сессия сброшена');
        break;
      }

      case '/test-router': {
        const testPrompt = rest || 'test message';
        const result = await routeRequest({
          text: testPrompt,
          sessionId: `tg-test-${chatId}`,
        });
        const msg = [
          `🧪 *Test Router Result*`,
          `Input: "${testPrompt}"`,
          `Route: ${result.route}`,
          `Model: ${result.model}`,
          `Provider: ${result.provider}`,
          `Status: ${result.status}`,
          `Time: ${result.executionTimeMs}ms`,
          `Fallback: ${result.fallbackUsed}`,
        ].join('\n');
        await sendTelegramMessage(chatId, msg);
        break;
      }

      case '/escalate': {
        const problem = rest || 'Unknown problem — manual escalation requested';
        await sendTelegramMessage(chatId, '🚨 Запускаю мета-эскалацию...');
        const escalation = await metaEscalate(problem);
        const icon = escalation.status === 'resolved' ? '✅' : escalation.status === 'waiting_for_human' ? '⏳' : '❌';
        const tiers = escalation.attempts.map((a: any) => `${a.success ? '✅' : '❌'} ${a.tier} (${a.durationMs}ms)`).join('\n');
        await sendTelegramMessage(chatId, [
          `${icon} *Meta-Escalation: ${escalation.status}*`,
          `Resolved by: ${escalation.resolvedBy}`,
          ``,
          `*Tiers:*`,
          tiers,
          ``,
          `*Response:*`,
          escalation.response.slice(0, 2000),
        ].join('\n'));
        break;
      }

      case '/usage': {
        const usage = getAllUsage();
        const lines = Object.entries(usage).map(([provider, data]: [string, any]) => {
          const filled = Math.round(data.percent / 10);
          const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
          return `${provider}: ${bar} ${data.count}/${data.limit} (${data.percent}%)`;
        });
        await sendTelegramMessage(chatId, `📊 *Provider Usage*\n\n${lines.join('\n')}`);
        break;
      }

      default: {
        // Auto-route all other messages and unknown commands
        const prompt = rest || update.message.text;

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
        await sendTelegramMessage(
          chatId,
          `${statusIcon} [${result.route}] ${result.model} (${result.executionTimeMs}ms)\n\n${result.response}`,
        );
        break;
      }
    }
  } catch (err: any) {
    console.error('handleUpdate error:', err);
    try {
      await sendTelegramMessage(chatId, `❌ Ошибка: ${err?.message ?? 'unknown'}`);
    } catch {
      // ignore send errors in error handler
    }
  }
}

// --- Webhook Entry Point ---
// Returns 200 immediately so Telegram doesn't retry.
// All processing happens in background via queueMicrotask.

export async function POST(req: Request) {
  // Security: verify webhook secret
  const secret = req.headers.get('x-telegram-bot-api-secret-token');
  const expectedSecret = process.env.TELEGRAM_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return new Response('Forbidden', { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  // Fire-and-forget: process in background, respond immediately
  queueMicrotask(() => {
    handleUpdate(body).catch((err) =>
      console.error('Unhandled error in handleUpdate:', err)
    );
  });

  return new Response('ok', { status: 200 });
}
