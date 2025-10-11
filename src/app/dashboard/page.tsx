
'use client'

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IndianRupee, TrendingUp, TrendingDown, Calendar, Hash, BarChart3, FileText, BookOpen, PlusCircle, ShoppingBasket, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import placeholderImages from '@/app/lib/placeholder-images.json';
import { motion } from 'framer-motion';
import { sidebarSections } from '@/components/Sidebar';

interface Invoice {
    id: string;
    sNo: string;
    date: string;
    totals: {
        netSale: number;
        grossSale: number;
        totalExpenses: number;
    };
    customerName: string;
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

const StatCard = ({ title, value, note, children }: { title: string, value: string, note?: string, children?: React.ReactNode }) => (
    <Card className="bg-card/50 backdrop-blur-sm border border-white/10 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
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
            whileHover={{ scale: 1.05, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer"
            onClick={() => router.push(href)}
        >
            <div className="h-full bg-card/50 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 neon-glow-container">
                <Icon className="h-8 w-8 neon-glow-icon" />
                <span className="text-sm font-semibold">{name}</span>
            </div>
        </motion.div>
    );
}


export default function DashboardPage() {
  const router = useRouter();
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function fetchData() {
        if (typeof window === 'undefined') return;
        setIsLoading(true);

        const invoices: Invoice[] = [];
        for(let i=0; i<localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('invoice-')) {
                invoices.push(JSON.parse(localStorage.getItem(key)!));
            }
        }
        setAllInvoices(invoices);
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
    let monthlyTotalSales = 0;
    let yearGrossSales = 0;
    let yearTotalExpenses = 0;
    let yearNetSales = 0;

    allInvoices.forEach(sale => {
        const saleDate = new Date(sale.date);
        const saleYear = saleDate.getFullYear();
        const saleMonth = saleDate.getMonth();

        if (sale.date === todayStr) {
            totalSaleValueToday += sale.totals.netSale || 0;
        }

        if (saleYear === currentYear) {
            yearGrossSales += sale.totals.grossSale || 0;
            yearTotalExpenses += sale.totals.totalExpenses || 0;
            yearNetSales += sale.totals.netSale || 0;

             if (saleMonth === currentMonth) {
                monthlyTotalSales += sale.totals.netSale || 0;
            }
        }
    });
    
    return {
        totalSaleValue: totalSaleValueToday,
        monthSales: monthlyTotalSales,
        yearGrossSales: yearGrossSales,
        yearTotalExpenses: yearTotalExpenses,
        yearNetSales: yearNetSales,
    };
  }, [allInvoices, isLoading]);
  
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
            <p className="ml-4">Calculating summary...</p>
        </div>
    )
  }

  const { dashboardHeader } = placeholderImages;
  
  const appSections = sidebarSections.flatMap(s => s.items).filter(item => item.name !== "Home");
  
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
        </motion.div>
        
        <div className="space-y-4">
             <h2 className="text-xl font-semibold tracking-wider">App Sections</h2>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {appSections.map((item) => (
                    <AppSectionCard key={item.name} item={item} />
                ))}
             </div>
        </div>

         <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-wider">This Year's Summary</h2>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Today's Sales (Net)" value={`₹${stats?.totalSaleValue.toLocaleString('en-IN') ?? '0'}`} />
                <StatCard title="This Month's Sales (Net)" value={`₹${stats?.monthSales.toLocaleString('en-IN') ?? '0'}`} />
                <StatCard title="This Year's Gross Sales" value={`₹${stats?.yearGrossSales.toLocaleString('en-IN') ?? '0'}`} />
                <StatCard title="This Year's Net Sales" value={`₹${stats?.yearNetSales.toLocaleString('en-IN') ?? '0'}`} />
             </div>
             <StatCard title="This Year's Expenses" value={`₹${stats?.yearTotalExpenses.toLocaleString('en-IN') ?? '0'}`} note="All Watak deductions this year" />
        </div>

        <div>
            <h2 className="text-xl font-semibold tracking-wider mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => router.push('/sales')} className="h-16 text-lg bg-red-600/80 hover:bg-red-600 border border-red-500/50">
                    <PlusCircle className="mr-2 h-5 w-5" /> Sales Entry
                </Button>
                <Button onClick={() => router.push('/watak-register')} className="h-16 text-lg bg-blue-600/80 hover:bg-blue-600 border border-blue-500/50">
                    <FileText className="mr-2 h-5 w-5" /> Watak Register
                </Button>
                <Button onClick={() => router.push('/purchases')} className="h-16 text-lg bg-green-600/80 hover:bg-green-600 border border-green-500/50">
                    <ShoppingBasket className="mr-2 h-5 w-5" /> Purchases
                </Button>
            </div>
        </div>
        
        <div>
            <h2 className="text-xl font-semibold tracking-wider mb-4">All Growers</h2>
             <Card className="bg-card/50 backdrop-blur-sm border border-white/10">
                <CardContent className="p-0">
                    {growerProfits.length > 0 ? (
                        <Table>
                            <TableBody>
                                {growerProfits.slice(0, 10).map((grower, index) => (
                                    <TableRow key={grower.name} className="border-white/10">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <span className={`flex items-center justify-center h-8 w-8 rounded-full ${index < 3 ? 'bg-yellow-500/80' : 'bg-gray-500/80'} text-white font-bold`}>{index + 1}</span>
                                                <div>
                                                  <span className="font-medium text-base">{grower.name}</span>
                                                  <p className="text-xs text-muted-foreground">Net Sales</p>
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
    </div>
  );
}

    