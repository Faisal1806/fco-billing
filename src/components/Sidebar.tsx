
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

const iconMap: { [key: string]: React.ElementType } = {
  "Dashboard": LayoutGrid,
  "Sales Invoices": FileText,
  "Watak Register": BookCopy,
  "Purchases": ShoppingCart,
  "Purchase Register": List,
  "Outside Sales (Bikris)": Globe,
  "Products": Package,
  "Expenses": FileText,
  "Advances": HandCoins,
  "Cold Storage": Snowflake,
  "Khata Ledger": BookOpen,
  "Fruit Rates": Apple,
  "Fertilizers And Pesticides": FlaskConical,
  "Accessories": Boxes,
  "Activity Log": History,
  "Settings": Settings,
};

const hrefMap: { [key: string]: string } = {
  "Dashboard": "/dashboard",
  "Sales Invoices": "/sales",
  "Watak Register": "/watak-register",
  "Purchases": "/purchases",
  "Purchase Register": "/purchase-register",
  "Outside Sales (Bikris)": "/outside-sales",
  "Products": "/products",
  "Expenses": "/expenses",
  "Advances": "/advances",
  "Cold Storage": "/cold-storage",
  "Khata Ledger": "/khata",
  "Fruit Rates": "/rates",
  "Fertilizers And Pesticides": "/fertilizers",
  "Accessories": "/accessories",
  "Activity Log": "/activity-log",
  "Settings": "/settings",
};

const sidebarSections = [
  {
    title: "ANALYTICS",
    items: ["Dashboard"]
  },
  {
    title: "SALES AND PURCHASES",
    items: [
      "Sales Invoices",
      "Watak Register",
      "Purchases",
      "Purchase Register",
      "Outside Sales (Bikris)"
    ]
  },
  {
    title: "MANAGEMENT",
    items: [
      "Products",
      "Expenses",
      "Advances",
      "Cold Storage",
      "Khata Ledger"
    ]
  },
  {
    title: "RESOURCES",
    items: [
      "Fruit Rates",
      "Fertilizers And Pesticides",
      "Accessories",
      "Activity Log"
    ]
  },
  {
    title: "CONFIGURATION",
    items: ["Settings"]
  }
];

const NavLink = ({ name, isMobile }: { name: string; isMobile?: boolean }) => {
  const pathname = usePathname();
  const href = hrefMap[name] || '/';
  const Icon = iconMap[name] || FileText;
  const isActive = pathname === href;

  const LinkContent = () => (
    <Link
      href={href}
      className={cn(
        "sidebar-item flex items-center gap-4 px-7 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-[#23262f] hover:text-white rounded-md mb-px",
        isActive && "bg-[#313236] text-[#03dac5] font-bold"
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
    <div className="flex h-full max-h-screen flex-col">
      <div className="flex h-16 items-center border-b border-gray-700 px-6">
        <Link href="/dashboard" className="flex items-center gap-3 font-semibold text-white">
          <Logo className="h-8 w-8" />
          <span className="text-lg">F.Co</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto pt-4 px-2">
        <nav className="grid items-start text-sm font-medium">
          {sidebarSections.map((section, i) => (
            <div className="sidebar-section mb-4" key={i}>
              <div className="sidebar-section-title px-5 py-2 text-xs font-bold uppercase text-gray-500 tracking-wider">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item, j) => (
                  <NavLink key={j} name={item} isMobile={isMobile} />
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
    <aside className="hidden md:block w-[260px] bg-[#181a1b] text-[#fafafa] border-r border-[#24262e]">
        <SidebarContent />
    </aside>
  );
}
