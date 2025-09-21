
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
    LayoutDashboard, ShoppingCart, Package, Settings, Phone, BookCopy, Globe, Receipt,
    Banknote, Snowflake, Tags, FlaskConical, Shapes, History, Hash, Menu, FileText, Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header';
import React from 'react';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/contexts/language-context';
import { ThemeProvider } from '@/components/theme-provider';
import './print.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/portal');
  const isPrintPage = pathname.startsWith('/invoice/') || pathname.startsWith('/purchase-bill/') || pathname.startsWith('/receipt/') || pathname.startsWith('/challan/') || pathname.startsWith('/pesticide-invoice/') || pathname.startsWith('/bikri-bill/');

  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <LanguageProvider>
              {isAuthPage || isPrintPage ? children : <AppLayout>{children}</AppLayout>}
              <Toaster />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      if (!role) {
        router.push('/login');
      } else {
        setUserRole(role);
        setIsLoading(false);
      }
    }
  }, [router, pathname]);
  
  const getPageTitle = () => {
    const item = navItems.find(item => pathname.startsWith(item.href));
    return item ? item.label : 'Dashboard';
  }

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="ml-4">Loading...</p>
        </div>
    );
  }
  
  if (!userRole) return null;

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-background md:block">
        <NavContent isMobile={false} />
      </div>
      <div className="flex flex-col">
        <Header title={getPageTitle()} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
}

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/sales', icon: ShoppingCart, label: 'Sales' },
    { href: '/purchases', icon: Package, label: 'Purchases' },
    { href: '/purchase-register', icon: BookCopy, label: 'Purchase Register' },
    { href: '/outside-sales', icon: Globe, label: 'Outside Sales' },
    { href: '/products', icon: Package, label: 'Products' },
    { href: '/expenses', icon: Receipt, label: 'Expenses' },
    { href: '/advances', icon: Banknote, label: 'Advances' },
    { href: '/cold-storage', icon: Snowflake, label: 'Cold Storage' },
    { href: '/watak-register', icon: BookCopy, label: 'Watak Register' },
    { href: '/khata', icon: BookCopy, label: 'Khata Ledger' },
    { href: '/rates', icon: Tags, label: 'Fruit Rates' },
    { href: '/fertilizers', icon: FlaskConical, label: 'Fertilizers & Pesticides' },
    { href: '/accessories', icon: Shapes, label: 'Accessories' },
    { href: '/activity-log', icon: History, label: 'Activity Log' },
];

const NavLinks = ({ isMobile }: { isMobile: boolean }) => {
  const pathname = usePathname();
  const Wrapper = isMobile ? SheetClose : React.Fragment;

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navItems.map((item) => {
        const link = (
           <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
                pathname.startsWith(item.href) && 'bg-muted text-primary'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
        );
        return isMobile ? <Wrapper asChild key={item.label}>{link}</Wrapper> : <React.Fragment key={item.label}>{link}</React.Fragment>;
      })}
    </nav>
  );
};

const NavContent = ({ isMobile }: { isMobile: boolean }) => {
    const pathname = usePathname();
    const SettingsLinkWrapper = isMobile ? SheetClose : React.Fragment;
    return (
      <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-24 items-center border-b px-4 lg:px-6">
              <Link href="/" className="flex items-center gap-4 font-semibold text-foreground">
                  <div className="bg-primary/90 p-3 rounded-lg shadow-md">
                      <Logo className="h-8 w-8 text-white" />
                  </div>
                  <div>
                      <h1 className="text-xl font-bold">F.Co</h1>
                      <p className="text-xs text-muted-foreground">FIRDOUS AHMAD & COMPANY</p>
                      <p className="text-sm font-semibold text-primary/90">Sopore, Kashmir</p>
                  </div>
              </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
              <NavLinks isMobile={isMobile} />
          </div>
          <div className="mt-auto p-4 border-t">
              <div className="px-4 mb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">QUICK CONTACT</h3>
                  <div className="space-y-2 text-sm">
                      <a href="tel:7006136330" className="flex items-center gap-3 text-muted-foreground hover:text-primary">
                          <Phone className="h-4 w-4" />
                          <span>7006136330</span>
                      </a>
                      <p className="text-xs text-muted-foreground">Apple Town, Sopore</p>
                  </div>
              </div>
              <div className="border-t pt-4">
                   <SettingsLinkWrapper {...(isMobile ? {asChild: true} : {})}>
                      <Link
                          href="/settings"
                          className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
                              pathname.startsWith('/settings') && 'bg-muted text-primary'
                          )}
                          >
                          <Settings className="h-4 w-4" />
                          Settings
                      </Link>
                  </SettingsLinkWrapper>
              </div>
              <div className="text-center text-xs text-muted-foreground mt-4">
                  <p>© 2025 F.Co</p>
                  <p>Firdous Ahmad & Company</p>
              </div>
          </div>
      </div>
  )
};

    
