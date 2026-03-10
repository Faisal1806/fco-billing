"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Package,
  BookOpen,
  DollarSign,
  TrendingUp,
  Cog,
  Snowflake,
  Banknote,
  FileSpreadsheet,
  Users,
  ShoppingBasket,
  Smile,
  LogOut,
  Menu,
  Search,
  Award,
  History,
  Receipt,
  RotateCcw,
  Truck,
  Bell,
  UserCheck,
  DatabaseZap,
  LifeBuoy,
  Globe,
  MoreVertical,
  Activity,
  Droplets,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ThemeSwitcher } from "./theme-switcher";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
} from "@/components/ui/menubar";

export const sidebarSections = [
    {
      title: "MAIN",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Smart Search", href: "/smart-search", icon: Search },
      ]
    },
    {
      title: "OPERATIONS",
      items: [
        { name: "Sales", href: "/sales", icon: ShoppingCart },
        { name: "Watak Register", href: "/watak-register", icon: FileText },
        { name: "Purchases", href: "/purchases", icon: ShoppingBasket },
        { name: "Purchase Register", href: "/purchase-register", icon: BookOpen },
        { name: "Products", href: "/products", icon: Package },
        { name: "Parties", href: "/parties", icon: Users },
        { name: "Expenses", href: "/expenses", icon: DollarSign },
        { name: "Outside Sales", href: "/outside-sales", icon: Globe },
        { name: "Fruit Rates", href: "/rates", icon: TrendingUp },
      ]
    },
    {
        title: "FINANCE & LEDGERS",
        items: [
            { name: "Khata Ledger", href: "/khata", icon: BookOpen },
            { name: "Statement Of Account", href: "/statement", icon: FileSpreadsheet },
            { name: "Payments", href: "/advances", icon: Banknote },
            { name: "Loyalty", href: "/loyalty", icon: Award },
        ]
    },
    {
      title: "INVENTORY & LOGISTICS",
      items: [
        { name: "Cold Storage", href: "/cold-storage", icon: Snowflake },
        { name: "Activity Log", href: "/activity-log", icon: Activity },
        { name: "Accessories", href: "/accessories", icon: Droplets },
        { name: "Receipts", href: "/receipts", icon: Receipt },
        { name: "Returns", href: "/returns", icon: RotateCcw },
        { name: "Stock Transfer", href: "/stock-transfer", icon: Truck },
      ]
    },
     {
      title: "SYSTEM",
      items: [
        { name: "Reports", href: "/reports", icon: TrendingUp },
        { name: "Notifications", href: "/settings", icon: Bell },
        { name: "Users & Roles", href: "/users", icon: UserCheck },
        { name: "Backup & Sync", href: "/settings", icon: DatabaseZap },
        { name: "Social Tiles", href: "/social-tiles", icon: GitBranch },
        { name: "Settings", href: "/settings", icon: Cog },
        { name: "Help & Support", href: "/feedback", icon: LifeBuoy },
      ]
    }
];

export function AppMenubar() {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = () => {
      if (typeof window !== 'undefined') {
          localStorage.removeItem('userRole');
      }
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/login');
  };

  return (
    <div className="flex h-16 items-center border-b border-white/10 px-4 shrink-0 bg-black/30 backdrop-blur-md z-50">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-primary-foreground">
          <Logo className="h-8 w-8" />
          <span className="">F.Co App</span>
        </Link>
        
        <Menubar className="ml-auto bg-transparent border-none">
            <MenubarMenu>
                <MenubarTrigger className="p-0">
                    <Button variant="ghost" size="icon">
                        <MoreVertical />
                    </Button>
                </MenubarTrigger>
                <MenubarContent align="end">
                    {sidebarSections.map((section, index) => (
                        <div key={section.title}>
                            <MenubarSub>
                                <MenubarSubTrigger>{section.title}</MenubarSubTrigger>
                                <MenubarSubContent>
                                    {section.items.map(item => (
                                        <MenubarItem key={item.name} onSelect={() => router.push(item.href)}>
                                            <item.icon className="h-4 w-4 mr-2" />
                                            {item.name}
                                        </MenubarItem>
                                    ))}
                                </MenubarSubContent>
                            </MenubarSub>
                            {index < sidebarSections.length - 1 && <MenubarSeparator />}
                        </div>
                    ))}
                </MenubarContent>
            </MenubarMenu>
        </Menubar>

        <ThemeSwitcher />

        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10">
            <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
    </div>
  );
}

export default AppMenubar;
