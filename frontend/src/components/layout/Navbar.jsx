'use client';

import { useDescope, useUser } from '@descope/nextjs-sdk/client';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { logout } = useDescope();
  const { user } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header
      style={{
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: '1px solid var(--bg-border)',
        background: 'var(--bg-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <p
        className="font-mono"
        style={{ fontSize: '12px', color: 'var(--text-muted)' }}
      >
        HOSE · HNX · UPCOM
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user?.name && (
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {user.name}
          </span>
        )}
        <button
          onClick={handleLogout}
          style={{
            fontSize: '12px',
            padding: '5px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--bg-border)',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bear)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
