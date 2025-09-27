
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Globe,
  Package,
  BookOpen,
  DollarSign,
  TrendingUp,
  FlaskConical,
  Box,
  Cog,
  Snowflake,
  Banknote,
  FileSpreadsheet,
  Users,
  ShoppingBasket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SheetClose } from "@/components/ui/sheet";
import { Logo } from "./logo";

export const sidebarSections = [
    {
      title: "",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Sales", href: "/sales", icon: ShoppingCart },
        { name: "Purchases", href: "/purchases", icon: ShoppingBasket },
        { name: "Purchase Register", href: "/purchase-register", icon: FileText },
        { name: "Products", href: "/products", icon: Package },
        { name: "Expenses", href: "/expenses", icon: DollarSign },
        { name: "Watak Register", href: "/watak-register", icon: FileSpreadsheet },
        { name: "Khata Ledger", href: "/khata", icon: BookOpen },
        { name: "Fruit Rates", href: "/rates", icon: TrendingUp },
        { name: "Fertilizer Rates", href: "/fertilizers", icon: FlaskConical },
        { name: "Accessories", href: "/accessories", icon: Box },
        { name: "Settings", href: "/settings", icon: Cog },
      ],
    },
];

export function SidebarContent({ isMobile }: { isMobile?: boolean }) {
  const pathname = usePathname();

  const renderLink = (item: any) => {
    const { name, href, icon: Icon } = item;
    const isActive = pathname === href;
    const linkContent = (
       <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
          isActive && "bg-primary text-primary-foreground hover:text-primary-foreground/90"
        )}
      >
        <Icon className="h-4 w-4" />
        {name}
      </Link>
    );

    if (isMobile) {
      return <SheetClose asChild key={item.href}>{linkContent}</SheetClose>
    }
    return linkContent;
  };

  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo className="h-6 w-6" />
          <span className="">SwiftSale</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start p-2 text-sm font-medium lg:px-4">
          {sidebarSections.map((section) => (
            <div key={section.title || 'dashboard'} className="py-2">
             {section.title && <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>}
              {section.items.map((item) => (
                <div key={item.name}>{renderLink(item)}</div>
              ))}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

const Sidebar = () => {
    return (
        <div className="hidden border-r bg-muted/40 md:block">
            <SidebarContent />
        </div>
    );
};

export default Sidebar;
