
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, PackagePlus, PackageMinus, Package, UserCheck, UserX, Leaf, Box, Apple, FlaskConical, Shapes, Calendar, Star, CreditCard, Database, TrendingUp, TrendingDown, IndianRupee, HandCoins } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RateList from '@/components/RateList';
import { Button } from '@/components/ui/button';
import { getRealtimeDb } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';


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

interface YearlyStats {
    totalSales: number;
    totalExpenses: number;
    netProfit: number;
    sentSales: number;
    monthSales: number;
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

const StatCard = ({ title, value, icon: Icon, note, color }: { title: string, value: string, icon: React.ElementType, note?: string, color?: string }) => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={`h-5 w-5 ${color || 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </CardContent>
    </Card>
);

const RealtimeDatabaseCard = () => {
    const [message, setMessage] = useState<string | null>('Connecting to database...');

    useEffect(() => {
        const db = getRealtimeDb();
        const messageRef = ref(db, 'message');

        const unsubscribe = onValue(messageRef, (snapshot) => {
            const data = snapshot.val();
            if (data && data.text) {
                setMessage(data.text);
            } else {
                setMessage('No message set in database.');
            }
        }, (error) => {
            console.error("Failed to read value.", error);
            setMessage('Error reading from database.');
        });

        return () => unsubscribe();
    }, []);

    return (
        <Card className="col-span-1 lg:col-span-2 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-amber-500" />
                    Realtime Database Demo
                </CardTitle>
                <CardDescription>
                    This card reads a value from the 'message' path in your Realtime Database and updates live.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-lg font-mono bg-muted p-4 rounded-md">
                    Value: <span className="font-bold">{message}</span>
                </p>
            </CardContent>
        </Card>
    );
};


const FruitDashboard = ({ stats, yearlyStats, ledgerSummary, router }: { stats: DailyStats | null, yearlyStats: YearlyStats | null, ledgerSummary: LedgerEntry[], router: any }) => (
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
            <StatCard
                title="This Month's Sales"
                value={`₹${yearlyStats?.monthSales.toLocaleString('en-IN') ?? '0'}`}
                icon={Calendar}
                color="text-blue-500"
            />
            <StatCard
                title="This Year Total Sales"
                value={`₹${yearlyStats?.totalSales.toLocaleString('en-IN') ?? '0'}`}
                icon={TrendingUp}
                color="text-green-500"
            />
             <StatCard
                title="This Year Total Expenses"
                value={`₹${yearlyStats?.totalExpenses.toLocaleString('en-IN') ?? '0'}`}
                icon={TrendingDown}
                color="text-orange-500"
            />
             <StatCard
                title="This Year Net Profit"
                value={`₹${yearlyStats?.netProfit.toLocaleString('en-IN') ?? '0'}`}
                icon={IndianRupee}
                color="text-red-500"
            />
             <StatCard
                title="This Year Sent Sales (Gross)"
                value={`₹${yearlyStats?.sentSales.toLocaleString('en-IN') ?? '0'}`}
                icon={HandCoins}
                color="text-purple-500"
            />
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
  const [yearlyStats, setYearlyStats] = useState<YearlyStats | null>(null);
  const [ledgerSummary, setLedgerSummary] = useState<LedgerEntry[]>([]);
  const [accessoryStats, setAccessoryStats] = useState<AccessoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    
    // Yearly stats
    let yearlyTotalSales = 0;
    let yearlyTotalExpenses = 0;
    let yearlySentSales = 0;
    let monthlySales = 0;
    
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
                const saleDate = new Date(sale.date);
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

                if (saleDate.getFullYear() === currentYear) {
                    yearlyTotalSales += sale.totals.netSale || 0;
                    yearlyTotalExpenses += sale.totals.totalExpenses || 0;
                    yearlySentSales += sale.totals.grossSale || 0;

                    if (saleDate.getMonth() === currentMonth) {
                        monthlySales += sale.totals.netSale || 0;
                    }
                }
                
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

    setYearlyStats({
        totalSales: yearlyTotalSales,
        totalExpenses: yearlyTotalExpenses,
        netProfit: yearlyTotalSales - yearlyTotalExpenses,
        sentSales: yearlySentSales,
        monthSales: monthlySales,
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
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
        .slice(0, 5);
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
            <FruitDashboard stats={stats} yearlyStats={yearlyStats} ledgerSummary={ledgerSummary} router={router} />
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
