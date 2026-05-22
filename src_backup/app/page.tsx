'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/logo';
import { Progress } from '@/components/ui/progress';

export default function SplashScreen() {
  const router = useRouter();
  const [progress, setUploadProgress] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    // Simulate loading progress
    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    // Redirect after 2.5 seconds to allow for smooth completion
    const redirectTimer = setTimeout(() => {
      setIsFinishing(true);
      setTimeout(() => {
        router.replace('/login');
      }, 800);
    }, 2500);

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <AnimatePresence>
      {!isFinishing && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(20px)", scale: 1.1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020205] overflow-hidden"
        >
          {/* Kinetic Background Mesh */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-accent/10 blur-[120px]" 
            />
            <motion.div 
              animate={{ 
                scale: [1.2, 1, 1.2],
                rotate: [0, -90, 0],
                opacity: [0.15, 0.3, 0.15]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full bg-blue-500/10 blur-[120px]" 
            />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
          </div>

          <div className="relative z-10 flex flex-col items-center max-w-xs w-full px-6">
            {/* 3D Floating Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                y: [0, -15, 0],
                rotateZ: [0, 5, -5, 0]
              }}
              transition={{ 
                opacity: { duration: 1 },
                scale: { duration: 1 },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                rotateZ: { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }}
              className="mb-12 relative"
            >
              <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full scale-150 opacity-50" />
              <Logo className="h-32 w-32 text-white relative z-10 drop-shadow-[0_0_30px_rgba(34,197,94,0.4)]" />
            </motion.div>

            {/* Title & Slogan */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-center mb-10"
            >
              <h1 className="text-white text-3xl font-black tracking-[0.2em] uppercase">
                F.Co <span className="text-accent">OS</span>
              </h1>
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.5em] mt-3 opacity-50">
                Initializing Terminal Node
              </p>
            </motion.div>

            {/* Loading Infrastructure */}
            <div className="w-full space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-[8px] font-black text-accent uppercase tracking-widest animate-pulse">
                  {progress < 100 ? 'Authenticating...' : 'Ready'}
                </span>
                <span className="text-[8px] font-black text-muted-foreground font-mono">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-accent"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear" }}
                />
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-white/40 blur-sm"
                  animate={{ 
                    x: ["-100%", "200%"],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  style={{ width: "30%" }}
                />
              </div>
            </div>
          </div>

          {/* Footer Metadata */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-12 flex flex-col items-center gap-4"
          >
            <div className="h-8 w-[1px] bg-gradient-to-b from-white to-transparent" />
            <p className="text-[7px] font-black uppercase tracking-[0.6em] text-white">
              Sopore Mandi Protocol v4.0
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
