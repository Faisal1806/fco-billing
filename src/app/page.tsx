
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Logo className="h-32 w-32 mb-8" />
        <div className="flex items-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="ml-4 text-xl text-muted-foreground">Loading Your Business...</p>
        </div>
    </div>
  );
}
