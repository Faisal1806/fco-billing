'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 3000); // 3 second delay before redirecting

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <Logo className="h-32 w-32" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
        className="text-xl md:text-2xl font-semibold italic mt-4 text-center"
      >
        "Your Satisfaction is Our Success"
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2, ease: 'easeOut' }}
        className="mt-12 flex flex-col items-center gap-4"
      >
        <div className="flex items-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="ml-3 text-lg">Welcome to F.Co Billing System</p>
        </div>
      </motion.div>
    </div>
  );
}
