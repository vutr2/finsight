'use client';

import { use, useState } from 'react';
import { useHistory, useMarket } from '@/hooks/useStockData';
import { usePortfolio } from '@/hooks/usePortfolio';
import TradeModal from '@/components/portfolio/TradeModal';
import dynamic from 'next/dynamic';

const CandlestickChart = dynamic(() => import('@/components/charts/CandlestickChart'), { ssr: false });

export default function StockPage({ params }) {
  const { symbol } = use(params);
  const sym = symbol.toUpperCase();

  const [modal, setModal] = useState(null);
  const { cash, trading, buy, sell, getHolding } = usePortfolio();
  const holding = getHolding(sym);
  const { data: history } = useHistory(sym, 1);
  const { data: market } = useMarket(30000);

  const quote = market.find((s) => s.symbol === sym) ?? null;

  const price = quote?.price ?? history.at(-1)?.close ?? null;
  const open  = quote?.open  ?? history.at(-1)?.open  ?? null;

  const change = open && price ? ((price - open) / open) * 100 : null;
  const isUp = change > 0;
  const changeColor =
    change === null ? 'var(--text-muted)'
    : isUp          ? 'var(--bull)'
    : change < 0    ? 'var(--bear)'
    : 'var(--neutral)';

  const fmt = (n) => (n != null ? n.toLocaleString('vi-VN') : '—');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '28px', letterSpacing: '-0.01em' }}>{sym}</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {quote?.exchange ?? 'HOSE'} · Cập nhật mỗi 30s
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span className="font-mono" style={{ fontSize: '32px', fontWeight: 700, color: changeColor }}>
            {fmt(price)}
          </span>
          {change !== null && (
            <span className="font-mono" style={{
              fontSize: '14px', color: changeColor,
              background: isUp ? 'var(--bull-dim)' : 'var(--bear-dim)',
              padding: '4px 10px', borderRadius: '6px',
            }}>
              {isUp ? '+' : ''}{change.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {/* Chart — stats grid is built into the chart component */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <CandlestickChart symbol={sym} height={320} quote={quote} />
      </div>

      {/* Trade buttons */}
      <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Giao dịch Demo</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {holding
              ? `Đang nắm giữ: ${holding.quantity.toLocaleString('vi-VN')} cp · vốn TB ${fmt(holding.avgCost)} đ`
              : 'Chưa có trong danh mục'}
          </p>
        </div>
        <button onClick={() => setModal('buy')} style={{
          padding: '10px 28px', borderRadius: 'var(--radius-sm)', border: 'none',
          background: 'var(--bull)', color: '#fff',
          fontSize: '13px', fontWeight: 700, cursor: 'pointer',
        }}>
          MUA
        </button>
        <button onClick={() => holding && setModal('sell')} disabled={!holding} style={{
          padding: '10px 28px', borderRadius: 'var(--radius-sm)', border: 'none',
          background: holding ? 'var(--bear)' : 'var(--bg-elevated)',
          color: holding ? '#fff' : 'var(--text-muted)',
          fontSize: '13px', fontWeight: 700, cursor: holding ? 'pointer' : 'not-allowed',
        }}>
          BÁN
        </button>
      </div>

      {/* Trade modal */}
      {modal && (
        <TradeModal
          symbol={sym}
          type={modal}
          currentPrice={price}
          cash={cash}
          holding={holding}
          quote={quote}
          trading={trading}
          onClose={() => setModal(null)}
          onConfirm={async (type, symbol, quantity, currentPrice) => {
            const result = type === 'buy'
              ? await buy(symbol, quantity, currentPrice)
              : await sell(symbol, quantity, currentPrice);
            if (result?.ok) setModal(null);
            return result;
          }}
        />
      )}
    </div>
  );
}
