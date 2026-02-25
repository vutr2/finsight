import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Bạn là chuyên gia phân tích thị trường chứng khoán Việt Nam.
Với mỗi bài báo, hãy phân tích và trả về JSON với định dạng sau (KHÔNG giải thích thêm, CHỈ trả về JSON array):

[
  {
    "sentiment": "positive" | "negative" | "neutral",
    "impact": "high" | "medium" | "low",
    "stocks": ["VNM", "HPG"],
    "reason": "Một câu giải thích ngắn bằng tiếng Việt tại sao tin này ảnh hưởng tích cực/tiêu cực/trung tính đến thị trường"
  }
]

Quy tắc:
- sentiment: positive nếu tin tốt cho thị trường/cổ phiếu, negative nếu tin xấu, neutral nếu không ảnh hưởng rõ
- impact: high nếu ảnh hưởng lớn (chính sách vĩ mô, kết quả kinh doanh lớn), medium nếu ảnh hưởng vừa, low nếu ảnh hưởng nhỏ
- stocks: mã cổ phiếu Việt Nam liên quan (3 chữ cái viết hoa như VNM, HPG, VIC, FPT...), để rỗng nếu không có
- reason: tối đa 120 ký tự
- Trả về đúng số phần tử tương ứng với số bài báo đầu vào`;

export async function POST(request) {
  try {
    const { articles } = await request.json();

    if (!Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({ error: 'articles array required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
    }

    // Batch in groups of 10 to keep prompts manageable
    const batch = articles.slice(0, 10);

    const userContent = batch
      .map((a, i) => `[${i + 1}] Tiêu đề: ${a.title}\nMô tả: ${a.description || ''}`)
      .join('\n\n');

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const raw = message.content[0]?.text ?? '[]';

    // Extract JSON array from response
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ data: batch.map(() => defaultResult()) });
    }

    const results = JSON.parse(jsonMatch[0]);

    // Ensure we have a result per article
    const data = batch.map((_, i) => results[i] ?? defaultResult());

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[/api/news/analyze]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function defaultResult() {
  return { sentiment: 'neutral', impact: 'low', stocks: [], reason: '' };
}
