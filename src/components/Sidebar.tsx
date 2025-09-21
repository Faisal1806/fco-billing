
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
    items: [{ name: "Dashboard", href: "/dashboard", icon: LayoutGrid }]
  },
  {
    title: "SALES AND PURCHASES",
    items: [
      { name: "Sales Invoices", href: "/sales", icon: FileText },
      { name: "Watak Register", href: "/watak-register", icon: BookCopy },
      { name: "Purchases", href: "/purchases", icon: ShoppingCart },
      { name: "Purchase Register", href: "/purchase-register", icon: List },
      { name: "Outside Sales (Bikris)", href: "/outside-sales", icon: Globe }
    ]
  },
  {
    title: "MANAGEMENT",
    items: [
      { name: "Products", href: "/products", icon: Package },
      { name: "Expenses", href: "/expenses", icon: FileText },
      { name: "Advances", href: "/advances", icon: HandCoins },
      { name: "Cold Storage", href: "/cold-storage", icon: Snowflake },
      { name: "Khata Ledger", href: "/khata", icon: BookOpen }
    ]
  },
  {
    title: "RESOURCES",
    items: [
      { name: "Fruit Rates", href: "/rates", icon: Apple },
      { name: "Fertilizers And Pesticides", href: "/fertilizers", icon: FlaskConical },
      { name: "Accessories", href: "/accessories", icon: Boxes },
      { name: "Activity Log", href: "/activity-log", icon: History }
    ]
  },
  {
    title: "CONFIGURATION",
    items: [{ name: "Settings", href: "/settings", icon: Settings }]
  }
];

const NavLink = ({ name, href, icon: Icon, isMobile }: { name: string; href: string; icon: React.ElementType; isMobile?: boolean }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  const LinkContent = () => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-gray-300 transition-all hover:bg-gray-700 hover:text-white",
        isActive && "bg-gray-700 text-white"
      )}
    >
      <Icon className="h-4 w-4" />
      {name}
    </Link>
  );

  if (isMobile) {
    return <SheetClose asChild><LinkContent /></SheetClose>;
  }
  return <LinkContent />;
};

export const SidebarContent = ({ isMobile = false }) => {
  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-white">
          <div className="bg-purple-600 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold">
            F
          </div>
          <span className="text-xl">F.Co</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {sidebarSections.map((section, i) => (
            <div className="mb-2" key={i}>
              <div className="px-3 py-2 text-xs font-bold uppercase text-gray-500 tracking-wider">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item, j) => (
                  <NavLink key={j} name={item.name} href={item.href} icon={item.icon} isMobile={isMobile} />
                ))}
              </div>
            </div>
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
  );
};

export default function Sidebar() {
  return (
    <aside className="hidden w-64 bg-gray-900 text-gray-200 flex-col p-4 min-h-screen shadow-xl md:flex">
        <SidebarContent />
    </aside>
  );
}
