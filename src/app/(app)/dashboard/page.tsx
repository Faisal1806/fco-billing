
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, PackagePlus, PackageMinus, Package, UserCheck, UserX, Leaf, Box, Apple, FlaskConical, Shapes, Calendar, Star, CreditCard } from 'lucide-react';
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

type AccessoryStats = {
    todaySales: number;
    monthSales: number;
    topItem: string;
    outstandingCredit: number;
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
                    <CardTitle className="text-sm font-medium">Fruit Khata Summary</CardTitle>
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
                        View Full Fruit Ledger &rarr;
                    </button>
                </CardContent>
            </Card>
        </div>
         <div className="mt-8">
            <RateList />
         </div>
    </div>
);

const AccessoriesDashboard = ({ stats, router }: { stats: AccessoryStats | null, router: any }) => (
     <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             <StatCard 
                title="Today's Accessories Sale"
                value={`₹${stats?.todaySales.toLocaleString('en-IN') ?? '0'}`}
                icon={Package}
             />
             <StatCard 
                title="This Month's Accessories Sale"
                value={`₹${stats?.monthSales.toLocaleString('en-IN') ?? '0'}`}
                icon={Calendar}
             />
             <StatCard 
                title="Outstanding Khata (Credit)"
                value={`₹${stats?.outstandingCredit.toLocaleString('en-IN') ?? '0'}`}
                icon={CreditCard}
             />
             <StatCard 
                title="Top Selling Item"
                value={stats?.topItem ?? 'N/A'}
                icon={Star}
             />
        </div>
         <div className="mt-8 text-center">
             <Button onClick={() => router.push('/accessories')}>
                Go to Full Accessories Ledger
            </Button>
         </div>
    </div>
);

const InventoryDashboard = () => (
    <Card>
        <CardHeader>
            <CardTitle>Inventory Analytics</CardTitle>
            <CardDescription>A complete overview of your stock levels and product status.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <Package className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">Inventory Analytics Coming Soon!</h3>
                <p className="mt-1 text-sm">Insights on stock levels, top-selling products, and expiry alerts will be available here.</p>
            </div>
        </CardContent>
    </Card>
);


export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [ledgerSummary, setLedgerSummary] = useState<LedgerEntry[]>([]);
  const [accessoryStats, setAccessoryStats] = useState<AccessoryStats | null>(null);
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

    // Fruit Stats Calculation
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
    
    // Accessory Stats Calculation
    let accessorySalesToday = 0;
    let accessorySalesMonth = 0;
    let accessoryCredit = 0;
    const itemQuantities: {[name: string]: number} = {};


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

                const party = purchase.growerName;
                if (!ledgers[party]) ledgers[party] = 0;
                ledgers[party] -= purchase.totals.grandTotal || 0;

            } else if (key.startsWith('accessory-ledger-')) {
                const entry = JSON.parse(localStorage.getItem(key)!);
                const entryDate = new Date(entry.date);
                const amount = (entry.qty || 0) * (entry.rate || 0);

                if (entry.date === todayStr) {
                    accessorySalesToday += amount;
                }
                if(entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
                    accessorySalesMonth += amount;
                }
                if(entry.paymentMode === 'Khata' || entry.paymentMode === 'Credit') {
                    accessoryCredit += amount;
                }
                if(entry.item){
                    itemQuantities[entry.item] = (itemQuantities[entry.item] || 0) + (entry.qty || 0);
                }
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
    
    const topItem = Object.entries(itemQuantities).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    setAccessoryStats({
        todaySales: accessorySalesToday,
        monthSales: accessorySalesMonth,
        topItem: topItem,
        outstandingCredit: accessoryCredit,
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
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fruit"><Apple className="w-4 h-4 mr-2" />Fruit Business</TabsTrigger>
            <TabsTrigger value="accessories"><Box className="w-4 h-4 mr-2" />Accessories</TabsTrigger>
            <TabsTrigger value="inventory"><Package className="w-4 h-4 mr-2" />Inventory</TabsTrigger>
        </TabsList>
        <TabsContent value="fruit">
            <FruitDashboard stats={stats} ledgerSummary={ledgerSummary} router={router} />
        </TabsContent>
        <TabsContent value="accessories">
            <AccessoriesDashboard stats={accessoryStats} router={router} />
        </TabsContent>
        <TabsContent value="inventory">
            <InventoryDashboard />
        </TabsContent>
    </Tabs>
  );
}
