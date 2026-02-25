'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDescope, useSession } from '@descope/nextjs-sdk/client';

export default function CallbackPage() {
  const router = useRouter();
  const { isAuthenticated, isSessionLoading } = useSession();

  useEffect(() => {
    if (!isSessionLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isSessionLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Signing you in...</p>
    </div>
  );
}
