
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, Settings, Package2, Bell, Search, User, Receipt, BookUser, BarChart3, Factory } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ContextualHelp } from '@/components/contextual-help';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/sales', icon: ShoppingCart, label: t('sales') },
    { href: '/sales-overview', icon: BarChart3, label: 'Sales Overview' },
    { href: '/products', icon: Package, label: t('products') },
    { href: '/expenses', icon: Receipt, label: t('expenses') },
    { href: '/watak-register', icon: BookUser, label: t('watak_register') },
    { href: '/settings', icon: Settings, label: t('settings') },
  ];

  const getPageContext = () => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/sales')) return 'Sales Page';
    if (pathname.startsWith('/sales-overview')) return 'Sales Overview Page';
    if (pathname.startsWith('/products')) return 'Product Catalog';
    if (pathname.startsWith('/expenses')) return 'Expenses Page';
    if (pathname.startsWith('/watak-register')) return 'Watak Register Page';
    if (pathname.startsWith('/settings')) return 'Settings Page';
    return 'General';
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-black md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold text-white">
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
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-400 transition-all hover:text-white',
                    pathname.startsWith(item.href) && 'bg-gray-800 text-white'
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
      <div className="flex flex-col bg-gradient-to-br from-black via-red-900 to-green-800">
        <header className="flex h-14 items-center gap-4 border-b bg-black/50 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-transparent text-white hover:bg-gray-800">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-black text-white border-r-gray-800">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Logo className="h-8 w-8" />
                  <span className="sr-only">{t('app_title')}</span>
                </Link>
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-4 rounded-xl px-3 py-2 text-gray-400 hover:text-white',
                      pathname.startsWith(item.href) && 'bg-gray-800 text-white'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            {/* Can add search here if needed */}
          </div>
          <LanguageSwitcher />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
        <ContextualHelp context={getPageContext()} />
      </div>
    </div>
  );
}
