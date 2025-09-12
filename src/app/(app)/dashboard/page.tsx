
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Package, UserCheck, CreditCard, TrendingUp, TrendingDown, IndianRupee, HandCoins, Trophy, History, BookCopy, PlusCircle, FileText, Apple, Box, Calendar, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RateList from '@/components/RateList';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getDocuments } from '@/lib/actions';


interface DailyStats {
  totalSaleValue: number;
  pattiSold: number;
  dabbaSold: number;
}

interface YearlyStats {
    monthSales: number;
    totalExpenses: number;
    yearGrossSales: number;
    yearNetSales: number;
    yearTotalExpenses: number;
}

type GrowerProfit = {
    name: string;
    profit: number;
}

type AccessoryStats = {
    todaySales: number;
    monthSales: number;
    topItem: string;
    outstandingCredit: number;
}

const StatCard = ({ title, value, icon: Icon, note, iconBgColor }: { title: string, value: string, icon: React.ElementType, note?: string, iconBgColor?: string }) => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
        <CardContent className="p-4 z-10 relative">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{note}</p>
        </CardContent>
        <div className={`absolute -right-4 -top-2 h-16 w-16 rounded-full ${iconBgColor || 'bg-gray-100'} opacity-30`}></div>
         <div className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full ${iconBgColor || 'bg-gray-100'}`}>
            <Icon className="h-6 w-6 text-white" />
        </div>
    </Card>
);

const QuickActionButton = ({ title, icon: Icon, onClick, className }: { title: string, icon: React.ElementType, onClick: () => void, className?: string }) => (
    <Button onClick={onClick} className={`flex items-center justify-center flex-col h-24 text-lg gap-2 shadow-md hover:shadow-lg transition-shadow ${className}`}>
        <Icon className="h-6 w-6" />
        {title}
    </Button>
);


const FruitDashboard = ({ stats, yearlyStats, accessoryStats, growerProfits, router }: { stats: DailyStats | null, yearlyStats: YearlyStats | null, accessoryStats: AccessoryStats | null, growerProfits: GrowerProfit[], router: any }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-lg">
                    <CardHeader className="flex-row items-center gap-4">
                        <div className="p-3 bg-primary rounded-lg">
                            <Apple className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <div>
                            <CardTitle>Business Dashboard</CardTitle>
                            <CardDescription>Daily, Monthly and Yearly Operations Overview</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                     <StatCard 
                        title="Today's Sales (Net)"
                        value={`₹${stats?.totalSaleValue.toLocaleString('en-IN') ?? '0'}`}
                        icon={TrendingUp}
                        note={`From ${stats?.pattiSold ?? 0} Patti / ${stats?.dabbaSold ?? 0} Dabba`}
                        iconBgColor="bg-green-500"
                     />
                     <StatCard 
                        title="This Month's Sales (Net)"
                        value={`₹${yearlyStats?.monthSales.toLocaleString('en-IN') ?? '0'}`}
                        icon={Calendar}
                        note="Current calendar month"
                        iconBgColor="bg-blue-500"
                     />
                    <StatCard
                        title="This Month's Expenses"
                        value={`₹${yearlyStats?.totalExpenses.toLocaleString('en-IN') ?? '0'}`}
                        icon={TrendingDown}
                        note="From Watak deductions"
                        iconBgColor="bg-red-500"
                    />
                    <StatCard 
                        title="This Year's Gross Sales"
                        value={`₹${yearlyStats?.yearGrossSales.toLocaleString('en-IN') ?? '0'}`}
                        icon={IndianRupee}
                        note="Total sale value this year"
                        iconBgColor="bg-sky-500"
                     />
                     <StatCard 
                        title="This Year's Net Sales"
                        value={`₹${yearlyStats?.yearNetSales.toLocaleString('en-IN') ?? '0'}`}
                        icon={HandCoins}
                        note="After all expenses"
                        iconBgColor="bg-amber-500"
                     />
                      <StatCard 
                        title="This Year's Expenses"
                        value={`₹${yearlyStats?.yearTotalExpenses.toLocaleString('en-IN') ?? '0'}`}
                        icon={TrendingDown}
                        note="All Watak deductions this year"
                        iconBgColor="bg-pink-500"
                     />
                </div>
                
                <div>
                    <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <QuickActionButton title="New Watak" icon={BookCopy} onClick={() => router.push('/sales')} className="bg-green-600 hover:bg-green-700" />
                        <QuickActionButton title="Add Customer" icon={UserCheck} onClick={() => router.push('/khata')} className="bg-blue-600 hover:bg-blue-700" />
                        <QuickActionButton title="Add Product" icon={PlusCircle} onClick={() => router.push('/products')} className="bg-purple-600 hover:bg-purple-700" />
                        <QuickActionButton title="Record Expense" icon={FileText} onClick={() => router.push('/expenses')} className="bg-orange-600 hover:bg-orange-700" />
                    </div>
                </div>
            </div>
             <Card className="lg:col-span-1 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Trophy className="h-6 w-6 text-amber-500" /> Top Growers by Profit</CardTitle>
                    <CardDescription>This session's top growers based on total net sales.</CardDescription>
                </CardHeader>
                <CardContent>
                    {growerProfits.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Grower</TableHead>
                                    <TableHead className="text-right">Net Sales</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {growerProfits.map((grower, index) => (
                                    <TableRow key={grower.name}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-lg font-bold ${index < 3 ? 'text-amber-500' : 'text-muted-foreground'}`}>{index + 1}</span>
                                                <span className="font-medium">{grower.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">₹{grower.profit.toLocaleString('en-IN')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <p className="text-sm text-muted-foreground text-center py-4">No sales data recorded this year to calculate grower profits.</p>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Recent Wataks</h3>
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
                iconBgColor="bg-green-500"
             />
             <StatCard 
                title="This Month's Accessories Sale"
                value={`₹${stats?.monthSales.toLocaleString('en-IN') ?? '0'}`}
                icon={Calendar}
                 iconBgColor="bg-blue-500"
             />
             <StatCard 
                title="Outstanding Khata (Credit)"
                value={`₹${stats?.outstandingCredit.toLocaleString('en-IN') ?? '0'}`}
                icon={CreditCard}
                 iconBgColor="bg-orange-500"
             />
             <StatCard 
                title="Top Selling Item"
                value={stats?.topItem ?? 'N/A'}
                icon={Star}
                 iconBgColor="bg-purple-500"
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
  const [accessoryStats, setAccessoryStats] = useState<AccessoryStats | null>(null);
  const [growerProfits, setGrowerProfits] = useState<GrowerProfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function fetchData() {
        setIsLoading(true);
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
    
        // Fetch all necessary data from localStorage
        const allInvoices = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('invoice-')) {
                try {
                    allInvoices.push(JSON.parse(localStorage.getItem(key)!));
                } catch (e) {
                    console.error(`Failed to parse invoice from local storage with key: ${key}`, e);
                }
            }
        }
        
        const accessoriesRes = getDocuments('accessory-ledgers'); // This can be async, handle it
        
        accessoriesRes.then(accessoriesRes => {
            const allAccessories = accessoriesRes.success ? (accessoriesRes.data || []) : [];

            // Fruit Stats Calculation
            let pattiSoldToday = 0;
            let dabbaSoldToday = 0;
            let totalSaleValueToday = 0;
            
            // Yearly stats
            let monthlyTotalSales = 0;
            let monthlyTotalExpenses = 0;
            let yearGrossSales = 0;
            let yearNetSales = 0;
            let yearTotalExpenses = 0;
            
            // Grower Profit
            const profitsByGrower: {[name: string]: number} = {};

            // Accessory Stats Calculation
            let accessorySalesToday = 0;
            let accessorySalesMonth = 0;
            let accessoryCredit = 0;
            const itemQuantities: {[name: string]: number} = {};
            
            allInvoices.forEach(sale => {
                const saleDate = new Date(sale.date);
                const isToday = sale.date === todayStr;

                sale.entries.forEach((entry: any) => {
                    const qty = Number(entry.qty) || 0;
                    if (entry.type === 'Patti') {
                        if (isToday) pattiSoldToday += qty;
                    } else if (entry.type === 'Dabba') {
                        if (isToday) dabbaSoldToday += qty;
                    }
                });
                
                if (isToday) totalSaleValueToday += sale.totals.netSale || 0;
                
                const saleYear = saleDate.getFullYear();
                const saleMonth = saleDate.getMonth();

                if (saleYear === currentYear) {
                    yearGrossSales += sale.totals.grossSale || 0;
                    yearNetSales += sale.totals.netSale || 0;
                    yearTotalExpenses += sale.totals.totalExpenses || 0;

                     if (saleMonth === currentMonth) {
                        monthlyTotalSales += sale.totals.netSale || 0;
                        monthlyTotalExpenses += sale.totals.totalExpenses || 0;
                    }

                    const grower = sale.customerName;
                    if(grower && sale.totals.netSale) {
                         profitsByGrower[grower] = (profitsByGrower[grower] || 0) + sale.totals.netSale;
                    }
                }
            });


            allAccessories.forEach(entry => {
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
            });

            
            setStats({
              pattiSold: pattiSoldToday,
              dabbaSold: dabbaSoldToday,
              totalSaleValue: totalSaleValueToday,
            });

            setYearlyStats({
                monthSales: monthlyTotalSales,
                totalExpenses: monthlyTotalExpenses,
                yearGrossSales: yearGrossSales,
                yearNetSales: yearNetSales,
                yearTotalExpenses: yearTotalExpenses,
            });

            const sortedGrowerProfits = Object.entries(profitsByGrower)
                .map(([name, profit]) => ({ name, profit }))
                .sort((a,b) => b.profit - a.profit)
                .slice(0, 10); 

            setGrowerProfits(sortedGrowerProfits);
            
            const topItem = Object.entries(itemQuantities).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

            setAccessoryStats({
                todaySales: accessorySalesToday,
                monthSales: accessorySalesMonth,
                topItem: topItem,
                outstandingCredit: accessoryCredit,
            });


            setIsLoading(false);
        });
    }
    fetchData();
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
            <FruitDashboard stats={stats} yearlyStats={yearlyStats} accessoryStats={accessoryStats} growerProfits={growerProfits} router={router} />
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

    

    