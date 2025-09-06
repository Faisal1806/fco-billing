
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, Settings, Receipt, BookUser, Truck, BookCopy, ScrollText, Tags, FlaskConical, Shapes, Globe, Banknote, Snowflake } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header';
import React from 'react';
import { Logo } from '@/components/logo';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole'));
    }
  }, []);

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard'), role: ['admin', 'staff'] },
    { href: '/sales', icon: ShoppingCart, label: t('sales'), role: ['admin', 'staff'] },
    { href: '/purchases', icon: Truck, label: 'Purchases', role: ['admin', 'staff'] },
    { href: '/purchase-register', icon: ScrollText, label: 'Purchase Register', role: ['admin', 'staff'] },
    { href: '/outside-sales', icon: Globe, label: 'Outside Sales', role: ['admin', 'staff'] },
    { href: '/products', icon: Package, label: t('products'), role: ['admin'] },
    { href: '/expenses', icon: Receipt, label: 'Expenses', role: ['admin'] },
    { href: '/advances', icon: Banknote, label: 'Advances', role: ['admin'] },
    { href: '/cold-storage', icon: Snowflake, label: 'Cold Storage', role: ['admin'] },
    { href: '/watak-register', icon: BookUser, label: t('watak_register'), role: ['admin', 'staff'] },
    { href: '/khata', icon: BookCopy, label: 'Khata Ledger', role: ['admin', 'staff'] },
    { href: '/rates', icon: Tags, label: 'Fruit Rates', role: ['admin', 'staff'] },
    { href: '/fertilizers', icon: FlaskConical, label: 'Fertilizers & Pesticides', role: ['admin', 'staff'] },
    { href: '/accessories', icon: Shapes, label: 'Accessories', role: ['admin', 'staff'] },
    { href: '/settings', icon: Settings, label: t('settings'), role: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => userRole && item.role.includes(userRole));

  const getPageTitle = () => {
    const item = navItems.find(item => pathname.startsWith(item.href));
    // A simple way to derive title for sub-pages like /invoice/[id]
    if (pathname.startsWith('/invoice/')) return 'Invoice';
    if (pathname.startsWith('/purchase-bill/')) return 'Purchase Bill';
    if (pathname.startsWith('/receipt/')) return 'Receipt';
    if (pathname.startsWith('/challan/')) return 'Challan';
    if (pathname.startsWith('/pesticide-invoice/')) return 'Pesticide Bill';
    return item ? item.label : 'SwiftSale';
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
              <Logo className="h-8 w-8" />
              <span className="">{t('app_title')}</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                    pathname.startsWith(item.href) && 'bg-primary text-primary-foreground hover:text-primary-foreground'
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
        <main className="flex-1 bg-background p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
