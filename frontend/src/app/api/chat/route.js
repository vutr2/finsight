import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Bạn là Finsight AI — trợ lý phân tích thị trường chứng khoán Việt Nam.
Bạn giúp người dùng phân tích cổ phiếu, xu hướng thị trường, chiến lược đầu tư và quản lý danh mục.
Trả lời bằng tiếng Việt, ngắn gọn và chính xác. Khi đưa ra khuyến nghị đầu tư, luôn nhắc nhở rằng đây là thông tin tham khảo, không phải tư vấn tài chính chính thức.`;

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const line = `data: ${JSON.stringify({ delta: { text: event.delta.text } })}\n\n`;
            controller.enqueue(encoder.encode(line));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[/api/chat]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
