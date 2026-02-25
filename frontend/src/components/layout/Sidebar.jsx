'use client';

import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { icon: '▦', label: 'Tổng quan', href: '/dashboard' },
  { icon: '📈', label: 'Cổ phiếu', href: '/dashboard/stock' },
  { icon: '📰', label: 'Tin tức', href: '/dashboard/news' },
  { icon: '🤖', label: 'AI Chat', href: '/dashboard/ai-chat' },
  { icon: '🎓', label: 'Học đầu tư', href: '/dashboard/learn' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside
      style={{
        width: '220px',
        flexShrink: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--bg-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        gap: '4px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px 20px',
        }}
      >
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--bg-base)',
            flexShrink: 0,
          }}
        >
          F
        </div>
        <span className="font-display" style={{ fontSize: '16px' }}>
          Finsight
        </span>
      </div>

      {/* Nav items */}
      {NAV.map((item) => {
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              background: active ? 'var(--gold-subtle)' : 'transparent',
              color: active ? 'var(--gold)' : 'var(--text-secondary)',
              borderLeft: active
                ? '2px solid var(--gold)'
                : '2px solid transparent',
              transition: 'all 0.15s',
              textAlign: 'left',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.background = 'var(--bg-elevated)';
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: '15px', width: '18px', textAlign: 'center' }}>
              {item.icon}
            </span>
            {item.label}
          </button>
        );
      })}
    </aside>
  );
}
