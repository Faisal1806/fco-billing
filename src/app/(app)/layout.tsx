'use client';

import { usePathname } from 'next/navigation';
import { AppMenubar } from "@/components/Sidebar";
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import FloatingActionButton from '@/components/FloatingActionButton';

const BackgroundMesh = () => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020205]">
        {/* Animated Mesh Gradients */}
        <motion.div 
            animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
                x: [-100, 100, -100],
                y: [-50, 50, -50]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-accent/10 blur-[120px]" 
        />
        <motion.div 
            animate={{ 
                scale: [1.2, 1, 1.2],
                rotate: [90, 0, 90],
                x: [100, -100, 100],
                y: [50, -50, 50]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-primary/5 blur-[100px]" 
        />
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[url('/assets/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] opacity-20" />
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
);

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background">
      <BackgroundMesh />

      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <AppMenubar />
        
        <main className="flex-1 w-full max-w-[1800px] mx-auto px-4 sm:px-6 md:px-10 py-10 md:py-16">
            <AnimatePresence mode="wait">
                <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 30, filter: "blur(15px)", scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                    exit={{ opacity: 0, y: -30, filter: "blur(15px)", scale: 0.98 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="min-h-full"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </main>

        <FloatingActionButton />
      </div>

      {/* Global Scroll Padding */}
      <div className="h-32" /> 
    </div>
  );
}