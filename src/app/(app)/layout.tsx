
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, Settings, Package2, Receipt, BookUser, BarChart3, Factory, Tags, Truck, BookCopy } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/logo';
import { Header } from '@/components/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/sales', icon: ShoppingCart, label: t('sales') },
    { href: '/sales-overview', icon: BarChart3, label: 'Sales Overview' },
    { href: '/purchases', icon: Truck, label: 'Purchases' },
    { href: '/products', icon: Package, label: t('products') },
    { href: '/expenses', icon: Receipt, label: t('expenses') },
    { href: '/watak-register', icon: BookUser, label: t('watak_register') },
    { href: '/khata', icon: BookCopy, label: 'Khata Ledger' },
    { href: '/rates', icon: Tags, label: 'Rates' },
    { href: '/settings', icon: Settings, label: t('settings') },
  ];

  const getPageTitle = () => {
    const item = navItems.find(item => pathname.startsWith(item.href));
    return item ? item.label : 'SwiftSale';
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-background md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
              <Logo className="h-8 w-8" />
              <span className="">{t('app_title')}</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground',
                    pathname.startsWith(item.href) && 'bg-muted text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <Header title={getPageTitle()} />
        <main className="flex-1 p-6 bg-gradient-to-r from-green-100 via-green-200 to-green-300 dark:from-green-900 dark:via-green-800 dark:to-green-700">
          <div className="max-w-7xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
