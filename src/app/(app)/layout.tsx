
'use client';

import { usePathname } from 'next/navigation';
import { AppMenubar } from "@/components/Sidebar"; // Renamed for clarity
import { motion } from 'framer-motion';
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
    // This animation file is assumed to be in the public directory.
    // Replaced with the new professional 3D background asset.
    fetch('/animations/extras/fco_3d_bg.json')
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(() => console.log("Background animation not found, using fallback."));
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-black via-gray-900 to-primary/30">
        <div className="fixed inset-0 z-0">
             {animationData && <Lottie 
                animationData={animationData}
                loop={true}
                className="absolute inset-0 w-full h-full object-cover opacity-50"
             />}
             <div className="absolute inset-0 bg-background/90"></div>
        </div>
      <div className="relative z-10 flex min-h-screen w-full flex-col" style={{ perspective: '1200px' }}>
        <AppMenubar />
        <div className="flex flex-col">
          <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:p-8 lg:p-10 pt-4 md:pt-10">
             <motion.div
              key={pathname}
              initial={{ rotateY: 90, opacity: 0, z: -100 }}
              animate={{ rotateY: 0, opacity: 1, z: 0 }}
              exit={{ rotateY: -90, opacity: 0, z: -100 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 100, damping: 20 }}
              className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl"
              style={{ transformStyle: 'preserve-3d' }}
             >
              {children}
            </motion.div>
          </main>
        </div>
        <FloatingActionButton />
      </div>
    </div>
  );
}
