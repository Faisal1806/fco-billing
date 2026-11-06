'use client';

import { useEffect, useState } from 'react';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import type { SyncStatus } from '@/lib/shared-storage';

export function SyncStatusBadge() {
  const [status, setStatus] = useState<SyncStatus>('online');

  useEffect(() => {
    const handleStatus = (event: Event) => {
      const nextStatus = (event as CustomEvent<SyncStatus>).detail;
      if (nextStatus === 'online' || nextStatus === 'syncing' || nextStatus === 'offline') {
        setStatus(nextStatus);
      }
    };

    const updateFromNavigator = () => {
      setStatus(typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline');
    };

    updateFromNavigator();
    window.addEventListener('fco-sync-status', handleStatus);
    window.addEventListener('online', updateFromNavigator);
    window.addEventListener('offline', updateFromNavigator);

    return () => {
      window.removeEventListener('fco-sync-status', handleStatus);
      window.removeEventListener('online', updateFromNavigator);
      window.removeEventListener('offline', updateFromNavigator);
    };
  }, []);

  const config = {
    online: {
      title: 'Cloud sync live',
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
      icon: Cloud,
    },
    syncing: {
      title: 'Syncing with cloud',
      className: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
      icon: Loader2,
    },
    offline: {
      title: 'Offline mode',
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
      icon: CloudOff,
    },
  }[status];

  const Icon = config.icon;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-lg backdrop-blur-md ${config.className}`}
        title={config.title}
      >
        <Icon className={`h-3.5 w-3.5 ${status === 'syncing' ? 'animate-spin' : ''}`} />
        <span>{status === 'syncing' ? 'Syncing' : status === 'offline' ? 'Offline' : 'Live'}</span>
      </div>
    </div>
  );
}
