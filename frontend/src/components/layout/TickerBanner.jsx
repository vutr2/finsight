'use client';

import { useMarket } from '@/hooks/useStockData';

function pct(open, close) {
  if (!open) return 0;
  return ((close - open) / open) * 100;
}

export default function TickerBanner() {
  const { data } = useMarket(30000);

  // Show top 30 by volume in ticker; fallback to placeholder if no data yet
  const items = data.length
    ? [...data].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)).slice(0, 30)
    : [];
  // duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div
      style={{
        overflow: 'hidden',
        borderBottom: '1px solid var(--bg-border)',
        background: 'var(--bg-surface)',
        height: '34px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div className="ticker-track" style={{ gap: '0' }}>
        {doubled.map((item, i) => {
          const change = item.open ? pct(item.open, item.price) : null;
          const color =
            change === null
              ? 'var(--text-muted)'
              : change > 0
              ? 'var(--bull)'
              : change < 0
              ? 'var(--bear)'
              : 'var(--neutral)';

          return (
            <span
              key={i}
              className="font-mono"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 20px',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                borderRight: '1px solid var(--bg-border)',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>{item.symbol}</span>
              <span style={{ color }}>
                {item.price != null
                  ? item.price.toLocaleString('vi-VN')
                  : '—'}
              </span>
              {change !== null && (
                <span style={{ color, fontSize: '10px' }}>
                  {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
