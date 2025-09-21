
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
  Settings,
  ShoppingCart,
  Phone,
} from 'lucide-react';
import { Logo } from './logo';
import { cn } from '@/lib/utils';
import { SheetClose } from './ui/sheet';

const sidebarSections = [
  {
    title: "ANALYTICS",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    ]
  },
  {
    title: "SALES AND PURCHASES",
    items: [
      { name: "Sales Invoices", href: "/sales", icon: FileText },
      { name: "Watak Register", href: "/watak-register", icon: BookCopy },
      { name: "Purchases", href: "/purchases", icon: ShoppingCart },
      { name: "Purchase Register", href: "/purchase-register", icon: List },
      { name: "Outside Sales (Bikris)", href: "/outside-sales", icon: Globe },
    ]
  },
  {
    title: "MANAGEMENT",
    items: [
      { name: "Products", href: "/products", icon: Package },
      { name: "Expenses", href: "/expenses", icon: FileText },
      { name: "Advances", href: "/advances", icon: HandCoins },
      { name: "Cold Storage", href: "/cold-storage", icon: Snowflake },
      { name: "Khata Ledger", href: "/khata", icon: BookOpen },
    ]
  },
  {
    title: "RESOURCES",
    items: [
      { name: "Fruit Rates", href: "/rates", icon: Apple },
      { name: "Fertilizers And Pesticides", href: "/fertilizers", icon: FlaskConical },
      { name: "Accessories", href: "/accessories", icon: Boxes },
      { name: "Activity Log", href: "/activity-log", icon: History },
    ]
  },
  {
    title: "CONFIGURATION",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
    ]
  }
];


const NavLink = ({ href, icon: Icon, children, isMobile }: { href: string; icon: React.ElementType; children: React.ReactNode; isMobile?: boolean }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  const LinkContent = () => (
     <Link
      href={href}
      className={cn(
        "sidebar-item flex items-center gap-4 px-7 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-[#23262f] hover:text-white",
        isActive && "bg-[#313236] text-[#03dac5] font-bold"
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

const NavGroup = ({ title, items, isMobile }: { title: string; items: { name: string, href: string, icon: React.ElementType }[], isMobile?: boolean }) => (
    <div className="sidebar-section mb-4">
        <h3 className="sidebar-section-title px-5 py-2 text-xs font-bold uppercase text-gray-500 tracking-wider">
            {title}
        </h3>
        <div className="space-y-1">
            {items.map(item => <NavLink key={item.href} href={item.href} icon={item.icon} isMobile={isMobile}>{item.name}</NavLink>)}
        </div>
    </div>
);


export const SidebarContent = ({ isMobile = false }) => {
  return (
    <div className="flex h-full max-h-screen flex-col">
      <div className="flex h-16 items-center border-b border-gray-700 px-6">
        <Link href="/dashboard" className="flex items-center gap-3 font-semibold text-white">
          <Logo className="h-8 w-8" />
          <span className="text-lg">F.Co</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto pt-4">
        <nav className="grid items-start text-sm font-medium">
          {sidebarSections.map((section) => (
            <NavGroup key={section.title} title={section.title} items={section.items} isMobile={isMobile} />
          ))}
        </nav>
      </div>
       <div className="mt-auto p-4 border-t border-gray-700">
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
    <aside className="hidden md:block w-[260px] bg-[#181a1b] text-[#fafafa] border-r border-[#24262e]">
        <SidebarContent />
    </aside>
  );
}
