
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is deprecated and now redirects to the new Khata Ledger page.
export default function StatementRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/khata');
  }, [router]);

  return null;
}
