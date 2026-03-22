import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const data = await req.json();
  const { action, params } = data;

  const response = await fetch('http://localhost:3001/api/gitops', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, params }),
  });

  const result = await response.json();
  return NextResponse.json(result);
}
