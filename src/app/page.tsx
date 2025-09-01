
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
    <div className="flex flex-col items-center justify-center min-h-screen">
        <Logo className="h-24 w-24 mb-6" />
        <div className="flex items-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-4 text-lg text-muted-foreground">Loading Your Business...</p>
        </div>
    </div>
  );
}
