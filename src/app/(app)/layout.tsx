
'use client';

import { usePathname } from 'next/navigation';
import Header from "@/components/Header";
import Sidebar, { sidebarSections } from "@/components/Sidebar";
import { motion } from 'framer-motion';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const allItems = sidebarSections.flatMap(section => section.items);
  const currentPage = allItems.find(item => pathname.startsWith(item.href));

  const title = currentPage ? currentPage.name : 'Dashboard';

  return (
    <div className="relative min-h-screen w-full">
      <div className="animated-background"></div>
      <div className="relative z-10">
        <Sidebar />
        <div className="flex flex-col md:pl-[220px] lg:pl-[280px]">
          <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:p-8 lg:p-10">
             <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="bg-card/80 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl"
             >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
