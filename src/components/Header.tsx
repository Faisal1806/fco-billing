
"use client";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Sun, Moon, ShoppingCart, Tags, Truck, BookCopy, ScrollText } from "lucide-react";
import { ThemeSwitcher } from "./theme-switcher";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { LayoutDashboard, Package, Settings, Receipt, BookUser, BarChart3 } from 'lucide-react';
import { Logo } from "./logo";


export function Header({ title }: { title: string }) {
    const pathname = usePathname();
    const { t } = useLanguage();

    const navItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
        { href: '/sales', icon: ShoppingCart, label: t('sales') },
        { href: '/purchases', icon: Truck, label: 'Purchases' },
        { href: '/purchase-register', icon: ScrollText, label: 'Purchase Register' },
        { href: '/products', icon: Package, label: t('products') },
        { href: '/expenses', icon: Receipt, label: t('expenses') },
        { href: '/watak-register', icon: BookUser, label: t('watak_register') },
        { href: '/khata', icon: BookCopy, label: 'Khata Ledger' },
        { href: '/rates', icon: Tags, label: 'Rates' },
        { href: '/settings', icon: Settings, label: t('settings') },
    ];


  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
       <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <ShoppingCart className="h-5 w-5" />
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
                  <span className="sr-only">{t('app_title')}</span>
                </Link>
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground',
                      pathname.startsWith(item.href) && 'bg-muted text-foreground'
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
