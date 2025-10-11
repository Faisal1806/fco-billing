'use client'

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IndianRupee, TrendingUp, TrendingDown, Calendar, Hash, BarChart3, FileText, BookOpen, PlusCircle, ShoppingBasket, LayoutDashboard, Briefcase, Globe, Box, Archive } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import placeholderImages from '@/app/lib/placeholder-images.json';
import { motion } from 'framer-motion';
import { sidebarSections } from '@/components/Sidebar';
import { cn } from '@/lib/utils';


interface Invoice {
    id: string;
    sNo: string;
    date: string;
    totals: {
        netSale: number;
        grossSale: number;
        totalExpenses: number;
        pattiQty: number;
        dabbaQty: number;
    };
    customerName: string;
}

interface Bikri {
    id: string;
    date: string;
    purchaseEntries: {
        type: 'Patti' | 'Dabba';
        qty: number;
    }[];
}

const normalizeName = (name: string): string => {
    if (!name) return '';
    return name
        .toUpperCase()
        .replace(/R\/O.*$/i, '')
        .replace(/\(.*\)/, '')
        .replace(/\b(MOHAMMAD|MOHD|MD|GH\.)\b/g, 'MOHAMMAD')
        .replace(/\b(AHMAD|AH)\b/g, 'AHMAD')
        .replace(/S\/P|B\/P|K\/P|®/g, '')
        .replace(/[\.\,']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const StatCard = ({ title, value, note, children, icon: Icon }: { title: string, value: string, note?: string, children?: React.ReactNode, icon: React.ElementType }) => (
    <Card className="bg-card/80 backdrop-blur-sm border border-white/10 shadow-lg">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className="text-2xl font-bold">{value}</div>
            </div>
             <div className="p-2 bg-yellow-500/20 rounded-full">
                <Icon className="h-5 w-5 text-yellow-500" />
            </div>
        </CardHeader>
        <CardContent>
            {note && <p className="text-xs text-muted-foreground">{note}</p>}
             {children}
        </CardContent>
    </Card>
);

const AppSectionCard = ({ item }: { item: { name: string; href: string; icon: React.ElementType } }) => {
    const router = useRouter();
    const { name, href, icon: Icon } = item;
    
    return (
        <motion.div
            whileHover={{ scale: 1.05, zIndex: 10, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer text-center group"
            onClick={() => router.push(href)}
        >
            <div className="p-1 rounded-lg">
                <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary-foreground transition-colors mt-1">{name}</span>
        </motion.div>
    );
}

export default function DashboardPage() {
  const router = useRouter();
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allBikris, setAllBikris] = useState<Bikri[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function fetchData() {
        if (typeof window === 'undefined') return;
        setIsLoading(true);

        const invoices: Invoice[] = [];
        const bikris: Bikri[] = [];

        for(let i=0; i<localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('invoice-')) {
                invoices.push(JSON.parse(localStorage.getItem(key)!));
            }
             if (key?.startsWith('bikri-')) {
                bikris.push(JSON.parse(localStorage.getItem(key)!));
            }
        }
        setAllInvoices(invoices);
        setAllBikris(bikris);
        setIsLoading(false);
    }
    fetchData();
  }, []);

  const stats = useMemo(() => {
    if (isLoading) return null;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let totalSaleValueToday = 0;
    let todayPatti = 0;
    let todayDabba = 0;
    let monthlyTotalSales = 0;
    let monthlyTotalExpenses = 0;
    let yearGrossSales = 0;
    let yearTotalExpenses = 0;
    let yearNetSales = 0;
    let yearPattiSold = 0;
    let yearDabbaSold = 0;

    allInvoices.forEach(sale => {
        const saleDate = new Date(sale.date);
        const saleYear = saleDate.getFullYear();
        const saleMonth = saleDate.getMonth();

        if (sale.date === todayStr) {
            totalSaleValueToday += sale.totals.netSale || 0;
            todayPatti += sale.totals.pattiQty || 0;
            todayDabba += sale.totals.dabbaQty || 0;
        }

        if (saleYear === currentYear) {
            yearGrossSales += sale.totals.grossSale || 0;
            yearTotalExpenses += sale.totals.totalExpenses || 0;
            yearNetSales += sale.totals.netSale || 0;
            yearPattiSold += sale.totals.pattiQty || 0;
            yearDabbaSold += sale.totals.dabbaQty || 0;

             if (saleMonth === currentMonth) {
                monthlyTotalSales += sale.totals.netSale || 0;
                monthlyTotalExpenses += sale.totals.totalExpenses || 0;
            }
        }
    });

    const yearNugsSold = yearPattiSold + yearDabbaSold;

    const { pattiOutside, dabbaOutside, nugsOutside } = allBikris.reduce((acc, bikri) => {
        if(new Date(bikri.date).getFullYear() === currentYear) {
            bikri.purchaseEntries?.forEach(entry => {
                if (entry.type === 'Patti') acc.pattiOutside += entry.qty;
                if (entry.type === 'Dabba') acc.dabbaOutside += entry.qty;
            });
        }
        return acc;
    }, { pattiOutside: 0, dabbaOutside: 0, nugsOutside: 0});

    
    return {
        totalSaleValueToday,
        todayPatti,
        todayDabba,
        monthSales: monthlyTotalSales,
        monthExpenses: monthlyTotalExpenses,
        yearGrossSales,
        yearTotalExpenses,
        yearNetSales,
        yearPattiSold,
        yearDabbaSold,
        yearNugsSold,
        yearPattiSentOutside: pattiOutside,
        yearDabbaSentOutside: dabbaOutside,
        yearNugsSentOutside: pattiOutside + dabbaOutside
    };
  }, [allInvoices, allBikris, isLoading]);
  
  const growerProfits = useMemo(() => {
    if (isLoading) return [];
    const profitsByGrower: { [canonicalName: string]: { name: string, profit: number } } = {};
    const canonicalNameMap = new Map<string, string>();
    const currentYear = new Date().getFullYear();

    allInvoices.forEach(sale => {
         if (sale.customerName) {
            const normalized = normalizeName(sale.customerName);
            if (!canonicalNameMap.has(normalized)) {
                canonicalNameMap.set(normalized, sale.customerName);
            }
        }
    });

    allInvoices.forEach(sale => {
        const saleYear = new Date(sale.date).getFullYear();
        if (saleYear === currentYear && sale.customerName && sale.totals.netSale) {
            const normalized = normalizeName(sale.customerName);
            const canonicalName = canonicalNameMap.get(normalized)!;

            if (!profitsByGrower[canonicalName]) {
                profitsByGrower[canonicalName] = { name: canonicalName, profit: 0 };
            }
            profitsByGrower[canonicalName].profit += sale.totals.netSale;
        }
    });

    return Object.values(profitsByGrower).sort((a, b) => b.profit - a.profit);
  }, [allInvoices, isLoading]);


  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-screen bg-background text-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-4">Loading Dashboard...</p>
        </div>
    )
  }

  const { dashboardHeader } = placeholderImages;
  
  const appSections = sidebarSections.flatMap(s => s.items);

  return (
    <div className="space-y-8">
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative h-48 rounded-xl overflow-hidden flex flex-col justify-center items-center text-center p-4"
        >
            <Image 
                src={dashboardHeader.src}
                alt={dashboardHeader.alt}
                fill
                style={{objectFit: 'cover'}}
                className="opacity-20"
                data-ai-hint={dashboardHeader.hint}
                priority
            />
            <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-bold text-white shadow-lg">Welcome to F.Co</h1>
                <p className="text-lg text-gray-300/80 shadow-md mt-2">Your complete business management solution.</p>
            </div>
            <div className="absolute bottom-4 w-full flex justify-center">
                 <div className="bg-black/30 backdrop-blur-md p-2 rounded-full flex gap-4">
                    <Button variant="secondary" size="sm" className="rounded-full gap-2"><Briefcase className="h-4 w-4"/> Fruit Business</Button>
                    <Button variant="ghost" size="sm" className="rounded-full gap-2"><Box className="h-4 w-4"/> Accessories</Button>
                    <Button variant="ghost" size="sm" className="rounded-full gap-2"><Archive className="h-4 w-4"/> Inventory</Button>
                </div>
            </div>
        </motion.div>
        
        <div className="space-y-4">
             <h2 className="text-xl font-semibold tracking-wider text-muted-foreground">APP SECTIONS</h2>
             <Card className="p-4 bg-card/80 backdrop-blur-sm border-white/10">
                 <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-6">
                    {appSections.map((item) => (
                        <AppSectionCard key={item.name} item={item} />
                    ))}
                 </div>
            </Card>
        </div>

         <div className="space-y-4">
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                <StatCard title="Today's Sales (Net)" value={`₹${stats?.totalSaleValueToday.toLocaleString('en-IN') ?? '0'}`} note={`From ${stats?.todayPatti} Patti / ${stats?.todayDabba} Dabba`} icon={TrendingUp} />
                <StatCard title="This Month's Sales (Net)" value={`₹${stats?.monthSales.toLocaleString('en-IN') ?? '0'}`} note="Current calendar month" icon={Calendar} />
                <StatCard title="This Month's Expenses" value={`₹${stats?.monthExpenses.toLocaleString('en-IN') ?? '0'}`} note="From Watak deductions" icon={TrendingDown} />
                <StatCard title="This Year's Gross Sales" value={`₹${stats?.yearGrossSales.toLocaleString('en-IN') ?? '0'}`} note="Total sale value this year" icon={IndianRupee} />
                <StatCard title="This Year's Net Sales" value={`₹${stats?.yearNetSales.toLocaleString('en-IN') ?? '0'}`} note="After all expenses" icon={IndianRupee} />
                <StatCard title="This Year's Expenses" value={`₹${stats?.yearTotalExpenses.toLocaleString('en-IN') ?? '0'}`} note="All Watak deductions this year" icon={TrendingDown} />
                <StatCard title="Total Patti Sold (This Year)" value={`${stats?.yearPattiSold.toLocaleString('en-IN') ?? '0'}`} note="Local sales volume" icon={Box}/>
                <StatCard title="Total Dabba Sold (This Year)" value={`${stats?.yearDabbaSold.toLocaleString('en-IN') ?? '0'}`} note="Local sales volume" icon={Box}/>
                <StatCard title="Total Nugs Sold (This Year)" value={`${stats?.yearNugsSold.toLocaleString('en-IN') ?? '0'}`} note="Patti + Dabba (Local)" icon={Archive}/>
                <StatCard title="Total Patti Sent Outside (Year)" value={`${stats?.yearPattiSentOutside.toLocaleString('en-IN') ?? '0'}`} note="Forwarding volume" icon={Globe}/>
                <StatCard title="Total Dabba Sent Outside (Year)" value={`${stats?.yearDabbaSentOutside.toLocaleString('en-IN') ?? '0'}`} note="Forwarding volume" icon={Globe}/>
                <StatCard title="Total Nugs Sent Outside (Year)" value={`${stats?.yearNugsSentOutside.toLocaleString('en-IN') ?? '0'}`} note="Total Forwarding" icon={Globe}/>
             </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold tracking-wider text-muted-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button onClick={() => router.push('/sales')} className="h-16 text-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 hover:text-red-200">
                    <PlusCircle className="mr-2 h-5 w-5" /> Sales Entry
                </Button>
                <Button onClick={() => router.push('/watak-register')} className="h-16 text-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-300 hover:text-blue-200">
                    <FileText className="mr-2 h-5 w-5" /> Watak Register
                </Button>
                <Button onClick={() => router.push('/purchases')} className="h-16 text-lg bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 text-green-300 hover:text-green-200">
                    <ShoppingBasket className="mr-2 h-5 w-5" /> Purchases
                </Button>
                 <Button onClick={() => router.push('/khata')} className="h-16 text-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-300 hover:text-yellow-200">
                    <BookOpen className="mr-2 h-5 w-5" /> Reports
                </Button>
            </div>
        </div>
        
        <Card className="bg-card/80 backdrop-blur-sm border border-white/10">
            <CardHeader>
                <CardTitle>All Growers</CardTitle>
                <CardDescription>This session's growers by net sales.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {growerProfits.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10">
                                <TableHead>Grower</TableHead>
                                <TableHead className="text-right">Net Sales</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {growerProfits.slice(0, 10).map((grower, index) => (
                                <TableRow key={grower.name} className="border-white/10">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <span className={cn("flex items-center justify-center h-8 w-8 rounded-full text-white font-bold", 
                                                index === 0 && "bg-yellow-500",
                                                index === 1 && "bg-gray-400",
                                                index === 2 && "bg-orange-700",
                                                index > 2 && "bg-gray-600"
                                            )}>{index + 1}</span>
                                            <div>
                                              <span className="font-medium text-base">{grower.name}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-lg text-green-400">₹{grower.profit.toLocaleString('en-IN', {minimumFractionDigits: 2})}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                     <p className="text-sm text-muted-foreground text-center py-8">No sales data recorded this year.</p>
                )}
            </CardContent>
        </Card>

    </div>
  );
}
