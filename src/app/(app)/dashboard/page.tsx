
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, PackagePlus, PackageMinus, Package, UserCheck, UserX, Leaf, Box, Apple } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RateList from '@/components/RateList';

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

const FruitDashboard = ({ stats, ledgerSummary, router }: { stats: DailyStats | null, ledgerSummary: LedgerEntry[], router: any }) => (
    <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             <StatCard 
                title="Total Purchased Today"
                value={`₹${stats?.totalPurchaseValue.toLocaleString('en-IN') ?? '0'}`}
                icon={PackagePlus}
                note={`${stats?.pattiPurchased ?? 0} Patti / ${stats?.dabbaPurchased ?? 0} Dabba`}
             />
             <StatCard 
                title="Total Sold Today"
                value={`₹${stats?.totalSaleValue.toLocaleString('en-IN') ?? '0'}`}
                icon={PackageMinus}
                 note={`${stats?.pattiSold ?? 0} Patti / ${stats?.dabbaSold ?? 0} Dabba`}
             />
             <StatCard 
                title="Current Stock (Pending)"
                value={`${(stats?.currentPattiStock ?? 0) + (stats?.currentDabbaStock ?? 0)} Boxes`}
                icon={Package}
                note={`${stats?.currentPattiStock ?? 0} Patti / ${stats?.currentDabbaStock ?? 0} Dabba`}
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
         <div className="mt-8">
            <RateList />
         </div>
    </div>
);


const PlaceholderTab = ({ title, description }: { title: string, description: string }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center py-12 text-muted-foreground">
                <p>This feature is under construction and will be available soon.</p>
            </div>
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
  
  return (
    <Tabs defaultValue="fruit" className="space-y-4">
        <TabsList>
            <TabsTrigger value="fruit"><Apple className="w-4 h-4 mr-2" />Fruit Business</TabsTrigger>
            <TabsTrigger value="agri"><Leaf className="w-4 h-4 mr-2" />Agri/Fertilizer Business</TabsTrigger>
            <TabsTrigger value="packing"><Box className="w-4 h-4 mr-2" />Packing Materials</TabsTrigger>
        </TabsList>
        <TabsContent value="fruit">
            <FruitDashboard stats={stats} ledgerSummary={ledgerSummary} router={router} />
        </TabsContent>
        <TabsContent value="agri">
            <PlaceholderTab 
                title="Agri/Fertilizer Business Dashboard"
                description="A summary of your fertilizer sales, stock levels, and ledger will be shown here."
            />
        </TabsContent>
        <TabsContent value="packing">
            <PlaceholderTab 
                title="Packing Materials Dashboard"
                description="A summary of your packing material sales (wood, tape, etc.), stock levels, and ledger will be shown here."
            />
        </TabsContent>
    </Tabs>
  );
}
