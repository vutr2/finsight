'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMarket } from '@/hooks/useStockData';

function pct(open, price) {
  if (!open || !price) return null;
  return ((price - open) / open) * 100;
}

const EXCHANGES = ['Tất cả', 'HOSE', 'HNX', 'UPCOM'];

export default function StockListPage() {
  const router = useRouter();
  const { data, loading } = useMarket(30000);

  const [search, setSearch] = useState('');
  const [exchange, setExchange] = useState('Tất cả');
  const [sortBy, setSortBy] = useState('volume'); // volume | change | price
  const [sortDir, setSortDir] = useState(-1); // -1 desc, 1 asc

  const rows = useMemo(() => {
    let list = data.map((d) => ({ ...d, change: pct(d.open, d.price) }));

    if (search.trim()) {
      const q = search.trim().toUpperCase();
      list = list.filter((d) => d.symbol?.toUpperCase().includes(q));
    }

    if (exchange !== 'Tất cả') {
      list = list.filter((d) => d.exchange === exchange);
    }

    list.sort((a, b) => {
      const av = a[sortBy] ?? -Infinity;
      const bv = b[sortBy] ?? -Infinity;
      return (bv - av) * sortDir * -1;
    });

    return list;
  }, [data, search, exchange, sortBy, sortDir]);

  function handleSort(col) {
    if (sortBy === col) {
      setSortDir((d) => d * -1);
    } else {
      setSortBy(col);
      setSortDir(-1);
    }
  }

  function SortIcon({ col }) {
    if (sortBy !== col) return <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>↕</span>;
    return <span style={{ color: 'var(--gold)', marginLeft: '4px' }}>{sortDir === -1 ? '↓' : '↑'}</span>;
  }

  const fmt = (n) => (n != null ? n.toLocaleString('vi-VN') : '—');
  const fmtVol = (n) => {
    if (n == null) return '—';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return String(n);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>

      {/* Page header */}
      <div>
        <h1 className="font-display" style={{ fontSize: '22px', marginBottom: '4px' }}>Danh sách cổ phiếu</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {loading ? 'Đang tải...' : `${rows.length} cổ phiếu · HOSE, HNX, UPCOM`}
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Tìm mã cổ phiếu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            padding: '8px 14px',
            width: '200px',
            outline: 'none',
            fontFamily: 'var(--font-mono)',
          }}
        />

        {/* Exchange tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-sm)', padding: '4px' }}>
          {EXCHANGES.map((ex) => (
            <button
              key={ex}
              onClick={() => setExchange(ex)}
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                background: exchange === ex ? 'var(--gold-dim)' : 'transparent',
                color: exchange === ex ? 'var(--gold-light)' : 'var(--text-muted)',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--bg-border)' }}>
              {[
                { key: null, label: 'Mã', align: 'left' },
                { key: 'price', label: 'Giá', align: 'right' },
                { key: 'change', label: 'Thay đổi', align: 'right' },
                { key: 'volume', label: 'Khối lượng', align: 'right' },
                { key: null, label: 'Sàn', align: 'right' },
              ].map(({ key, label, align }) => (
                <th
                  key={label}
                  onClick={key ? () => handleSort(key) : undefined}
                  style={{
                    padding: '10px 20px',
                    textAlign: align,
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: key ? 'pointer' : 'default',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                  {key && <SortIcon col={key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              Array.from({ length: 12 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  {[1, 2, 3, 4, 5].map((c) => (
                    <td key={c} style={{ padding: '13px 20px' }}>
                      <div style={{ height: '12px', background: 'var(--bg-elevated)', borderRadius: '4px', width: c === 1 ? '60px' : '80px' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Không tìm thấy cổ phiếu
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const change = row.change;
                const isUp = change > 0;
                const isDown = change < 0;
                const color =
                  change === null
                    ? 'var(--text-muted)'
                    : isUp
                    ? 'var(--bull)'
                    : isDown
                    ? 'var(--bear)'
                    : 'var(--neutral)';

                return (
                  <tr
                    key={row.symbol + i}
                    onClick={() => router.push(`/dashboard/stock/${row.symbol}`)}
                    style={{
                      borderBottom: '1px solid var(--bg-border)',
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 700 }}>
                      {row.symbol}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: '13px', fontFamily: 'var(--font-mono)', color }}>
                      {fmt(row.price)}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                      {change !== null ? (
                        <span
                          className="font-mono"
                          style={{
                            fontSize: '12px',
                            color,
                            background: isUp ? 'var(--bull-dim)' : isDown ? 'var(--bear-dim)' : 'transparent',
                            padding: '2px 7px',
                            borderRadius: '4px',
                          }}
                        >
                          {isUp ? '+' : ''}{change.toFixed(2)}%
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {fmtVol(row.volume)}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {row.exchange ?? '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
