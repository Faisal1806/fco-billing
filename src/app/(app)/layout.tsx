'use client';

import { usePathname } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('/animations/extras/fco_particle_glow.json')
      .then(res => res.json())
      .then(data => setAnimationData(data));
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
        <div className="fixed inset-0 z-0">
             {animationData && <Lottie 
                animationData={animationData}
                loop={true}
                className="absolute inset-0 w-full h-full object-cover"
             />}
             <div className="absolute inset-0 bg-background/90"></div>
        </div>
      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <Sidebar />
        <div className="flex flex-col md:pl-[220px] lg:pl-[280px]">
          <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:p-8 lg:p-10 pt-4 md:pt-10">
             <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl"
             >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
