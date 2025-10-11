
'use client'

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IndianRupee, TrendingUp, Calendar, FileText, ShoppingBasket, BookOpen, Loader2, Package, Box, ClipboardList, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import placeholderImages from '@/app/lib/placeholder-images.json';
import { motion } from 'framer-motion';
import { sidebarSections } from '@/components/Sidebar';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


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
     saleEntries: {
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

const StatCard = ({ title, value, subtitle, icon: Icon }: { title: string, value: string, subtitle: string, icon: React.ElementType }) => (
    <Card className="bg-card/80 backdrop-blur-sm border border-white/10 shadow-lg p-4">
         <div className="flex items-start justify-between">
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-full">
                <Icon className="h-5 w-5 text-yellow-400" />
            </div>
        </div>
    </Card>
);

const AppSectionCard = ({ item }: { item: { name: string; href: string; icon: React.ElementType } }) => {
    const router = useRouter();
    const { name, href, icon: Icon } = item;
    
    return (
        <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer group bg-card/50 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors"
            onClick={() => router.push(href)}
        >
            <div className="neon-glow-container">
                <Icon className="h-7 w-7 text-green-400 neon-glow-icon" />
            </div>
            <span className="text-xs font-medium text-center text-muted-foreground group-hover:text-primary-foreground transition-colors">{name}</span>
        </motion.div>
    );
}

export default function DashboardPage() {
  const router = useRouter();
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allBikris, setAllBikris] = useState<Bikri[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllGrowers, setShowAllGrowers] = useState(false);

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
    let pattiToday = 0;
    let dabbaToday = 0;
    let monthlyTotalSales = 0;
    let monthlyTotalExpenses = 0;
    let yearGrossSales = 0;
    let yearTotalExpenses = 0;
    let yearNetSales = 0;
    let yearPattiSold = 0;
    let yearDabbaSold = 0;
    let yearPattiSentOutside = 0;
    let yearDabbaSentOutside = 0;

    allInvoices.forEach(sale => {
        const saleDate = new Date(sale.date);
        const saleYear = saleDate.getFullYear();
        const saleMonth = saleDate.getMonth();

        if (sale.date === todayStr) {
            totalSaleValueToday += sale.totals.netSale || 0;
            pattiToday += sale.totals.pattiQty || 0;
            dabbaToday += sale.totals.dabbaQty || 0;
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

    allBikris.forEach(bikri => {
        const bikriDate = new Date(bikri.date);
        if (bikriDate.getFullYear() === currentYear) {
            bikri.saleEntries.forEach(entry => {
                if (entry.type === 'Patti') {
                    yearPattiSentOutside += Number(entry.qty) || 0;
                }
                if (entry.type === 'Dabba') {
                    yearDabbaSentOutside += Number(entry.qty) || 0;
                }
            });
        }
    });
    
    return {
        totalSaleValueToday,
        pattiToday,
        dabbaToday,
        monthlyTotalSales,
        monthlyTotalExpenses,
        yearGrossSales,
        yearTotalExpenses,
        yearNetSales,
        yearPattiSold,
        yearDabbaSold,
        yearNugsSold: yearPattiSold + yearDabbaSold,
        yearPattiSentOutside,
        yearDabbaSentOutside,
        yearNugsSentOutside: yearPattiSentOutside + yearDabbaSentOutside,
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
  const growersToShow = showAllGrowers ? growerProfits : growerProfits.slice(0, 10);

  return (
    <div className="space-y-8">
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative h-48 rounded-xl overflow-hidden flex flex-col justify-center items-center text-center p-4 border border-white/10"
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
        
         <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>
                    <h2 className="text-xl font-semibold tracking-wider text-muted-foreground">APP SECTIONS</h2>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 pt-4">
                        {appSections.map((item) => (
                            <AppSectionCard key={item.name} item={item} />
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>

        <div className="space-y-4">
             <h2 className="text-xl font-semibold tracking-wider text-muted-foreground">THIS YEAR'S SUMMARY</h2>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Today's Sales (Net)" value={`₹${stats?.totalSaleValueToday.toLocaleString('en-IN') ?? '0'}`} subtitle={`From ${stats?.pattiToday} Patti / ${stats?.dabbaToday} Dabba`} icon={TrendingUp} />
                <StatCard title="This Month's Sales (Net)" value={`₹${stats?.monthlyTotalSales.toLocaleString('en-IN') ?? '0'}`} subtitle="Current calendar month" icon={Calendar} />
                <StatCard title="This Year's Gross Sales" value={`₹${stats?.yearGrossSales.toLocaleString('en-IN') ?? '0'}`} subtitle="Total sale value this year" icon={IndianRupee} />
                <StatCard title="This Year's Net Sales" value={`₹${stats?.yearNetSales.toLocaleString('en-IN') ?? '0'}`} subtitle="After all expenses" icon={IndianRupee} />
             </div>
        </div>
        
        <Card className="bg-card/80 backdrop-blur-sm border border-white/10">
            <CardHeader>
                <CardTitle>All Growers</CardTitle>
                <CardDescription>This session's growers by net sales.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {growerProfits.length > 0 ? (
                    <>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10">
                                <TableHead>Grower</TableHead>
                                <TableHead className="text-right">Net Sales</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {growersToShow.map((grower, index) => (
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
                    {growerProfits.length > 10 && (
                        <div className="p-4 border-t border-white/10">
                            <Button
                                variant="link"
                                className="text-primary-foreground/80"
                                onClick={() => setShowAllGrowers(!showAllGrowers)}
                            >
                                {showAllGrowers ? 'Show Less' : `Show ${growerProfits.length - 10} More`}
                            </Button>
                        </div>
                    )}
                    </>
                ) : (
                     <p className="text-sm text-muted-foreground text-center py-8">No sales data recorded this year.</p>
                )}
            </CardContent>
        </Card>

    </div>
  );
}
