import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  console.log('Received Telegram Webhook:', body);
  return NextResponse.json({ ok: true });
}
