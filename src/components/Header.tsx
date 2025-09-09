
"use client";

import { useTheme } from "next-themes";
import { ThemeSwitcher } from "./theme-switcher";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "./ui/sheet";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { LayoutDashboard, Settings, Receipt, BookCopy, Menu, Package, BarChart3, Users, Tags, FlaskConical, Phone, ShoppingCart } from 'lucide-react';
import { Logo } from "./logo";
import React from "react";
import { useToast } from "@/hooks/use-toast";


export function Header({ title }: { title: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();
    const [userRole, setUserRole] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
        setUserRole(localStorage.getItem('userRole'));
        }
    }, []);
    
    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('userRole');
        }
        toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
        router.push('/login');
    };

    const navItems = [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/sales', icon: ShoppingCart, label: 'Sales' },
      { href: '/products', icon: Package, label: 'Products' },
    ];


  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
       <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
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
              <nav className="grid gap-2 text-base font-medium p-4">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.label}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
                        pathname.startsWith(item.href) && 'bg-muted text-primary'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
               <div className="mt-auto border-t p-4">
                <div className="px-4 mb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Contact</h3>
                  <div className="space-y-2 text-sm">
                    <a href="tel:7006136330" className="flex items-center gap-3 text-muted-foreground hover:text-primary">
                      <Phone className="h-4 w-4" />
                      <span>7006136330</span>
                    </a>
                    <p className="text-xs text-muted-foreground">Apple Town, Sopore</p>
                    <p className="text-xs font-semibold text-primary">Fruit Mandi Operations</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                   <SheetClose asChild>
                      <Link
                          href="/settings"
                          className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
                              pathname.startsWith('/settings') && 'bg-muted text-primary'
                          )}
                          >
                          <Settings className="h-5 w-5" />
                          Settings
                      </Link>
                    </SheetClose>
                </div>
                <div className="text-center text-xs text-muted-foreground mt-4">
                    <p>© 2024 F.Co</p>
                    <p>Firdous Ahmad & Company</p>
              </div>
              </div>
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
