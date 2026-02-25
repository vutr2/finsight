'use client';

import { Descope } from '@descope/nextjs-sdk';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Finsight</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <Descope
            flowId="sign-up-or-in-passwords-or-social"
            onSuccess={() => router.push('/dashboard')}
            onError={(err) => console.error('Descope login error:', err)}
          />
        </div>
      </div>
    </div>
  );
}
