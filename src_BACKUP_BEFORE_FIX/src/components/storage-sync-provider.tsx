'use client';

import { useEffect } from 'react';
import { ensureSharedStorageHydrated, initializeSharedStorage } from '@/lib/shared-storage';

export function StorageSyncProvider() {
  useEffect(() => {
    try {
      initializeSharedStorage();
      void ensureSharedStorageHydrated();
    } catch (error) {
      console.error('Storage sync initialization failed:', error);
    }
  }, []);

  return null;
}

