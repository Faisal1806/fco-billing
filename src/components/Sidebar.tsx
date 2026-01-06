
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ThemeSwitcher } from "./theme-switcher";
import { motion } from 'framer-motion';

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
        { name: "Products", href: "/products", icon: Package },
        { name: "Parties", href: "/parties", icon: Users },
        { name: "Expenses", href: "/expenses", icon: DollarSign },
        { name: "Outside Sales", href: "/outside-sales", icon: Globe },
      ]
    },
    {
        title: "FINANCE & LEDGERS",
        items: [
            { name: "Khata Ledger", href: "/khata", icon: BookOpen },
            { name: "Statement of Account", href: "/statement", icon: FileSpreadsheet },
            { name: "Payments", href: "/advances", icon: Banknote },
            { name: "Loyalty Points", href: "/loyalty", icon: Award },
        ]
    },
    {
      title: "INVENTORY & LOGISTICS",
      items: [
        { name: "Cold Storage", href: "/cold-storage", icon: Snowflake },
        { name: "Receipts", href: "/sales?tab=receipts", icon: Receipt },
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
        { name: "Settings", href: "/settings", icon: Cog },
        { name: "Help & Support", href: "/feedback", icon: LifeBuoy },
      ]
    }
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
       <motion.div
        whileHover={{ x: 5, scale: 1.05, originX: 0 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="neon-glow-container"
       >
         <Link
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-primary-foreground/70 transition-all hover:text-primary-foreground hover:bg-white/10",
            isActive && "bg-white/20 text-primary-foreground"
          )}
        >
          <Icon className={cn("h-4 w-4 transition-all", isActive ? "text-green-300 neon-glow-icon" : "")} />
          {name}
        </Link>
      </motion.div>
    );

    if (isMobile) {
      return <SheetClose asChild key={item.href}>{linkContent}</SheetClose>
    }
    return linkContent;
  };
  
  const sectionsToRender = sidebarSections;

  return (
    <div className="flex h-full max-h-screen flex-col gap-2 bg-black/30 backdrop-blur-md border-r border-white/10">
      <div className="flex h-16 items-center border-b border-white/10 px-4 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-primary-foreground">
          <Logo className="h-8 w-8" />
          <span className="">F.Co App</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start p-2 text-sm font-medium">
          {sectionsToRender.map((section) => (
            <div key={section.title || 'home'} className="py-2">
             {section.title && <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/50">
                {section.title}
              </h3>}
              {section.items.map((item) => (
                <div key={item.name}>{renderLink(item)}</div>
              ))}
            </div>
          ))}
        </nav>
      </div>
       <div className="mt-auto p-4 border-t border-white/10">
          <div className="flex items-center justify-between">
              <ThemeSwitcher />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10">
                  <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
          </div>
      </div>
    </div>
  );
}

const Sidebar = () => {
    return (
      <>
        <div className="hidden md:fixed md:inset-y-0 md:z-50 md:w-[220px] lg:w-[280px] md:flex md:flex-col">
            <SidebarContent />
        </div>
         <header className="md:hidden sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-sm px-4">
           <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 bg-transparent border-0 w-[280px] data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=open]:slide-in-from-left"
            style={{
                perspective: '1000px',
                transformStyle: 'preserve-3d',
              }}
            >
              <SidebarContent isMobile={true}/>
            </SheetContent>
          </Sheet>
           <div className="flex items-center gap-2 font-semibold text-foreground">
              <Logo className="h-8 w-8" />
              <span className="">F.Co App</span>
            </div>
        </header>
      </>
    );
};

export default Sidebar;
