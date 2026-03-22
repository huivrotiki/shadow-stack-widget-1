// scripts/run-ralph-loop.js
import { execSync } from 'child_process';

async function runCommand(text, sessionId) {
  const fetch = (await import('node-fetch')).default || global.fetch;
  const res = await fetch('http://localhost:3001/api/orchestrator/prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sessionId })
  });
  return res.json();
}

async function startLoop() {
  const sessionId = 'cycle_1_' + Date.now();
  console.log(`Starting Ralph Loop Cycle 1 (Session: ${sessionId})`);

  let isComplete = false;
  let text = 'start';
  
  while (!isComplete) {
    const result = await runCommand(text, sessionId);
    console.log(`\n▶ [${result.phase || result.status}] ${result.message || 'Data received'}`);
    
    if (result.status === 'success' && result.message === 'Cycle Complete. Awaiting manual review.') {
      isComplete = true;
      console.log('✅ Ralph Loop Cycle 1 finished.');
      break;
    }
    
    // Simulate thinking/processing time
    await new Promise(r => setTimeout(r, 1000));
    text = 'proceed to next';
  }
}

startLoop().catch(console.error);
