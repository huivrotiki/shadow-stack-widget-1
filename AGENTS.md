# AGENTS.md

## Project: shadow-stack-widget

### Core Structure

- `app/`: Next.js frontend application.
- `server/`: Express API and orchestration logic.
- `PHASES.md`: Detailed plan of orchestration phases.
- `.agent/skills/`: Custom agent skills for orchestration.

### Technology Stack

- **Frontend**: React, Next.js, Vanilla CSS.
- **Backend**: Node.js, Express.
- **Orchestration**: Electron IPC, opencode SDK.
- **LLM Engine**: opencode (multi-routing via Groq, OpenRouter, Local).

### Multi-Router Strategy

Using `@opencode-ai/sdk` to route prompts based on task type:
- `long context`: Local (Ollama/Qwen).
- `coding/refactor`: Groq (Llama-3).
- `fallback`: OpenRouter (GPT-4o-mini).
