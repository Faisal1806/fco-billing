// src/components/Sidebar.tsx
"use client";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import {
  LayoutDashboard, FileText, ShoppingCart, Package,
  DollarSign, BookOpen, Receipt, Layers, TrendingUp,
  Cog, Archive, FileSpreadsheet, LogOut, Phone, MapPin, Home, Users, BarChart2, Package2, Settings, History, Truck, Building, Leaf, Banknote, Snowflake, FileDown, SprayCan
} from "lucide-react";
import { usePathname } from 'next/navigation';
import { Logo } from './logo';
import { Button } from './ui/button';


const NavLink = ({ href, icon: Icon, children }: { href: string, icon: React.ElementType, children: React.ReactNode }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
          href={href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-400 transition-all hover:text-white hover:bg-gray-700 ${isActive ? "bg-gray-800 text-white" : ""}`}
        >
          <Icon className="h-4 w-4" />
          {children}
        </Link>
    )
}

export function SidebarContent({ isMobile = false }) {
    const { t } = useLanguage();
    const CloseWrapper = isMobile ? 'SheetClose' : 'div';

    const sidebarSections = [
      {
        title: "ANALYTICS",
        items: [
          { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        ]
      },
      {
        title: "SALES AND PURCHASES",
        items: [
          { name: "Sales Invoices", href: "/sales", icon: FileText },
          { name: "Watak Register", href: "/watak-register", icon: FileSpreadsheet },
          { name: "Purchases", href: "/purchases", icon: ShoppingCart },
          { name: "Purchase Register", href: "/purchase-register", icon: Layers },
          { name: "Outside Sales (Bikris)", href: "/outside-sales", icon: Truck },
        ]
      },
      {
        title: "MANAGEMENT",
        items: [
          { name: "Products", href: "/products", icon: Package },
          { name: "Expenses", href: "/expenses", icon: DollarSign },
          { name: "Advances", href: "/advances", icon: Banknote },
          { name: "Cold Storage", href: "/cold-storage", icon: Snowflake },
          { name: "Khata Ledger", href: "/khata", icon: BookOpen },
        ]
      },
      {
        title: "RESOURCES",
        items: [
          { name: "Fruit Rates", href: "/rates", icon: TrendingUp },
          { name: "Fertilizers", href: "/fertilizers", icon: SprayCan },
          { name: "Accessories", href: "/accessories", icon: Archive },
          { name: "Activity Log", href: "/activity-log", icon: History },
        ]
      },
      {
        title: "CONFIGURATION",
        items: [
          { name: "Settings", href: "/settings", icon: Cog },
        ]
      }
    ];

    return (
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Logo className="h-8 w-8" />
              <span className="">SwiftSale</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {sidebarSections.map((section, i) => (
                <div className="py-2" key={i}>
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-gray-400">
                        {section.title}
                    </h2>
                    <div className="space-y-1">
                        {section.items.map((item, j) => (
                           <NavLink key={j} href={item.href} icon={item.icon}>
                                {item.name}
                            </NavLink>
                        ))}
                    </div>
                </div>
              ))}
            </nav>
          </div>
           <div className="mt-auto p-4">
            <Card>
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle>Quick Contact</CardTitle>
                <CardDescription>
                  Reach out for support or inquiries.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                 <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      <span>+91 7006136330</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>Fruit Mandi, Sopore</span>
                    </div>
                  </div>
              </CardContent>
            </Card>
          </div>
        </div>
    )
}


export default function Sidebar() {
    return (
      <aside className="hidden border-r bg-muted/40 md:block w-full">
          <SidebarContent />
      </aside>
    )
}