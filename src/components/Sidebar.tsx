
"use client";

import * as React from "react";
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
  LogOut,
  Search,
  Award,
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
  Command as CommandIcon,
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
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export const sidebarSections = [
    {
      title: "MAIN",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "AI Assistant", href: "/smart-search", icon: Search },
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
            { name: "Statement Register", href: "/statement-register", icon: FileSpreadsheet },
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
  const [open, setOpen] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<any[]>([]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleLogout = () => {
      if (typeof window !== 'undefined') {
          localStorage.removeItem('userRole');
      }
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/login');
  };

  const performSearch = () => {
      if (typeof window === 'undefined') return;
      const results: any[] = [];
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;
          
          if (key.startsWith('invoice-') || key.startsWith('purchase-') || key.startsWith('receipt-') || key.startsWith('party-') || key.startsWith('manual-statement-')) {
              try {
                  const data = JSON.parse(localStorage.getItem(key)!);
                  let type = 'Node';
                  let icon = FileText;
                  let title = '';
                  let href = '';

                  if (key.startsWith('invoice-')) {
                      type = 'Watak';
                      icon = FileText;
                      title = `Invoice #${data.sNo} - ${data.customerName}`;
                      href = `/invoice/${data.sNo}`;
                  } else if (key.startsWith('purchase-')) {
                      type = 'Purchase';
                      icon = ShoppingBasket;
                      title = `Purchase #${data.billNo} - ${data.growerName}`;
                      href = `/purchase-bill/${data.billNo}`;
                  } else if (key.startsWith('receipt-')) {
                      type = 'Receipt';
                      icon = Receipt;
                      title = `Receipt #${data.no} - ${data.customerName}`;
                      href = `/receipt/${data.no}`;
                  } else if (key.startsWith('party-')) {
                      type = 'Party';
                      icon = Users;
                      title = `${data.name} (${data.type})`;
                      href = `/parties`;
                  } else if (key.startsWith('manual-statement-')) {
                      type = 'Statement';
                      icon = FileSpreadsheet;
                      title = `Statement #${data.sNo} - ${data.partyName}`;
                      href = `/statement-register`;
                  }

                  results.push({ title, type, icon, href, id: key });
              } catch (e) {}
          }
      }
      setSearchResults(results);
  };

  React.useEffect(() => {
      if (open) performSearch();
  }, [open]);

  return (
    <div className="flex h-16 items-center border-b border-white/10 px-4 shrink-0 bg-black/30 backdrop-blur-md z-50">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-primary-foreground">
          <Logo className="h-8 w-8" />
          <span className="hidden sm:inline-block">F.Co OS</span>
        </Link>
        
        <div className="ml-6 flex items-center">
            <Button 
                variant="outline" 
                className="h-10 px-4 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground gap-10 flex justify-between min-w-[200px]"
                onClick={() => setOpen(true)}
            >
                <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Search Index...</span>
                </div>
                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
        </div>

        <Menubar className="ml-auto bg-transparent border-none">
            <MenubarMenu>
                <MenubarTrigger className="p-0">
                    <Button variant="ghost" size="icon">
                        <MoreVertical />
                    </Button>
                </MenubarTrigger>
                <MenubarContent align="end" className="glass-panel rounded-2xl border-white/10">
                    {sidebarSections.map((section, index) => (
                        <div key={section.title}>
                            <MenubarSub>
                                <MenubarSubTrigger className="font-bold text-[10px] tracking-widest uppercase py-3">{section.title}</MenubarSubTrigger>
                                <MenubarSubContent className="glass-panel border-white/10 rounded-xl">
                                    {section.items.map(item => (
                                        <MenubarItem key={item.name} onSelect={() => router.push(item.href)} className="gap-3 py-3 rounded-lg">
                                            <item.icon className="h-4 w-4 text-accent" />
                                            <span className="font-bold text-xs uppercase tracking-tighter">{item.name}</span>
                                        </MenubarItem>
                                    ))}
                                </MenubarSubContent>
                            </MenubarSub>
                            {index < sidebarSections.length - 1 && <MenubarSeparator className="bg-white/5" />}
                        </div>
                    ))}
                </MenubarContent>
            </MenubarMenu>
        </Menubar>

        <ThemeSwitcher />

        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 rounded-xl">
            <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>

        <CommandDialog open={open} onOpenChange={setOpen}>
            <div className="glass-panel rounded-2xl overflow-hidden border-white/10 shadow-2xl">
                <CommandInput placeholder="Search growers, wataks, receipts..." className="h-14 font-bold" />
                <CommandList className="max-h-[450px]">
                    <CommandEmpty className="p-10 text-center text-xs font-black uppercase tracking-widest opacity-30">No matching nodes found</CommandEmpty>
                    <CommandGroup heading={<span className="text-[10px] font-black uppercase tracking-widest text-accent px-2">Master Index Results</span>}>
                        {searchResults.map((item) => (
                            <CommandItem 
                                key={item.id} 
                                onSelect={() => {
                                    router.push(item.href);
                                    setOpen(false);
                                }}
                                className="flex items-center gap-4 p-4 rounded-xl mx-2 cursor-pointer hover:bg-white/5 group"
                            >
                                <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-accent group-hover:text-black transition-all">
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black tracking-tight">{item.title}</p>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{item.type}</p>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </div>
        </CommandDialog>
    </div>
  );
}

export default AppMenubar;


