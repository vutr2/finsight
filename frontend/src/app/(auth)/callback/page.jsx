'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, useUser } from '@descope/nextjs-sdk/client';

export default function CallbackPage() {
  const router = useRouter();
  const { isAuthenticated, isSessionLoading } = useSession();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (isSessionLoading || isUserLoading) return;

    if (isAuthenticated && user) {
      // Sync user into Supabase via API route, then redirect
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descopeId: user.userId,
          email: user.email,
          name: user.name,
        }),
      }).finally(() => {
        router.replace('/dashboard');
      });
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, isSessionLoading, isUserLoading, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Signing you in...</p>
    </div>
  );
}
