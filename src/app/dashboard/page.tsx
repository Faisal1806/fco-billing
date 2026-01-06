
'use client'

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IndianRupee, TrendingUp, Calendar, ShoppingBasket, Banknote, Scale } from 'lucide-react';
import { useRouter } from 'next/navigation';
import placeholderImages from '@/app/lib/placeholder-images.json';
import { motion } from 'framer-motion';
import { sidebarSections } from '@/components/Sidebar';
import { Loader2 } from 'lucide-react';


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
    entries: {
        isForwarded?: boolean;
        qty: number;
        type: 'Patti' | 'Dabba';
    }[];
    customerName: string;
}

interface Purchase {
    id: string;
    date: string;
    totals: {
        grandTotal: number;
    }
}

interface Advance {
    id: string;
    date: string;
    type: 'Advance Given' | 'Repayment Received' | 'Discount';
    amount: number;
}


const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }: { title: string, value: string, subtitle: string, icon: React.ElementType, colorClass: string }) => (
     <motion.div
        whileHover={{ y: -10, scale: 1.05, rotateX: 10, rotateY: -5 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ perspective: 800, transformStyle: 'preserve-3d' }}
    >
        <Card className="bg-card/80 backdrop-blur-sm border border-white/10 shadow-lg hover:shadow-2xl h-full p-4 transition-all duration-300">
             <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className={`h-6 w-6 ${colorClass}`} />
                </div>
            </div>
        </Card>
    </motion.div>
);

const NavCard = ({ title, icon: Icon, href }: { title: string, icon: React.ElementType, href: string }) => {
    const router = useRouter();
    return (
        <motion.div
            whileHover={{ y: -10, scale: 1.05, rotateX: 10, rotateY: -5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ perspective: 800, transformStyle: 'preserve-3d' }}
            onClick={() => router.push(href)}
            className="cursor-pointer"
        >
            <Card className="bg-card/70 backdrop-blur-sm border border-white/10 shadow-lg hover:shadow-2xl h-full p-4 transition-all duration-300 flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-primary/10 rounded-full mb-2">
                     <Icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <p className="text-sm font-semibold text-primary-foreground">{title}</p>
            </Card>
        </motion.div>
    )
};


export default function DashboardPage() {
  const router = useRouter();
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
  const [allAdvances, setAllAdvances] = useState<Advance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function fetchData() {
        if (typeof window === 'undefined') return;
        setIsLoading(true);

        const data: { [key: string]: any[] } = {
            invoices: [],
            purchases: [],
            advances: [],
        };

        const prefixes: { [key: string]: keyof typeof data } = {
            'invoice-': 'invoices',
            'purchase-': 'purchases',
            'advance-': 'advances',
        };

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            const matchingPrefix = Object.keys(prefixes).find(p => key.startsWith(p));
            if (matchingPrefix) {
                try {
                    const item = JSON.parse(localStorage.getItem(key)!);
                    data[prefixes[matchingPrefix]].push(item);
                } catch (error) {
                    console.error(`Error parsing item from localStorage with key: ${key}`, error);
                }
            }
        }
        
        setAllInvoices(data.invoices);
        setAllPurchases(data.purchases);
        setAllAdvances(data.advances);
        
        setIsLoading(false);
    }
    fetchData();
  }, []);
  
  
  const stats = useMemo(() => {
    if (isLoading) return null;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonth = today.getMonth();
    const currentYear = new Date().getFullYear();
    
    let totalSaleValueToday = 0;
    let monthlyTotalSales = 0;
    let yearNetSales = 0;
    let yearTotalPurchases = 0;
    let outstandingAdvances = 0;

    allInvoices.forEach(sale => {
        if (!sale.totals) return; 
        const saleDate = new Date(sale.date);
        const saleYear = saleDate.getFullYear();
        const saleMonth = saleDate.getMonth();
        const netSale = sale.totals.netSale || 0;
        
        if (sale.date === todayStr) {
            totalSaleValueToday += netSale;
        }
        
        if (saleYear === currentYear) {
            if (saleMonth === currentMonth) {
                monthlyTotalSales += netSale;
            }
            yearNetSales += netSale;
        }
    });

    allPurchases.forEach(purchase => {
        const purchaseDate = new Date(purchase.date);
        if (purchaseDate.getFullYear() === currentYear) {
            yearTotalPurchases += purchase.totals.grandTotal || 0;
        }
    });

    allAdvances.forEach(advance => {
        const advanceAmount = advance.amount || 0;
        if(advance.type === 'Advance Given') {
            outstandingAdvances += advanceAmount;
        } else if (advance.type === 'Repayment Received' || advance.type === 'Discount') {
            outstandingAdvances -= advanceAmount;
        }
    });
    
    return {
        totalSaleValueToday,
        monthlyTotalSales,
        yearNetSales,
        yearTotalPurchases,
        outstandingAdvances,
    };
  }, [allInvoices, allPurchases, allAdvances, isLoading]);
  

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-screen bg-background text-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-4">Loading Dashboard...</p>
        </div>
    )
  }

  const { dashboardHeader } = placeholderImages;

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
                <h1 className="text-4xl md:text-5xl font-bold text-white shadow-lg">Welcome to F.Co App</h1>
                <p className="text-lg text-gray-300/80 shadow-md mt-2">Your complete business management solution.</p>
            </div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <StatCard 
                title="Today's Sales (Net)" 
                value={`₹${Math.round(stats?.totalSaleValueToday ?? 0).toLocaleString('en-IN')}`} 
                subtitle="Net sales from today's invoices" 
                icon={TrendingUp}
                colorClass="text-green-400"
            />
             <StatCard 
                title="This Month's Sales (Net)" 
                value={`₹${Math.round(stats?.monthlyTotalSales ?? 0).toLocaleString('en-IN')}`} 
                subtitle="Current calendar month" 
                icon={Calendar}
                colorClass="text-blue-400"
            />
             <StatCard 
                title="This Year's Sales (Net)" 
                value={`₹${Math.round(stats?.yearNetSales ?? 0).toLocaleString('en-IN')}`} 
                subtitle="Total net profit this year" 
                icon={IndianRupee}
                colorClass="text-yellow-400"
            />
            <StatCard 
                title="This Year's Purchases" 
                value={`₹${Math.round(stats?.yearTotalPurchases ?? 0).toLocaleString('en-IN')}`} 
                subtitle="Total purchases from growers" 
                icon={ShoppingBasket}
                colorClass="text-orange-400"
            />
             <StatCard 
                title="Outstanding Advances" 
                value={`₹${Math.round(stats?.outstandingAdvances ?? 0).toLocaleString('en-IN')}`} 
                subtitle="Net balance of advances given" 
                icon={Banknote}
                colorClass="text-red-400"
            />
             <StatCard 
                title="Yearly Profit (Est.)" 
                value={`₹${Math.round((stats?.yearNetSales ?? 0) - (stats?.yearTotalPurchases ?? 0)).toLocaleString('en-IN')}`} 
                subtitle="Net Sales - Purchases" 
                icon={Scale}
                colorClass="text-purple-400"
            />
        </div>
        
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
             <Card className="bg-card/80 backdrop-blur-sm border border-white/10">
                <CardHeader>
                    <CardTitle>App Sections</CardTitle>
                    <CardDescription>Jump to any section of the application.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {sidebarSections.flatMap(section => section.items).map((item) => (
                        <NavCard key={item.name} title={item.name} icon={item.icon} href={item.href} />
                    ))}
                </CardContent>
            </Card>
        </motion.div>
        
        <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.3 }}
        >
            <Card className="bg-card/80 backdrop-blur-sm border border-white/10">
                <CardHeader>
                    <CardTitle>Coming Soon: Graphs &amp; Charts</CardTitle>
                    <CardDescription>Visual representations of your business data will appear here.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Advanced data visualization is under development.</p>
                </CardContent>
            </Card>
        </motion.div>
    </div>
  );
}
