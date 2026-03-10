
'use client';

import { usePathname } from 'next/navigation';
import { AppMenubar } from "@/components/Sidebar";
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';
import FloatingActionButton from '@/components/FloatingActionButton';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('/animations/extras/fco_3d_bg.json')
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(() => console.log("Background animation fallback."));
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background selection:bg-accent selection:text-accent-foreground">
        {/* Animated Cinematic Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
             {animationData && <Lottie 
                animationData={animationData}
                loop={true}
                className="absolute inset-0 w-full h-full object-cover opacity-20"
             />}
             <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/40" />
             {/* Dynamic Accent Glow */}
             <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px]" />
             <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]" />
        </div>

      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <AppMenubar />
        
        <main className="flex-1 w-full max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
            <AnimatePresence mode="wait">
                <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="min-h-full"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </main>

        <FloatingActionButton />
      </div>

      {/* Global Toast Viewport Padding */}
      <div className="h-20" /> 
    </div>
  );
}
