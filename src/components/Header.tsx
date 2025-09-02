
"use client";

import { useTheme } from "next-themes";
import { ThemeSwitcher } from "./theme-switcher";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { LayoutDashboard, Package, Settings, Receipt, BookUser, Menu, ShoppingCart, Truck, BookCopy, ScrollText, Tags, FlaskConical, Shapes } from 'lucide-react';
import { Logo } from "./logo";
import React from "react";


export function Header({ title }: { title: string }) {
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
      { href: '/products', icon: Package, label: t('products'), role: ['admin'] },
      { href: '/expenses', icon: Receipt, label: 'Expenses', role: ['admin'] },
      { href: '/watak-register', icon: BookUser, label: t('watak_register'), role: ['admin', 'staff'] },
      { href: '/khata', icon: BookCopy, label: 'Khata Ledger', role: ['admin', 'staff'] },
      { href: '/rates', icon: Tags, label: 'Fruit Rates', role: ['admin', 'staff'] },
      { href: '/fertilizer-rates', icon: FlaskConical, label: 'Fertilizer Rates', role: ['admin', 'staff'] },
      { href: '/accessories', icon: Shapes, label: 'Accessories', role: ['admin', 'staff'] },
      { href: '/settings', icon: Settings, label: t('settings'), role: ['admin'] },
    ];

    const filteredNavItems = navItems.filter(item => userRole && item.role.includes(userRole));


  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
       <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Logo className="h-8 w-8" />
                  <span className="">{t('app_title')}</span>
                </Link>
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-primary',
                       pathname.startsWith(item.href) && 'bg-primary text-primary-foreground hover:text-primary-foreground'
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
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      <LanguageSwitcher />
      <ThemeSwitcher />
    </header>
  );
}
