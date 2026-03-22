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
   OPENAI_API_KEY=your_key_here
   ```

### Running Locally

- **Frontend (App Router)**: `npm run dev` (Access at `http://localhost:3000`)
- **Backend (Express)**: `npm run api` (Access at `http://localhost:3001`)

---

## 🧠 AI SDK & models.dev

The project is integrated with [Vercel AI SDK](https://sdk.vercel.ai/) for high-performance LLM interactions.

### Features

- **Streaming Chat**: `/chat` route features a premium UI using `useChat`.
- **models.dev Router**: Intelligent model selection based on task type.
- **Express Bridge**: `server/ai-service.js` provides AI capabilities to the Node backend.

### Model Tiers

We use `lib/ai-models.ts` for structured model selection:

- **Cheap (Fast)**: `gpt-4o-mini` – Default for chat.
- **Default**: `gpt-4o` – High quality reasoning.
- **High-Quality**: `o1-mini` – Best for coding and complex logic.

### Demo

Visit `/api/demo/models` to see the current routing configuration and available models.

---

## 🚦 Orchestration & Phases

See [PHASES.md](./PHASES.md) for the current progress of the Anti-Gravity Ralph Loop sequences.
See [AGENTS.md](./AGENTS.md) for the orchestration technical stack details.
