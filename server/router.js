export async function runPrompt(text, sessionId) {
  console.log(`[Orchestrator] Running prompt for session ${sessionId}: "${text}"`);
  return {
    status: 'success',
    response: `Orchestrator received: ${text}`,
    sessionId
  };
}
