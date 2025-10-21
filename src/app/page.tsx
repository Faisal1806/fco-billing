
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Lottie from 'lottie-react';

export default function HomePage() {
  const router = useRouter();
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('/animations/splash/fco_splash_dark.json')
      .then(res => res.json())
      .then(data => {
        setAnimationData(data);
        setTimeout(() => {
            router.replace('/dashboard');
        }, 3200); // Corresponds to animation length
      })
      .catch(err => {
        console.error("Failed to load splash animation, redirecting...", err);
        router.replace('/dashboard');
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {animationData ? (
        <Lottie 
            animationData={animationData} 
            loop={false}
            style={{ width: 400, height: 400 }}
        />
      ) : (
        <>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4">Loading Application...</p>
        </>
      )}
    </div>
  );
}

    