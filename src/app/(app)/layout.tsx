
'use client';

import { usePathname } from 'next/navigation';
import Header from "@/components/Header";
import Sidebar, { sidebarSections } from "@/components/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const currentPage = sidebarSections
    .flatMap(section => section.items)
    .find(item => item.href === pathname);

  const title = currentPage ? currentPage.name : 'Dashboard';

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <Header title={title} />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
