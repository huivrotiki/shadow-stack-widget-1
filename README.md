# shadow-stack-widget

Shadow Stack v3.2 – AI-powered dev setup autopilot widget (Electron + React + Vite)

---

## 🚀 Getting Started

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Copy `.env.example` to `.env.local` and add your keys:
   ```bash
   OPENAI_API_KEY=sk-xxxx...
   ```

### Running Locally

- **Unified Launch**: `npm run orchestrator:start`
- **Frontend Only**: `npm run dev` (Access at `http://localhost:3000`)
- **Backend Only**: `npm run api` (Access at `http://localhost:3001`)

---

## 🧠 AI SDK & models.dev

This project is powered by [Vercel AI SDK](https://sdk.vercel.ai/) for high-performance LLM interactions and function-calling.

### Features

- **Streaming Dashboard**: `/chat` route features a premium UI Dashboard with real-time logs and phase control.
- **models.dev Router**: Intelligent model selection based on categories (`chat`, `code`, `image`, `logic`).
- **GitOps Toolset**: AI can autonomously query files and create commits via the integrated tool calling.
- **Express ESM Integration**: `server/ai-service.js` provides AI capabilities to the backend using modern ESM syntax.

### Model Tiers (models.dev)

We use `lib/ai-models.ts` for structured model selection:

- **Cheap (Fast)**: `gpt-4o-mini` (0.15$/1M tokens).
- **Default**: `gpt-4o` (5.00$/1M tokens).
- **High-Quality**: `o1-mini` (3.00$/1M tokens, Reasoning-heavy).
- **Image**: `dall-e-3`.

### Type-Safe Model Selection

```typescript
import { routeModelByTask } from '@/lib/ai-models';

const modelId = routeModelByTask('code'); // returns 'o1-mini'
```

### Extending Models

To add a new provider (e.g., Anthropic), update `lib/ai-models.ts` with a new `id` and configure the provider instance.

### Demo & Health Check

Visit `/api/demo/models` to perform a real-time status check and view current model routing benchmarks.

---

## 🚦 Orchestration & Phases

See [PHASES.md](./PHASES.md) for the current progress of the Anti-Gravity Ralph Loop sequences.
See [AGENTS.md](./AGENTS.md) for the orchestration technical stack details.

---

## 🛡 Security Policy

- No API keys are hardcoded.
- All secrets are managed via `.env` or Doppler.
- AI tools have restricted scope to prevent unintended file deletions.
