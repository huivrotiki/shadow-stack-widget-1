import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Received Telegram Webhook:', body);

    // If message contains "/status", query orchestrator IDLE state or current phase
    if (body?.message?.text === '/status') {
      const resp = await fetch('http://localhost:3001/api/orchestrator/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'status', sessionId: 'telegram' })
      });
      const data = await resp.json();
      console.log('Orchestrator responded:', data);
    }
    
    // If message contains "/deploy", trigger GitOps Phase
    if (body?.message?.text === '/deploy') {
      console.log('Triggering Deploy via Telegram');
      // Here we could call GitOps V1 directly
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error in Telegram Webhook:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
