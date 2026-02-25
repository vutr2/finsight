'use client';

import { useRouter } from 'next/navigation';
import { useMarket } from '@/hooks/useStockData';

function pct(open, close) {
  if (!open || !close) return null;
  return ((close - open) / open) * 100;
}

function MoverRow({ symbol, price, change, router }) {
  const isUp = change > 0;
  const color = isUp ? 'var(--bull)' : 'var(--bear)';
  const bg = isUp ? 'var(--bull-dim)' : 'var(--bear-dim)';

  return (
    <div
      onClick={() => router.push(`/dashboard/stock/${symbol}`)}
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'background 0.15s' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div>
        <p style={{ fontSize: '13px', fontWeight: 600 }}>{symbol}</p>
        <p className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {price?.toLocaleString('vi-VN') ?? '—'}
        </p>
      </div>
      <span className="font-mono" style={{ fontSize: '12px', color, background: bg, padding: '3px 8px', borderRadius: '4px' }}>
        {isUp ? '+' : ''}{change.toFixed(2)}%
      </span>
    </div>
  );
}

export default function TopMovers() {
  const router = useRouter();
  const { data } = useMarket(30000);

  const withChange = data
    .map((d) => ({ ...d, change: pct(d.open, d.price) }))
    .filter((d) => d.change !== null)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  const gainers = withChange.filter((d) => d.change > 0).slice(0, 5);
  const losers = withChange.filter((d) => d.change < 0).slice(0, 5);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      {/* Gainers */}
      <div className="card">
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bg-border)' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--bull)' }}>▲ Tăng mạnh</p>
        </div>
        <div style={{ padding: '8px 0' }}>
          {gainers.length ? gainers.map((d) => (
            <MoverRow key={d.symbol} {...d} router={router} />
          )) : (
            <p style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>Đang tải...</p>
          )}
        </div>
      </div>

      {/* Losers */}
      <div className="card">
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bg-border)' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--bear)' }}>▼ Giảm mạnh</p>
        </div>
        <div style={{ padding: '8px 0' }}>
          {losers.length ? losers.map((d) => (
            <MoverRow key={d.symbol} {...d} router={router} />
          )) : (
            <p style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>Đang tải...</p>
          )}
        </div>
      </div>
    </div>
  );
}
