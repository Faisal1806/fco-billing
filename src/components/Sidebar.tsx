
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  FileText,
  BookCopy,
  List,
  Globe,
  Package,
  HandCoins,
  Snowflake,
  BookOpen,
  Apple,
  FlaskConical,
  Boxes,
  History,
  Phone,
  Settings,
  ShoppingCart,
} from 'lucide-react';
import { Logo } from './logo';
import { cn } from '@/lib/utils';
import { SheetClose } from './ui/sheet';


const mainNavLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
];

const salesNavLinks = [
    { name: 'Sales Invoices', href: '/sales', icon: FileText },
    { name: 'Watak Register', href: '/watak-register', icon: BookCopy },
    { name: 'Purchases', href: '/purchases', icon: ShoppingCart },
    { name: 'Purchase Register', href: '/purchase-register', icon: List },
    { name: 'Outside Sales', href: '/outside-sales', icon: Globe },
];

const managementNavLinks = [
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Expenses', href: '/expenses', icon: FileText },
  { name: 'Advances', href: '/advances', icon: HandCoins },
  { name: 'Cold Storage', href: '/cold-storage', icon: Snowflake },
  { name: 'Khata Ledger', href: '/khata', icon: BookOpen },
];

const resourcesNavLinks = [
  { name: 'Fruit Rates', href: '/rates', icon: Apple },
  { name: 'Fertilizers & Pesticides', href: '/fertilizers', icon: FlaskConical },
  { name: 'Accessories', href: '/accessories', icon: Boxes },
  { name: 'Activity Log', href: '/activity-log', icon: History },
];

const settingsNavLinks = [
    { name: 'Settings', href: '/settings', icon: Settings },
];


const NavLink = ({ href, icon: Icon, children, isMobile }: { href: string; icon: React.ElementType; children: React.ReactNode; isMobile?: boolean }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  const LinkContent = () => (
     <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-400 transition-all hover:text-gray-50',
        isActive && 'bg-gray-700 text-white'
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );

  if (isMobile) {
    return <SheetClose asChild><LinkContent /></SheetClose>
  }
  return <LinkContent />;
};

const NavGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
        <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-gray-500 tracking-wider">
            {title}
        </h3>
        <div className="space-y-1">
            {children}
        </div>
    </div>
);


export const SidebarContent = ({ isMobile = false }) => {
  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Logo className="h-8 w-8 text-primary" />
          <span className="">F.Co</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-4 py-4">
          <NavGroup title="Analytics">
             {mainNavLinks.map(link => <NavLink key={link.href} href={link.href} icon={link.icon} isMobile={isMobile}>{link.name}</NavLink>)}
          </NavGroup>
          <NavGroup title="Sales & Purchases">
            {salesNavLinks.map(link => <NavLink key={link.href} href={link.href} icon={link.icon} isMobile={isMobile}>{link.name}</NavLink>)}
          </NavGroup>
           <NavGroup title="Management">
            {managementNavLinks.map(link => <NavLink key={link.href} href={link.href} icon={link.icon} isMobile={isMobile}>{link.name}</NavLink>)}
          </NavGroup>
           <NavGroup title="Resources">
            {resourcesNavLinks.map(link => <NavLink key={link.href} href={link.href} icon={link.icon} isMobile={isMobile}>{link.name}</NavLink>)}
          </NavGroup>
           <NavGroup title="Configuration">
            {settingsNavLinks.map(link => <NavLink key={link.href} href={link.href} icon={link.icon} isMobile={isMobile}>{link.name}</NavLink>)}
          </NavGroup>
        </nav>
      </div>
       <div className="mt-auto p-4 border-t">
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-gray-500 tracking-wider">
            Quick Contact
          </h3>
          <div className="px-3 text-gray-400">
            <p className="text-sm flex items-center gap-2"><Phone className="h-4 w-4"/> 7006136330</p>
            <p className="text-xs">Apple Town, Sopore</p>
          </div>
      </div>
    </div>
  )
};


export default function Sidebar() {
  return (
    <aside className="hidden border-r bg-muted/40 md:block w-[280px]">
        <SidebarContent />
    </aside>
  );
}
