'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Lottie from 'lottie-react';

export default function HomePage() {
  const router = useRouter();
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    if (localStorage.getItem('userRole') === 'admin') {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="ml-4">Loading Application...</p>
    </div>
  );
}
