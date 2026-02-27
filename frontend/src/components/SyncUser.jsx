'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@descope/nextjs-sdk/client';

// Silently syncs the logged-in user into Supabase on first mount.
export default function SyncUser() {
  const { user, isUserLoading } = useUser();
  const synced = useRef(false);

  useEffect(() => {
    if (isUserLoading || !user || synced.current) return;
    synced.current = true;

    fetch('/api/user/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descopeId: user.userId,
        email: user.email,
        name: user.name,
      }),
    }).catch((e) => console.warn('[SyncUser] failed:', e));
  }, [user, isUserLoading]);

  return null;
}
