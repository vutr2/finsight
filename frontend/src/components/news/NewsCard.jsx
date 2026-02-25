'use client';

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export default function NewsCard({ article }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          transition: 'background 0.15s',
          cursor: 'pointer',
          borderLeft: '3px solid var(--bg-border)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
      >
        {/* Meta: source + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
            {article.source}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--bg-border)' }}>·</span>
          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {timeAgo(article.publishedAt)}
          </span>
        </div>

        {/* Title */}
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.45, margin: 0 }}>
          {article.title}
        </p>

        {/* Description */}
        {article.description && (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {article.description}
          </p>
        )}
      </div>
    </a>
  );
}
