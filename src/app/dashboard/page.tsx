
'use client'

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IndianRupee, TrendingUp, TrendingDown, Calendar, Hash, BarChart3, FileText, BookOpen, PlusCircle, ShoppingBasket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import placeholderImages from '@/app/lib/placeholder-images.json';

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

const StatCard = ({ title, value, note }: { title: string, value: string, note: string }) => (
    <div className="bg-gray-800/20 p-4 rounded-lg">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{note}</p>
    </div>
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

    // First pass: find the most complete name for each normalized name
    allInvoices.forEach(sale => {
         if (sale.customerName) {
            const normalized = normalizeName(sale.customerName);
            const currentCanonical = canonicalNameMap.get(normalized);
            // Prefer the longer, more detailed name as the canonical one
            if (!currentCanonical || sale.customerName.length > currentCanonical.length) {
                canonicalNameMap.set(normalized, sale.customerName);
            }
        }
    });

    // Second pass: aggregate profits using the canonical names
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
  
  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="relative h-48 rounded-xl overflow-hidden flex flex-col justify-center items-center text-center p-4">
            <Image 
                src={dashboardHeader.src}
                alt={dashboardHeader.alt}
                fill
                style={{objectFit: 'cover'}}
                className="opacity-20"
                data-ai-hint={dashboardHeader.hint}
            />
            <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-bold text-white shadow-lg">Welcome to F.Co</h1>
                <p className="text-lg text-gray-300/80 shadow-md mt-2">Your complete business management solution.</p>
            </div>
        </div>
        
        {/* Main Content Area */}
        <div className="space-y-8">
            {/* Stats */}
            <div className="space-y-4">
                <StatCard title="Today's Sales (Net)" value={`₹${stats?.totalSaleValue.toLocaleString('en-IN') ?? '0'}`} note="Compare to last month" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatCard title="This Month's Sales (Net)" value={`₹${stats?.monthSales.toLocaleString('en-IN') ?? '0'}`} note="Current calendar month" />
                    <StatCard title="This Year's Gross Sales" value={`₹${stats?.yearGrossSales.toLocaleString('en-IN') ?? '0'}`} note="Total sales value this year" />
                    <StatCard title="This Year's Expenses" value={`₹${stats?.yearTotalExpenses.toLocaleString('en-IN') ?? '0'}`} note="All Watak deductions this year" />
                    <StatCard title="This Year's Net Sales" value={`₹${stats?.yearNetSales.toLocaleString('en-IN') ?? '0'}`} note="After all expenses" />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button onClick={() => router.push('/sales')} className="h-20 text-lg bg-red-600/80 hover:bg-red-600 border border-red-500/50 flex-col gap-1">
                    <PlusCircle className="h-6 w-6" /> Sales Entry
                </Button>
                <Button onClick={() => router.push('/watak-register')} className="h-20 text-lg bg-blue-600/80 hover:bg-blue-600 border border-blue-500/50 flex-col gap-1">
                    <FileText className="h-6 w-6" /> Watak Register
                </Button>
                 <Button onClick={() => router.push('/purchases')} className="h-20 text-lg bg-green-600/80 hover:bg-green-600 border border-green-500/50 flex-col gap-1">
                    <ShoppingBasket className="h-6 w-6" /> Purchases
                </Button>
                <Button onClick={() => router.push('/rates')} className="h-20 text-lg bg-yellow-600/80 hover:bg-yellow-600 border border-yellow-500/50 flex-col gap-1">
                    <BarChart3 className="h-6 w-6" /> Reports
                </Button>
            </div>

            {/* All Growers */}
             <div>
                <h2 className="text-xl font-semibold text-gray-300 tracking-wider mb-4">All Growers</h2>
                 <Card className="bg-gray-800/50 border-gray-700/60 shadow-lg">
                    <CardContent className="p-0">
                        {growerProfits.length > 0 ? (
                            <Table>
                                <TableBody>
                                    {growerProfits.slice(0, 10).map((grower, index) => (
                                        <TableRow key={grower.name} className="border-gray-700/60">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-500/80 text-white font-bold">{index + 1}</span>
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
    </div>
  );
}
