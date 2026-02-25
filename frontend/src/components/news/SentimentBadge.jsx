'use client';

const SENTIMENT_CONFIG = {
  positive: { label: 'Tích cực', color: 'var(--bull)', bg: 'var(--bull-dim)' },
  negative: { label: 'Tiêu cực', color: 'var(--bear)', bg: 'var(--bear-dim)' },
  neutral: { label: 'Trung tính', color: 'var(--text-muted)', bg: 'rgba(74,85,104,0.15)' },
};

const IMPACT_CONFIG = {
  high: { label: 'Ảnh hưởng cao', color: 'var(--gold)', bg: 'var(--gold-subtle)' },
  medium: { label: 'Ảnh hưởng vừa', color: 'var(--text-secondary)', bg: 'rgba(148,163,184,0.1)' },
  low: { label: 'Ảnh hưởng thấp', color: 'var(--text-muted)', bg: 'transparent' },
};

export function SentimentBadge({ sentiment }) {
  const cfg = SENTIMENT_CONFIG[sentiment] ?? SENTIMENT_CONFIG.neutral;
  return (
    <span
      className="font-mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        padding: '3px 8px',
        borderRadius: '4px',
      }}
    >
      ● {cfg.label}
    </span>
  );
}

export function ImpactBadge({ impact }) {
  const cfg = IMPACT_CONFIG[impact] ?? IMPACT_CONFIG.low;
  return (
    <span
      className="font-mono"
      style={{
        fontSize: '11px',
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        padding: '3px 8px',
        borderRadius: '4px',
      }}
    >
      {cfg.label}
    </span>
  );
}

export function StockPill({ symbol }) {
  return (
    <span
      className="font-mono"
      style={{
        fontSize: '11px',
        fontWeight: 700,
        color: 'var(--gold)',
        background: 'var(--gold-subtle)',
        border: '1px solid var(--gold-dim)',
        padding: '2px 7px',
        borderRadius: '4px',
      }}
    >
      {symbol}
    </span>
  );
}
