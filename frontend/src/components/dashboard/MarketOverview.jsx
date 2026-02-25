'use client';

import { useMultiplePrices } from '@/hooks/useStockData';

const INDICES = ['VNINDEX', 'VN30', 'HNXINDEX'];

function pct(open, close) {
  if (!open || !close) return null;
  return ((close - open) / open) * 100;
}

function StatCard({ symbol, price, open }) {
  const change = pct(open, price);
  const isUp = change > 0;
  const isDown = change < 0;
  const color = isUp ? 'var(--bull)' : isDown ? 'var(--bear)' : 'var(--neutral)';

  return (
    <div
      className="card"
      style={{ padding: '20px 24px', flex: 1, minWidth: '160px' }}
    >
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
        {symbol}
      </p>
      <p className="font-display" style={{ fontSize: '28px', marginBottom: '6px' }}>
        {price != null ? price.toLocaleString('vi-VN') : '—'}
      </p>
      {change !== null ? (
        <p className="font-mono" style={{ fontSize: '13px', color }}>
          {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
        </p>
      ) : (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Đang tải...</p>
      )}
    </div>
  );
}

export default function MarketOverview() {
  const { data } = useMultiplePrices(INDICES, 30000);

  const bySymbol = Object.fromEntries(data.map((d) => [d.symbol, d]));

  return (
    <div>
      <p style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
        Chỉ số thị trường
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {INDICES.map((sym) => {
          const d = bySymbol[sym];
          return (
            <StatCard
              key={sym}
              symbol={sym}
              price={d?.price ?? null}
              open={d?.open ?? null}
            />
          );
        })}
      </div>
    </div>
  );
}
