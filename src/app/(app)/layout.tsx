'use client';

import { usePathname } from 'next/navigation';
import { AppMenubar } from "@/components/Sidebar";
import { motion, AnimatePresence } from 'framer-motion';
import FloatingActionButton from '@/components/FloatingActionButton';

const BackgroundMesh = () => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020205]">
        {/* Animated Master Mesh Gradients */}
        <motion.div 
            animate={{ 
                scale: [1, 1.3, 1],
                rotate: [0, 180, 0],
                x: [-200, 200, -200],
                y: [-100, 100, -100]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-30%] left-[-20%] w-[100%] h-[100%] rounded-full bg-accent/15 blur-[150px]" 
        />
        <motion.div 
            animate={{ 
                scale: [1.3, 1, 1.3],
                rotate: [180, 0, 180],
                x: [200, -200, 200],
                y: [100, -100, 100]
            }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-30%] right-[-20%] w-[90%] h-[90%] rounded-full bg-primary/10 blur-[130px]" 
        />
        
        {/* Dynamic Static Noise Overlay */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        {/* Spatial Grid Overlay */}
        <div className="absolute inset-0 bg-[url('/assets/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,transparent_10%,black)] opacity-30" />
        
        {/* Vignette Depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
    </div>
);

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#020205]">
      <BackgroundMesh />

      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <AppMenubar />
        
        <main className="flex-1 w-full max-w-[1900px] mx-auto px-6 sm:px-10 md:px-16 py-12 md:py-20">
            <AnimatePresence mode="wait">
                <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 40, filter: "blur(20px)", scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                    exit={{ opacity: 0, y: -40, filter: "blur(20px)", scale: 0.96 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="min-h-full"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </main>

        <FloatingActionButton />
      </div>

      {/* Global Kinetic Spacer */}
      <div className="h-40" /> 
    </div>
  );
}

