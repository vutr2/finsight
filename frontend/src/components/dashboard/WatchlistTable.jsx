'use client';

import { useRouter } from 'next/navigation';
import { useMarket } from '@/hooks/useStockData';

function pct(open, close) {
  if (!open || !close) return null;
  return ((close - open) / open) * 100;
}

export default function WatchlistTable() {
  const router = useRouter();
  const { data, loading } = useMarket(30000);

  // Top 50 by volume when market data is available, else empty skeleton
  const rows = data.length
    ? [...data].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)).slice(0, 50)
    : loading
    ? Array.from({ length: 10 }, (_, i) => ({ symbol: '—', price: null, open: null, volume: null, _key: i }))
    : [];

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '14px', fontWeight: 600 }}>Danh sách theo dõi</p>
        <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Cập nhật mỗi 30s
        </span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--bg-border)' }}>
            {['Mã', 'Giá', 'Thay đổi', 'Khối lượng'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '10px 20px',
                  textAlign: h === 'Mã' ? 'left' : 'right',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const change = pct(row.open, row.price);
            const isUp = change > 0;
            const isDown = change < 0;
            const color = change === null ? 'var(--text-muted)' : isUp ? 'var(--bull)' : isDown ? 'var(--bear)' : 'var(--neutral)';

            return (
              <tr
                key={row.symbol + i}
                onClick={() => router.push(`/dashboard/stock/${row.symbol}`)}
                style={{ borderBottom: '1px solid var(--bg-border)', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 600 }}>
                  {row.symbol}
                </td>
                <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                  {row.price != null ? row.price.toLocaleString('vi-VN') : '—'}
                </td>
                <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                  {change !== null ? (
                    <span className="font-mono" style={{ fontSize: '12px', color, background: isUp ? 'var(--bull-dim)' : isDown ? 'var(--bear-dim)' : 'transparent', padding: '2px 7px', borderRadius: '4px' }}>
                      {isUp ? '+' : ''}{change.toFixed(2)}%
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {row.volume != null ? (row.volume / 1000).toFixed(0) + 'K' : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
