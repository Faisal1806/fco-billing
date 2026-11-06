'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  ensureSharedStorageHydrated,
  initializeSharedStorage
} from '@/lib/shared-storage';

export function StorageSyncProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/login' || pathname.startsWith('/portal')) {
      return;
    }

    try {
      initializeSharedStorage();
      void ensureSharedStorageHydrated();
    } catch (error) {
      console.error('Storage sync initialization failed:', error);
    }
  }, [pathname]);

  return null;
}
