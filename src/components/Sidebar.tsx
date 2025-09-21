
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
    LayoutDashboard, Settings, Receipt, BookCopy, Package, Globe, Banknote, Snowflake, Shapes, History, Tags, FlaskConical, Phone, ShoppingCart
} from 'lucide-react';
import { Logo } from "./logo";
import { SheetClose } from './ui/sheet';

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
                key={item.href}
                >
                <item.icon className="h-4 w-4" />
                {item.label}
                </Link>
            );
            return isMobile ? <Wrapper key={item.label} asChild>{link}</Wrapper> : <React.Fragment key={item.label}>{link}</React.Fragment>;
        })}
        </nav>
    );
};

export const SidebarContent = ({ isMobile }: { isMobile: boolean }) => {
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


export default function Sidebar() {
    return (
        <aside className="hidden md:block w-64 border-r bg-background">
            <SidebarContent isMobile={false} />
        </aside>
    )
}
