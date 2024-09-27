
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.AGORA_AI_AGENT_URL || "http://47.251.115.141:8081";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log({body})
    const {action, channel_name, uid} = body
    const requestBody = {
        channel_name,
        uid
    }
    const response = await fetch(`${API_BASE_URL}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}