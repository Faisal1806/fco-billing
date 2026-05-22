
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PortalHomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/portal/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="ml-4">Loading Customer Portal...</p>
    </div>
  );
}

