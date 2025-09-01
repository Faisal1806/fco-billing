
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowUpCircle, ArrowDownCircle, Package, IndianRupee, Warehouse } from 'lucide-react';

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

interface StockStats {
    currentPatti: number;
    currentDabba: number;
    totalStock: number;
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
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [stockStats, setStockStats] = useState<StockStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // We need to ensure this runs only on the client
    const today = new Date().toISOString().split('T')[0];
    
    // For Today's Summary
    let purchasedPattiToday = 0;
    let purchasedDabbaToday = 0;
    let totalPurchaseAmountToday = 0;
    let soldPattiToday = 0;
    let soldDabbaToday = 0;
    let totalSaleAmountToday = 0;
    
    // For Overall Stock
    let totalPurchasedPatti = 0;
    let totalPurchasedDabba = 0;
    let totalSoldPatti = 0;
    let totalSoldDabba = 0;


    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        try {
            if (key.startsWith('purchase-')) {
                const purchase = JSON.parse(localStorage.getItem(key)!);
                
                // Overall stock calculation
                purchase.entries.forEach((entry: any) => {
                    if(entry.type === 'Patti') totalPurchasedPatti += Number(entry.qty) || 0;
                    if(entry.type === 'Dabba') totalPurchasedDabba += Number(entry.qty) || 0;
                });
                
                // Today's summary calculation
                if (purchase.date === today) {
                    purchase.entries.forEach((entry: any) => {
                        if(entry.type === 'Patti') purchasedPattiToday += Number(entry.qty) || 0;
                        if(entry.type === 'Dabba') purchasedDabbaToday += Number(entry.qty) || 0;
                    });
                    totalPurchaseAmountToday += purchase.totals.grandTotal;
                }

            } else if (key.startsWith('invoice-')) {
                const sale = JSON.parse(localStorage.getItem(key)!);

                // Overall stock calculation
                 sale.entries.forEach((entry: any) => {
                    if(entry.type === 'Patti') totalSoldPatti += Number(entry.qty) || 0;
                    if(entry.type === 'Dabba') totalSoldDabba += Number(entry.qty) || 0;
                });

                 // Today's summary calculation
                 if (sale.date === today) {
                    sale.entries.forEach((entry: any) => {
                        if(entry.type === 'Patti') soldPattiToday += Number(entry.qty) || 0;
                        if(entry.type === 'Dabba') soldDabbaToday += Number(entry.qty) || 0;
                    });
                    totalSaleAmountToday += sale.totals.netSale;
                 }
            }
        } catch (error) {
            console.error(`Failed to parse item from local storage: ${key}`, error);
        }
    }
    
    setTodayStats({
        purchasedPatti: purchasedPattiToday,
        purchasedDabba: purchasedDabbaToday,
        totalPurchased: purchasedPattiToday + purchasedDabbaToday,
        totalPurchaseAmount: totalPurchaseAmountToday,
        soldPatti: soldPattiToday,
        soldDabba: soldDabbaToday,
        totalSold: soldPattiToday + soldDabbaToday,
        totalSaleAmount: totalSaleAmountToday
    });

    setStockStats({
        currentPatti: totalPurchasedPatti - totalSoldPatti,
        currentDabba: totalPurchasedDabba - totalSoldDabba,
        totalStock: (totalPurchasedPatti - totalSoldPatti) + (totalPurchasedDabba - totalSoldDabba)
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

  if (!todayStats || !stockStats) {
    return <p>Could not load statistics.</p>
  }
  

  return (
    <div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <StatCard 
                title="Current Stock (Pending)"
                value={`${stockStats.totalStock} Boxes`}
                icon={Warehouse}
                note={`Patti: ${stockStats.currentPatti} | Dabba: ${stockStats.currentDabba}`}
             />
             <StatCard 
                title="Total Purchased Value"
                value={`₹${todayStats.totalPurchaseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={Package}
                note={`Patti: ${todayStats.purchasedPatti} | Dabba: ${todayStats.purchasedDabba}`}
             />
             <StatCard 
                title="Total Sale Value"
                value={`₹${todayStats.totalSaleAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={IndianRupee}
                note={`Patti: ${todayStats.soldPatti} | Dabba: ${todayStats.soldDabba}`}
             />
        </div>
         <div className="mt-8">
            <h2 className="text-2xl font-bold tracking-tight mb-4">Today's Summary</h2>
            <div className="grid gap-6 md:grid-cols-2">
                 <StatCard 
                    title="Purchased Today"
                    value={`${todayStats.totalPurchased} Boxes`}
                    icon={ArrowDownCircle}
                    note={`Patti: ${todayStats.purchasedPatti} | Dabba: ${todayStats.purchasedDabba}`}
                 />
                 <StatCard 
                    title="Sold Today"
                    value={`${todayStats.totalSold} Boxes`}
                    icon={ArrowUpCircle}
                    note={`Patti: ${todayStats.soldPatti} | Dabba: ${todayStats.soldDabba}`}
                 />
            </div>
        </div>
        <div className="mt-8 text-center text-muted-foreground">
            <p>This summary is automatically calculated based on the purchases and wataks you record for the current day.</p>
        </div>
    </div>
  );
}
