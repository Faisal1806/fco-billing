
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is no longer used directly, but we'll keep it for now.
// It will redirect to the dashboard if accessed.
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return null;
}
