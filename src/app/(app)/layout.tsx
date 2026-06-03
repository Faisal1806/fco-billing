'use client';
import { usePathname } from 'next/navigation';
import { AppMenubar } from "@/components/Sidebar";
import { motion, AnimatePresence } from 'framer-motion';
import FloatingActionButton from '@/components/FloatingActionButton';
import { useEffect, useState, createContext, useContext } from 'react';

export const SyncContext = createContext<boolean>(false);
export const useSynced = () => useContext(SyncContext);

const BackgroundMesh = () => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020205]">
        <motion.div 
            animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 0], x: [-200, 200, -200], y: [-100, 100, -100] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-30%] left-[-20%] w-[100%] h-[100%] rounded-full bg-accent/15 blur-[150px]" 
        />
        <motion.div 
            animate={{ scale: [1.3, 1, 1.3], rotate: [180, 0, 180], x: [200, -200, 200], y: [100, -100, 100] }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-30%] right-[-20%] w-[90%] h-[90%] rounded-full bg-primary/10 blur-[130px]" 
        />
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="absolute inset-0 bg-[url('/assets/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,transparent_10%,black)] opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
    </div>
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [synced, setSynced] = useState(false);
const [syncKey, setSyncKey] = useState(0);

  useEffect(() => {
    const syncFromMongoDB = async () => {
      try {
        const res = await fetch('/api/documents');
        const result = await res.json();
        if (result.success && result.data) {
          const userRole = localStorage.getItem('userRole');
          result.data.forEach((item: Record<string, unknown>) => {
            const key = item.key as string;
            if (key) {
              const { key: _, ...value } = item;
              localStorage.setItem(key, JSON.stringify(value));
            }
          });
          if (userRole) localStorage.setItem('userRole', userRole);
          console.log(`Synced ${result.data.length} records`);
          // Dispatch event so all pages know sync is done
          window.dispatchEvent(new CustomEvent('mongodb-synced'));
setSyncKey(prev => prev + 1);
        }
      } catch (error) {
        console.error('MongoDB sync failed:', error);
      } finally {
        // Small delay to ensure localStorage writes complete
        setTimeout(() => setSynced(true), 500);
      }
    };
    syncFromMongoDB();
  }, []);

  if (!synced) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020205]">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-sm opacity-60">Syncing data...</p>
        </div>
      </div>
    );
  }

  return (
    <SyncContext.Provider value={synced}>
      <div className="relative min-h-screen w-full overflow-x-hidden bg-[#020205]">
        <BackgroundMesh />
        <div className="relative z-10 flex min-h-screen w-full flex-col">
          <AppMenubar />
          <main className="flex-1 w-full max-w-[1900px] mx-auto px-6 sm:px-10 md:px-16 py-12 md:py-20">
              <AnimatePresence mode="wait">
                  <motion.div key={`${pathname}-${syncKey}`}
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
        <div className="h-40" /> 
      </div>
    </SyncContext.Provider>
  );
}
