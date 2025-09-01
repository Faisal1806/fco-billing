
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PackagePlus, PackageMinus, Package, UserCheck, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DailyStats {
  pattiPurchased: number;
  dabbaPurchased: number;
  totalPurchaseValue: number;
  pattiSold: number;
  dabbaSold: number;
  totalSaleValue: number;
  currentPattiStock: number;
  currentDabbaStock: number;
}

type LedgerEntry = {
    party: string;
    balance: number;
}

const StatCard = ({ title, value, icon: Icon, note }: { title: string, value: string, icon: React.ElementType, note?: string }) => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </CardContent>
    </Card>
);

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [ledgerSummary, setLedgerSummary] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This function must run on the client side
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        setIsLoading(false);
        return;
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let pattiPurchasedToday = 0;
    let dabbaPurchasedToday = 0;
    let totalPurchaseValueToday = 0;
    let pattiSoldToday = 0;
    let dabbaSoldToday = 0;
    let totalSaleValueToday = 0;
    let totalPattiPurchased = 0;
    let totalDabbaPurchased = 0;
    let totalPattiSold = 0;
    let totalDabbaSold = 0;

    const ledgers: {[party: string]: number} = {};

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        try {
            if (key.startsWith('invoice-')) {
                const sale = JSON.parse(localStorage.getItem(key)!);
                const isToday = sale.date === todayStr;

                sale.entries.forEach((entry: any) => {
                    const qty = Number(entry.qty) || 0;
                    if (entry.type === 'Patti') {
                        totalPattiSold += qty;
                        if (isToday) pattiSoldToday += qty;
                    } else if (entry.type === 'Dabba') {
                        totalDabbaSold += qty;
                        if (isToday) dabbaSoldToday += qty;
                    }
                });
                
                if (isToday) totalSaleValueToday += sale.totals.netSale || 0;
                
                // Update ledger
                const party = sale.customerName;
                if (!ledgers[party]) ledgers[party] = 0;
                ledgers[party] += sale.totals.netSale || 0;


            } else if (key.startsWith('purchase-')) {
                const purchase = JSON.parse(localStorage.getItem(key)!);
                const isToday = purchase.date === todayStr;

                purchase.entries.forEach((entry: any) => {
                    const qty = Number(entry.qty) || 0;
                     if (entry.type === 'Patti') {
                        totalPattiPurchased += qty;
                        if (isToday) pattiPurchasedToday += qty;
                    } else if (entry.type === 'Dabba') {
                        totalDabbaPurchased += qty;
                        if (isToday) dabbaPurchasedToday += qty;
                    }
                });
                
                if (isToday) totalPurchaseValueToday += purchase.totals.grandTotal || 0;

                // Update ledger
                const party = purchase.growerName;
                if (!ledgers[party]) ledgers[party] = 0;
                ledgers[party] -= purchase.totals.grandTotal || 0;
            }
        } catch (error) {
            console.error(`Failed to parse item from local storage: ${key}`, error);
        }
    }
    
    setStats({
      pattiPurchased: pattiPurchasedToday,
      dabbaPurchased: dabbaPurchasedToday,
      totalPurchaseValue: totalPurchaseValueToday,
      pattiSold: pattiSoldToday,
      dabbaSold: dabbaSoldToday,
      totalSaleValue: totalSaleValueToday,
      currentPattiStock: totalPattiPurchased - totalPattiSold,
      currentDabbaStock: totalDabbaPurchased - totalDabbaSold,
    });

    const summary = Object.entries(ledgers)
        .map(([party, balance]) => ({ party, balance }))
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)) // Sort by absolute balance
        .slice(0, 5); // Take top 5
    setLedgerSummary(summary);

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
    <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             <StatCard 
                title="Total Purchased Today"
                value={`₹${stats.totalPurchaseValue.toLocaleString('en-IN')}`}
                icon={PackagePlus}
                note={`${stats.pattiPurchased} Patti / ${stats.dabbaPurchased} Dabba`}
             />
             <StatCard 
                title="Total Sold Today"
                value={`₹${stats.totalSaleValue.toLocaleString('en-IN')}`}
                icon={PackageMinus}
                 note={`${stats.pattiSold} Patti / ${stats.dabbaSold} Dabba`}
             />
             <StatCard 
                title="Current Stock (Pending)"
                value={`${stats.currentPattiStock + stats.currentDabbaStock} Boxes`}
                icon={Package}
                note={`${stats.currentPattiStock} Patti / ${stats.currentDabbaStock} Dabba`}
             />
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Khata Ledger Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    {ledgerSummary.length > 0 ? (
                        <ul className="space-y-2">
                            {ledgerSummary.map(item => (
                                <li key={item.party} className="flex justify-between items-center text-sm">
                                    <span className="font-medium">{item.party}</span>
                                    <span className={`font-bold ${item.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ₹{Math.abs(item.balance).toLocaleString('en-IN')}
                                        {item.balance >= 0 ? <UserCheck className="h-4 w-4 inline ml-1" /> : <UserX className="h-4 w-4 inline ml-1" />}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-xs text-muted-foreground">No account balances to show.</p>}
                     <button onClick={() => router.push('/khata')} className="text-sm text-primary hover:underline mt-4">
                        View Full Ledger &rarr;
                    </button>
                </CardContent>
            </Card>
        </div>
        <div className="mt-8 text-center text-muted-foreground">
            <p>This summary is automatically calculated based on the sales and purchases you record.</p>
        </div>
    </div>
  );
}
