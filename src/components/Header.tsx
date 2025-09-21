
"use client";

import { useTheme } from "next-themes";
import { ThemeSwitcher } from "./theme-switcher";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "./ui/sheet";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
    LayoutDashboard, Settings, Receipt, BookCopy, Menu, Package, BarChart3, Users, Tags, FlaskConical, Phone, ShoppingCart, Globe, Banknote, Snowflake, Shapes, History, Hash, LogOut 
} from 'lucide-react';
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


  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 sticky top-0 z-40">
       <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-[280px]">
              <NavContent isMobile={true} />
            </SheetContent>
        </Sheet>

      <div className="w-full flex-1">
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}

    