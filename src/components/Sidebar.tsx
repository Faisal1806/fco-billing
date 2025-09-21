
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Truck,
  Globe,
  Package,
  BookOpen,
  DollarSign,
  TrendingUp,
  FlaskConical,
  Box,
  History,
  Cog,
  Snowflake,
  Banknote,
  FileSpreadsheet,
  Phone,
  MapPin,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SheetClose } from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const sidebarSections = [
    {
      title: "ANALYTICS",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "SALES AND PURCHASES",
      items: [
        { name: "Sales Invoices", href: "/sales", icon: FileText },
        { name: "Watak Register", href: "/watak-register", icon: FileSpreadsheet },
        { name: "Purchases", href: "/purchase-register", icon: ShoppingCart },
        { name: "Outside Sales (Bikris)", href: "/outside-sales", icon: Globe },
      ],
    },
    {
      title: "MANAGEMENT",
      items: [
        { name: "Products", href: "/products", icon: Package },
        { name: "Expenses", href: "/expenses", icon: DollarSign },
        { name: "Advances", href: "/advances", icon: Banknote },
        { name: "Cold Storage", href: "/cold-storage", icon: Snowflake },
        { name: "Khata Ledger", href: "/khata", icon: BookOpen },
      ],
    },
    {
      title: "RESOURCES",
      items: [
        { name: "Fruit Rates", href: "/rates", icon: TrendingUp },
        { name: "Fertilizers/Pesticides", href: "/fertilizers", icon: FlaskConical },
        { name: "Accessories", href: "/accessories", icon: Box },
        { name: "Activity Log", href: "/activity-log", icon: History },
      ],
    },
    {
      title: "CONFIGURATION",
      items: [
        { name: "Settings", href: "/settings", icon: Cog },
      ],
    },
];

export function SidebarContent({ isMobile }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('userRole');
    }
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/login');
  };

  const renderLink = (item: any) => {
    const { name, href, icon: Icon } = item;
    const isActive = pathname === href;
    const linkContent = (
       <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
          isActive && "bg-muted text-primary"
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
          <div className="bg-purple-600 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold">
            F
          </div>
          <span className="">F.Co</span>
        </Link>
      </div>

       {/* Quick Contact */}
      <div className="px-4 py-2 text-sm text-muted-foreground space-y-1 border-b">
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-primary" />
          <span>+91 9797002164</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-primary" />
          <span>Shed No. 13, Fud No. 12A</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start p-2 text-sm font-medium lg:px-4">
          {sidebarSections.map((section) => (
            <div key={section.title} className="mb-2">
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
              <div className="grid grid-flow-row auto-rows-max text-sm">
                {section.items.map((item) => (
                  <div key={item.href}>{renderLink(item)}</div>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t">
        <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-3 w-full justify-start rounded-md px-3 py-2 text-muted-foreground hover:bg-red-800/20 hover:text-red-500">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}


export default function Sidebar() {
    return (
        <div className="hidden border-r bg-muted/40 md:block">
            <SidebarContent />
        </div>
    )
}
