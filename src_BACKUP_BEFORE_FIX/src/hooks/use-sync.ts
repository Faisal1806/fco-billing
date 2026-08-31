'use client';
import { useEffect, useState } from 'react';

export function useMongoSync() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkSync = () => {
      const keys = Object.keys(localStorage);
      const hasData = keys.some(k => 
        k.startsWith('invoice-') || 
        k.startsWith('purchase-') || 
        k.startsWith('receipt-')
      );
      if (hasData) {
        setReady(true);
      } else {
        // Wait for sync
        const handler = () => setReady(true);
        window.addEventListener('mongodb-synced', handler);
        return () => window.removeEventListener('mongodb-synced', handler);
      }
    };
    checkSync();
  }, []);

  return ready;
}

