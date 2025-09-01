
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowUpCircle, ArrowDownCircle, Package, IndianRupee } from 'lucide-react';

interface TodayStats {
  purchasedPatti: number;
  purchasedDabba: number;
  totalPurchased: number;
  totalPurchaseAmount: number;
  soldPatti: number;
  soldDabba: number;
  totalSold: number;
  totalSaleAmount: number;
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
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // We need to ensure this runs only on the client
    const today = new Date().toISOString().split('T')[0];
    let purchasedPatti = 0;
    let purchasedDabba = 0;
    let totalPurchaseAmount = 0;
    let soldPatti = 0;
    let soldDabba = 0;
    let totalSaleAmount = 0;

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        try {
            if (key.startsWith('purchase-')) {
                const purchase = JSON.parse(localStorage.getItem(key)!);
                // Check if the date is today. Note: The date format from input type="date" is YYYY-MM-DD
                if (purchase.date === today) {
                    purchase.entries.forEach((entry: any) => {
                        if(entry.type === 'Patti') purchasedPatti += Number(entry.qty) || 0;
                        if(entry.type === 'Dabba') purchasedDabba += Number(entry.qty) || 0;
                    });
                    totalPurchaseAmount += purchase.totals.grandTotal;
                }
            } else if (key.startsWith('invoice-')) {
                const sale = JSON.parse(localStorage.getItem(key)!);
                 if (sale.date === today) {
                    sale.entries.forEach((entry: any) => {
                        if(entry.type === 'Patti') soldPatti += Number(entry.qty) || 0;
                        if(entry.type === 'Dabba') soldDabba += Number(entry.qty) || 0;
                    });
                    totalSaleAmount += sale.totals.netSale;
                 }
            }
        } catch (error) {
            console.error(`Failed to parse item from local storage: ${key}`, error);
        }
    }
    
    setStats({
        purchasedPatti,
        purchasedDabba,
        totalPurchased: purchasedPatti + purchasedDabba,
        totalPurchaseAmount,
        soldPatti,
        soldDabba,
        totalSold: soldPatti + soldDabba,
        totalSaleAmount
    });

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4 text-muted-foreground">Calculating today's summary...</p>
        </div>
    )
  }

  if (!stats) {
    return <p>Could not load statistics.</p>
  }
  

  return (
    <div>
        <h2 className="text-3xl font-bold tracking-tight mb-6">Today's Summary</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             <StatCard 
                title="Total Purchased"
                value={`${stats.totalPurchased} Boxes`}
                icon={ArrowDownCircle}
                note={`Patti: ${stats.purchasedPatti} | Dabba: ${stats.purchasedDabba}`}
             />
             <StatCard 
                title="Total Sold"
                value={`${stats.totalSold} Boxes`}
                icon={ArrowUpCircle}
                note={`Patti: ${stats.soldPatti} | Dabba: ${stats.soldDabba}`}
             />
              <StatCard 
                title="Total Purchase Value"
                value={`₹${stats.totalPurchaseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={Package}
                note="Amount spent on purchases today."
             />
             <StatCard 
                title="Total Sale Value"
                value={`₹${stats.totalSaleAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={IndianRupee}
                note="Net sale amount from wataks today."
             />
        </div>
        <div className="mt-8 text-center text-muted-foreground">
            <p>This summary is automatically calculated based on the purchases and wataks you record for the current day.</p>
        </div>
    </div>
  );
}
