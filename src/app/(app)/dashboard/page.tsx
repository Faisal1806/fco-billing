
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, IndianRupee, Calendar, FileText, Banknote } from 'lucide-react';

interface DashboardStats {
  todaySale: number;
  monthSale: number;
  outstandingBalance: number;
  todayBillsCount: number;
  todayPurchasesCount: number;
}

const StatCard = ({ title, value, icon: Icon, note }: { title: string, value: string, icon: React.ElementType, note?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </CardContent>
    </Card>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This function must run on the client side
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        setIsLoading(false);
        return;
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let todaySale = 0;
    let monthSale = 0;
    let outstandingBalance = 0;
    let todayBillsCount = 0;
    let todayPurchasesCount = 0;

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        try {
            if (key.startsWith('invoice-')) {
                const sale = JSON.parse(localStorage.getItem(key)!);
                const saleDate = new Date(sale.date);

                // Total outstanding balance from all sales
                outstandingBalance += sale.totals.netSale || 0;

                // Check for this month's sales
                if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
                    monthSale += sale.totals.netSale || 0;
                }

                // Check for today's sales
                if (sale.date === todayStr) {
                    todaySale += sale.totals.netSale || 0;
                    todayBillsCount++;
                }

            } else if (key.startsWith('purchase-')) {
                const purchase = JSON.parse(localStorage.getItem(key)!);
                if (purchase.date === todayStr) {
                    todayPurchasesCount++;
                }
            }
        } catch (error) {
            console.error(`Failed to parse item from local storage: ${key}`, error);
        }
    }
    
    setStats({
      todaySale,
      monthSale,
      outstandingBalance,
      todayBillsCount,
      todayPurchasesCount
    });

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4 text-muted-foreground">Calculating summary...</p>
        </div>
    )
  }

  if (!stats) {
    return <p>Could not load dashboard statistics.</p>
  }
  

  return (
    <div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             <StatCard 
                title="Today's Sale"
                value={`₹${stats.todaySale.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={IndianRupee}
             />
             <StatCard 
                title="This Month's Sale"
                value={`₹${stats.monthSale.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={Calendar}
             />
             <StatCard 
                title="Outstanding Khata"
                value={`₹${stats.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={Banknote}
                note="Total credit/debit balance"
             />
              <StatCard 
                title="Transactions Today"
                value={`${stats.todayBillsCount} Bills / ${stats.todayPurchasesCount} Buys`}
                icon={FileText}
                note="Count of bills & purchases made"
             />
        </div>
        <div className="mt-8 text-center text-muted-foreground">
            <p>This summary is automatically calculated based on the sales and purchases you record.</p>
        </div>
    </div>
  );
}
