
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
  Smile,
  LogOut,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ThemeSwitcher } from "./theme-switcher";

export const sidebarSections = [
    {
      title: "",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
     {
      title: "Management",
      items: [
        { name: "Sales", href: "/sales", icon: ShoppingCart },
        { name: "Watak Register", href: "/watak-register", icon: FileText },
        { name: "Purchases", href: "/purchases", icon: ShoppingBasket },
        { name: "Purchase Register", href: "/purchase-register", icon: FileSpreadsheet },
        { name: "Outside Sales", href: "/outside-sales", icon: Globe },
        { name: "Khata Ledger", href: "/khata", icon: BookOpen },
        { name: "Advances & Loans", href: "/advances", icon: Banknote },
        { name: "Expenses", href: "/expenses", icon: DollarSign },
      ]
    },
    {
      title: "Resources",
      items: [
        { name: "Products", href: "/products", icon: Package },
        { name: "Parties", href: "/parties", icon: Users },
        { name: "Fruit Rates", href: "/rates", icon: TrendingUp },
        { name: "Fertilizer Rates", href: "/fertilizers", icon: FlaskConical },
        { name: "Accessories", href: "/accessories", icon: Box },
        { name: "Cold Storage", href: "/cold-storage", icon: Snowflake },
        { name: "Feedback", href: "/feedback", icon: Smile },
      ]
    },
     {
      title: "Admin",
      items: [
         { name: "Activity Log", href: "/activity-log", icon: FileText },
        { name: "Settings", href: "/settings", icon: Cog },
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
       <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-primary-foreground/70 transition-all hover:text-primary-foreground hover:bg-white/10",
          isActive && "bg-white/20 text-primary-foreground"
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
    <div className="flex h-full max-h-screen flex-col gap-2 bg-black/30 backdrop-blur-md border-r border-white/10">
      <div className="flex h-16 items-center border-b border-white/10 px-4 shrink-0">
        <Link href="/" className="flex items-center gap-2 font-semibold text-primary-foreground">
          <Logo className="h-8 w-8" />
          <span className="">F.Co</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start p-2 text-sm font-medium">
          {sidebarSections.map((section) => (
            <div key={section.title || 'dashboard'} className="py-2">
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
         <div className="fixed top-4 left-4 z-50 md:hidden">
           <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 bg-black/30 backdrop-blur-md border-white/10 text-primary-foreground hover:bg-black/50 hover:text-white"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 bg-transparent border-0 w-[280px]">
              <SidebarContent isMobile={true}/>
            </SheetContent>
          </Sheet>
        </div>
      </>
    );
};

export default Sidebar;
