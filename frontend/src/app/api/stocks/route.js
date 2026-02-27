import { NextResponse } from 'next/server';
import { getOHLC, getLatestPrice, getMarketPrices, getHistory } from '@/lib/stocks/vnstock';

// Never cache this route — each request must fetch fresh data
export const dynamic = 'force-dynamic';

// GET /api/stocks?type=market              → full market (VPS, trading hours) or fallback
// GET /api/stocks?type=prices&symbols=...  → specific symbols
// GET /api/stocks?type=quote&symbol=VNM    → single symbol
// GET /api/stocks?type=ohlc&symbol=VNM     → OHLC snapshot
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'market';

  try {
    if (type === 'market') {
      const data = await getMarketPrices(null);
      return NextResponse.json({ data });
    }

    if (type === 'prices') {
      const symbols = (searchParams.get('symbols') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const data = await getMarketPrices(symbols.length ? symbols : null);
      return NextResponse.json({ data });
    }

    const symbol = searchParams.get('symbol');
    if (!symbol) {
      return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
    }

    if (type === 'quote') {
      const data = await getLatestPrice(symbol);
      return NextResponse.json({ data });
    }

    if (type === 'history') {
      const days = parseInt(searchParams.get('days') ?? '365', 10);
      const data = await getHistory(symbol, days);
      return NextResponse.json({ data });
    }

    // ohlc
    const data = await getOHLC(symbol);
    return NextResponse.json({ data });
  } catch (err) {
    console.error('[/api/stocks]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
