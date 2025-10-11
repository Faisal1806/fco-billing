
'use client'

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IndianRupee, TrendingUp, TrendingDown, Calendar, Hash, BarChart3, FileText, BookOpen, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { sidebarSections } from '@/components/Sidebar';
import Link from 'next/link';

interface DailyStats {
  totalSaleValue: number;
}

interface YearlyStats {
    monthSales: number;
    yearGrossSales: number;
    yearTotalExpenses: number;
}

type GrowerProfit = {
    name: string;
    profit: number;
}

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

const StatCard = ({ title, value, note, icon: Icon, iconBg }: { title: string, value: string, note: string, icon: React.ElementType, iconBg: string }) => (
    <Card className="bg-gray-800/50 border-gray-700/60 shadow-lg">
        <CardContent className="p-4 flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-400">{title}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{note}</p>
            </div>
            <div className={`p-3 rounded-full ${iconBg}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
        </CardContent>
    </Card>
);

const NavLink = ({ href, icon: Icon, name }: { href: string, icon: React.ElementType, name: string }) => (
  <Link href={href} passHref>
    <div className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-800/40 rounded-lg hover:bg-gray-700/60 transition-colors duration-200 neon-glow-container">
      <Icon className="h-8 w-8 neon-glow-icon" />
      <span className="text-xs text-center text-gray-300">{name}</span>
    </div>
  </Link>
);


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
    const todayStr = new Date().toISOString().split('T')[0];
    let totalSaleValueToday = 0;

    allInvoices.forEach(sale => {
        if (sale.date === todayStr) {
            totalSaleValueToday += sale.totals.netSale || 0;
        }
    });

    return { totalSaleValue: totalSaleValueToday };
  }, [allInvoices, isLoading]);

  const yearlyStats = useMemo(() => {
    if (isLoading) return null;
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let monthlyTotalSales = 0;
    let yearGrossSales = 0;
    let yearTotalExpenses = 0;

    allInvoices.forEach(sale => {
        const saleDate = new Date(sale.date);
        const saleYear = saleDate.getFullYear();
        const saleMonth = saleDate.getMonth();

        if (saleYear === currentYear) {
            yearGrossSales += sale.totals.grossSale || 0;
            yearTotalExpenses += sale.totals.totalExpenses || 0;

             if (saleMonth === currentMonth) {
                monthlyTotalSales += sale.totals.netSale || 0;
            }
        }
    });
    
    return {
        monthSales: monthlyTotalSales,
        yearGrossSales: yearGrossSales,
        yearTotalExpenses: yearTotalExpenses,
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

  const allNavLinks = sidebarSections.flatMap(section => section.items).filter(item => item.name !== "Dashboard");
  
  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="relative h-48 rounded-xl overflow-hidden flex flex-col justify-center items-center text-center p-4">
            <Image 
                src="https://picsum.photos/seed/apple-orb/1200/400"
                alt="Abstract green background"
                fill
                style={{objectFit: 'cover'}}
                className="opacity-20"
                data-ai-hint="green apple"
            />
            <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-bold text-white shadow-lg">Welcome to F.Co</h1>
                <p className="text-lg text-gray-300/80 shadow-md mt-2">Your complete business management solution.</p>
            </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="fruit" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border-gray-700/60 rounded-xl">
              <TabsTrigger value="fruit" className="data-[state=active]:bg-green-600/80 data-[state=active]:text-white">Fruit Business</TabsTrigger>
              <TabsTrigger value="accessories">Accessories</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>
          
          <TabsContent value="fruit" className="mt-6 space-y-8">
            {/* App Sections */}
            <div>
                <h2 className="text-sm font-semibold uppercase text-gray-500 tracking-wider mb-4">App Sections</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {allNavLinks.slice(0, 12).map(item => <NavLink key={item.name} {...item} />)}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard title="Today's Sales (Net)" value={`₹${stats?.totalSaleValue.toLocaleString('en-IN') ?? '0'}`} note="Compare to last month" icon={Hash} iconBg="bg-orange-500/80" />
                <StatCard title="This Month's Sales (Net)" value={`₹${yearlyStats?.monthSales.toLocaleString('en-IN') ?? '0'}`} note="Current calendar month" icon={IndianRupee} iconBg="bg-yellow-500/80" />
                <StatCard title="This Year's Gross Sales" value={`₹${yearlyStats?.yearGrossSales.toLocaleString('en-IN') ?? '0'}`} note="Total sales value this year" icon={BarChart3} iconBg="bg-green-500/80" />
                <StatCard title="This Year's Expenses" value={`₹${yearlyStats?.yearTotalExpenses.toLocaleString('en-IN') ?? '0'}`} note="All Watak deductions this year" icon={TrendingDown} iconBg="bg-red-500/80" />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-sm font-semibold uppercase text-gray-500 tracking-wider mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button onClick={() => router.push('/sales')} className="h-16 text-lg bg-red-600/80 hover:bg-red-600 border border-red-500/50">
                        <PlusCircle className="mr-2 h-5 w-5" /> Sales Entry
                    </Button>
                    <Button onClick={() => router.push('/watak-register')} className="h-16 text-lg bg-blue-600/80 hover:bg-blue-600 border border-blue-500/50">
                        <FileText className="mr-2 h-5 w-5" /> Watak Register
                    </Button>
                    <Button onClick={() => router.push('/rates')} className="h-16 text-lg bg-yellow-600/80 hover:bg-yellow-600 border border-yellow-500/50">
                        <TrendingUp className="mr-2 h-5 w-5" /> Reports
                    </Button>
                </div>
            </div>

            {/* All Growers */}
             <div>
                <h2 className="text-sm font-semibold uppercase text-gray-500 tracking-wider mb-4">All Growers</h2>
                 <Card className="bg-gray-800/50 border-gray-700/60 shadow-lg">
                    <CardContent className="p-0">
                        {growerProfits.length > 0 ? (
                            <Table>
                                <TableBody>
                                    {growerProfits.slice(0, 5).map((grower, index) => (
                                        <TableRow key={grower.name} className="border-gray-700/60">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-500/80 text-white font-bold">{index + 1}</span>
                                                    <span className="font-medium text-base">{grower.name}</span>
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
          </TabsContent>
        </Tabs>
    </div>
  );
}
