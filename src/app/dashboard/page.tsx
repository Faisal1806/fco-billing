
'use client'

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Package, CreditCard, TrendingUp, TrendingDown, IndianRupee, HandCoins, Trophy, Users, PlusCircle, FileText, Apple, Box, Calendar, Star, AlertCircle, FlaskConical, Globe, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import placeholderImages from '@/app/lib/placeholder-images.json';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AnimatedShinyButton } from '@/components/ui/animated-button';


interface DailyStats {
  totalSaleValue: number;
  pattiSold: number;
  dabbaSold: number;
  wataksToday: number;
}

interface YearlyStats {
    monthSales: number;
    totalExpenses: number;
    yearGrossSales: number;
    yearNetSales: number;
    yearTotalExpenses: number;
    yearTotalPatti: number;
    yearTotalDabba: number;
    yearTotalNugs: number;
}

interface OutsideSalesStats {
    yearTotalPattiSent: number;
    yearTotalDabbaSent: number;
    yearTotalNugsSent: number;
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

interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  reorderLevel?: number;
}

interface AccessoryLedgerEntry {
    item: string;
    qty: number;
    date: string;
    paymentMode: 'Cash' | 'Credit' | 'Khata';
    rate: number;
}

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
    entries: any[];
    customerName: string;
}

interface Challan {
    date: string;
    totalPetti: number;
    totalDabba: number;
    totalNugs: number;
}

interface CategorizedProducts {
    fruits: Product[];
    accessories: Product[];
    fertilizers: Product[];
}

const normalizeName = (name: string): string => {
    if (!name) return '';
    
    const suffixes = ["S/P", "B/P", "K/P", "(LAMA)"];
    let mainName = name;
    let suffix = '';

    for (const s of suffixes) {
        if (name.toUpperCase().endsWith(s)) {
            mainName = name.substring(0, name.length - s.length).trim();
            suffix = ` ${s}`;
            break;
        }
    }
    
    return mainName
        .toLowerCase()
        .replace(/\b(mohammad|mohd|md)\b/g, 'mohammad')
        .replace(/\b(ahmad|ah)\b/g, 'ahmad')
        .replace(/\./g, '') // Remove dots
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim() + suffix.toUpperCase();
};


const StatCard = ({ title, value, icon: Icon, note, iconBgColor }: { title: string, value: string, icon: React.ElementType, note?: string, iconBgColor?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.05, boxShadow: "0px 10px 30px -5px rgba(0, 0, 0, 0.3)" }}
    >
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden bg-card/80 backdrop-blur-sm border-white/10 rounded-2xl h-full">
            <CardContent className="p-4 z-10 relative">
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{note}</p>
            </CardContent>
            <div className={`absolute -right-4 -top-2 h-16 w-16 rounded-full ${iconBgColor || 'bg-amber-500'} opacity-30`}></div>
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
        </Card>
    </motion.div>
);


const QuickActions = () => {
    const router = useRouter();
    return (
        <motion.div 
            className="my-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <AnimatedShinyButton
                    className="bg-green-500/80 hover:bg-green-600/80"
                    onClick={() => router.push('/sales')}
                >
                     <FileText className="h-6 w-6 mr-2" />
                    New Watak
                </AnimatedShinyButton>
                <AnimatedShinyButton
                    className="bg-blue-500/80 hover:bg-blue-600/80"
                    onClick={() => router.push('/khata')}
                >
                    <Users className="h-6 w-6 mr-2" />
                    Add Customer
                </AnimatedShinyButton>
                <AnimatedShinyButton
                    className="bg-purple-500/80 hover:bg-purple-600/80"
                    onClick={() => router.push('/products')}
                >
                    <PlusCircle className="h-6 w-6 mr-2" />
                    Add Product
                </AnimatedShinyButton>
                <AnimatedShinyButton
                    className="bg-orange-500/80 hover:bg-orange-600/80"
                    onClick={() => router.push('/expenses')}
                >
                    <IndianRupee className="h-6 w-6 mr-2" />
                    Record Expense
                </AnimatedShinyButton>
            </div>
        </motion.div>
    )
}

const FruitDashboard = ({ stats, yearlyStats, outsideSalesStats, accessoryStats, growerProfits, router, recentWataks }: { stats: DailyStats | null, yearlyStats: YearlyStats | null, outsideSalesStats: OutsideSalesStats | null, accessoryStats: AccessoryStats | null, growerProfits: GrowerProfit[], router: any, recentWataks: Invoice[] }) => {
    const [showAllGrowers, setShowAllGrowers] = useState(false);
    const displayedGrowers = useMemo(() => {
        if (showAllGrowers) {
            return growerProfits;
        }
        return growerProfits.slice(0, 10);
    }, [growerProfits, showAllGrowers]);

    return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                     <StatCard 
                        title="Today's Sales (Net)"
                        value={`₹${stats?.totalSaleValue.toLocaleString('en-IN') ?? '0'}`}
                        icon={TrendingUp}
                        note={`From ${stats?.pattiSold ?? 0} Patti / ${stats?.dabbaSold ?? 0} Dabba`}
                     />
                    <StatCard 
                        title="This Month's Sales (Net)"
                        value={`₹${yearlyStats?.monthSales.toLocaleString('en-IN') ?? '0'}`}
                        icon={Calendar}
                        note="Current calendar month"
                     />
                    <StatCard
                        title="This Month's Expenses"
                        value={`₹${yearlyStats?.totalExpenses.toLocaleString('en-IN') ?? '0'}`}
                        icon={TrendingDown}
                        note="From Watak deductions"
                    />
                     <StatCard 
                        title="This Year's Gross Sales"
                        value={`₹${yearlyStats?.yearGrossSales.toLocaleString('en-IN') ?? '0'}`}
                        icon={IndianRupee}
                        note="Total sale value this year"
                     />
                     <StatCard 
                        title="This Year's Net Sales"
                        value={`₹${yearlyStats?.yearNetSales.toLocaleString('en-IN') ?? '0'}`}
                        icon={HandCoins}
                        note="After all expenses"
                     />
                      <StatCard 
                        title="This Year's Expenses"
                        value={`₹${yearlyStats?.yearTotalExpenses.toLocaleString('en-IN') ?? '0'}`}
                        icon={TrendingDown}
                        note="All Watak deductions this year"
                     />
                     <StatCard 
                        title="Total Patti Sold (This Year)"
                        value={yearlyStats?.yearTotalPatti.toLocaleString('en-IN') ?? '0'}
                        icon={Box}
                        note="Local sales volume"
                     />
                     <StatCard 
                        title="Total Dabba Sold (This Year)"
                        value={yearlyStats?.yearTotalDabba.toLocaleString('en-IN') ?? '0'}
                        icon={Package}
                        note="Local sales volume"
                     />
                     <StatCard 
                        title="Total Nugs Sold (This Year)"
                        value={yearlyStats?.yearTotalNugs.toLocaleString('en-IN') ?? '0'}
                        icon={FileText}
                        note="Patti + Dabba (Local)"
                     />
                      <StatCard 
                        title="Total Patti Sent Outside (Year)"
                        value={outsideSalesStats?.yearTotalPattiSent.toLocaleString('en-IN') ?? '0'}
                        icon={Truck}
                        note="Forwarding volume"
                     />
                     <StatCard 
                        title="Total Dabba Sent Outside (Year)"
                        value={outsideSalesStats?.yearTotalDabbaSent.toLocaleString('en-IN') ?? '0'}
                        icon={Truck}
                        note="Forwarding volume"
                     />
                     <StatCard 
                        title="Total Nugs Sent Outside (Year)"
                        value={outsideSalesStats?.yearTotalNugsSent.toLocaleString('en-IN') ?? '0'}
                        icon={Globe}
                        note="Total Forwarding"
                     />
                </div>
                 <QuickActions />
            </div>
             <div className="lg:col-span-1 space-y-6">
                <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-white/10 rounded-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Trophy className="h-6 w-6 text-amber-400" /> All Growers</CardTitle>
                        <CardDescription>This session's growers by net sales.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {growerProfits.length > 0 ? (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Grower</TableHead>
                                            <TableHead className="text-right">Net Sales</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {displayedGrowers.map((grower, index) => (
                                            <TableRow key={grower.name}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-lg font-bold ${index < 3 ? 'text-amber-400' : 'text-muted-foreground'}`}>{index + 1}</span>
                                                        <span className="font-medium">{grower.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">₹{grower.profit.toLocaleString('en-IN')}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {growerProfits.length > 10 && (
                                    <div className="text-center mt-4">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowAllGrowers(!showAllGrowers)}
                                        >
                                            {showAllGrowers ? 'Show Less' : 'Show More'}
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                             <p className="text-sm text-muted-foreground text-center py-4">No sales data recorded this year to calculate grower profits.</p>
                        )}
                    </CardContent>
                </Card>
                 <Card className="bg-card/80 backdrop-blur-sm border-white/10 rounded-2xl">
                    <CardHeader>
                        <CardTitle>Recent Wataks</CardTitle>
                        <CardDescription>A list of your 5 most recent sales invoices.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentWataks.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice No.</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="text-right">Net Sale</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentWataks.map(watak => (
                                    <TableRow key={watak.id}>
                                        <TableCell className="font-medium">{watak.sNo}</TableCell>
                                        <TableCell>{watak.customerName}</TableCell>
                                        <TableCell className="text-right font-mono">₹{watak.totals.netSale.toLocaleString('en-IN')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        ) : (
                             <p className="text-sm text-muted-foreground text-center py-4">No wataks found.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
    )
};

const AccessoriesDashboard = ({ stats, router }: { stats: AccessoryStats | null, router: any }) => (
     <div className="space-y-8 p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             <StatCard 
                title="Today's Supplies Sale"
                value={`₹${stats?.todaySales.toLocaleString('en-IN') ?? '0'}`}
                icon={Package}
             />
             <StatCard 
                title="This Month's Supplies Sale"
                value={`₹${stats?.monthSales.toLocaleString('en-IN') ?? '0'}`}
                icon={Calendar}
             />
             <StatCard 
                title="Outstanding Credit (Khata)"
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
             <Button onClick={() => router.push('/accessories')} variant="secondary">
                Go to Full Supplies Ledger
            </Button>
         </div>
    </div>
);

const InventoryDashboard = ({ inventory, router }: { inventory: CategorizedProducts | null, router: any }) => {

    const InventoryTable = ({ title, products, icon: Icon, iconColor }: { title: string, products: Product[], icon: React.ElementType, iconColor: string }) => (
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 rounded-2xl shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                    {title} ({products.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                 {products.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Current Stock</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell>{p.category}</TableCell>
                                    <TableCell className="text-right font-bold">
                                        <div className="flex items-center justify-end gap-2">
                                        {p.reorderLevel && p.stock <= p.reorderLevel && <AlertCircle className="h-4 w-4 text-destructive" title={`Low stock! Reorder level is ${p.reorderLevel}`} />}
                                        <span>{p.stock}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No products found in this category.</p>
                 )}
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6 p-6">
            <div className="text-center">
                 <Button onClick={() => router.push('/products')} variant="secondary">Manage Full Inventory</Button>
            </div>
            <div className="space-y-6">
                <InventoryTable title="Fruit Products" products={inventory?.fruits ?? []} icon={Apple} iconColor="text-red-500" />
                <InventoryTable title="Business Supplies" products={inventory?.accessories ?? []} icon={Box} iconColor="text-blue-500" />
                <InventoryTable title="Fertilizers & Pesticides" products={inventory?.fertilizers ?? []} icon={FlaskConical} iconColor="text-green-500" />
            </div>
        </div>
    );
};


export default function DashboardPage() {
  const router = useRouter();
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allAccessories, setAllAccessories] = useState<AccessoryLedgerEntry[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allChallans, setAllChallans] = useState<Challan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function fetchData() {
        if (typeof window === 'undefined') return;
        setIsLoading(true);

        const invoices: Invoice[] = [];
        const accessories: AccessoryLedgerEntry[] = [];
        const products: Product[] = [];
        const challans: Challan[] = [];

        for(let i=0; i<localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('invoice-')) {
                invoices.push(JSON.parse(localStorage.getItem(key)!));
            } else if (key?.startsWith('accessory-ledger-')) {
                accessories.push(JSON.parse(localStorage.getItem(key)!));
            } else if (key?.startsWith('product-')) {
                products.push(JSON.parse(localStorage.getItem(key)!));
            } else if (key?.startsWith('challan-')) {
                challans.push(JSON.parse(localStorage.getItem(key)!));
            }
        }
        setAllInvoices(invoices);
        setAllAccessories(accessories);
        setAllProducts(products);
        setAllChallans(challans);
        setIsLoading(false);
    }
    fetchData();
  }, []);

  const stats = useMemo(() => {
    if (isLoading) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    let pattiSoldToday = 0;
    let dabbaSoldToday = 0;
    let totalSaleValueToday = 0;
    let wataksToday = 0;

    allInvoices.forEach(sale => {
        if (sale.date === todayStr) {
            pattiSoldToday += sale.totals.pattiQty || 0;
            dabbaSoldToday += sale.totals.dabbaQty || 0;
            totalSaleValueToday += sale.totals.netSale || 0;
            wataksToday += 1;
        }
    });

    return {
        pattiSold: pattiSoldToday,
        dabbaSold: dabbaSoldToday,
        totalSaleValue: totalSaleValueToday,
        wataksToday: wataksToday,
    };
  }, [allInvoices, isLoading]);

  const yearlyStats = useMemo(() => {
    if (isLoading) return null;
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let monthlyTotalSales = 0;
    let monthlyTotalExpenses = 0;
    let yearGrossSales = 0;
    let yearNetSales = 0;
    let yearTotalExpenses = 0;
    let yearTotalPatti = 0;
    let yearTotalDabba = 0;

    allInvoices.forEach(sale => {
        const saleDate = new Date(sale.date);
        const saleYear = saleDate.getFullYear();
        const saleMonth = saleDate.getMonth();

        if (saleYear === currentYear) {
            yearGrossSales += sale.totals.grossSale || 0;
            yearNetSales += sale.totals.netSale || 0;
            yearTotalExpenses += sale.totals.totalExpenses || 0;
            yearTotalPatti += sale.totals.pattiQty || 0;
            yearTotalDabba += sale.totals.dabbaQty || 0;

             if (saleMonth === currentMonth) {
                monthlyTotalSales += sale.totals.netSale || 0;
                monthlyTotalExpenses += sale.totals.totalExpenses || 0;
            }
        }
    });
    
    return {
        monthSales: monthlyTotalSales,
        totalExpenses: monthlyTotalExpenses,
        yearGrossSales: yearGrossSales,
        yearNetSales: yearNetSales,
        yearTotalExpenses: yearTotalExpenses,
        yearTotalPatti,
        yearTotalDabba,
        yearTotalNugs: yearTotalPatti + yearTotalDabba,
    };
  }, [allInvoices, isLoading]);

  const outsideSalesStats = useMemo(() => {
    if (isLoading) return null;
    const currentYear = new Date().getFullYear();
    let yearTotalPattiSent = 0;
    let yearTotalDabbaSent = 0;

    allChallans.forEach(challan => {
        const challanDate = new Date(challan.date);
        if (challanDate.getFullYear() === currentYear) {
            yearTotalPattiSent += challan.totalPetti || 0;
            yearTotalDabbaSent += challan.totalDabba || 0;
        }
    });

    return {
        yearTotalPattiSent,
        yearTotalDabbaSent,
        yearTotalNugsSent: yearTotalPattiSent + yearTotalDabbaSent,
    };
  }, [allChallans, isLoading]);

  const growerProfits = useMemo(() => {
    if (isLoading) return [];
    const profitsByGrower: {[normalizedName: string]: { name: string, profit: number }} = {};
    const currentYear = new Date().getFullYear();

    allInvoices.forEach(sale => {
        const saleYear = new Date(sale.date).getFullYear();
        if (saleYear === currentYear) {
            const grower = sale.customerName;
            if(grower && sale.totals.netSale) {
                 const normalized = normalizeName(grower);
                 if (!profitsByGrower[normalized]) {
                    profitsByGrower[normalized] = { name: grower, profit: 0 };
                 }
                 profitsByGrower[normalized].profit += sale.totals.netSale;
            }
        }
    });

    return Object.values(profitsByGrower)
        .sort((a,b) => b.profit - a.profit);
  }, [allInvoices, isLoading]);

  const accessoryStats = useMemo(() => {
    if (isLoading) return null;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let accessorySalesToday = 0;
    let accessorySalesMonth = 0;
    let accessoryCredit = 0;
    const itemQuantities: {[name: string]: number} = {};

    allAccessories.forEach((entry) => {
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
    
    const topItem = Object.entries(itemQuantities).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    return {
        todaySales: accessorySalesToday,
        monthSales: accessorySalesMonth,
        topItem: topItem,
        outstandingCredit: accessoryCredit,
    };
  }, [allAccessories, isLoading]);
  
  const inventory = useMemo(() => {
    if (isLoading) return null;
    const stockOut: { [productName: string]: number } = {};
    allAccessories.forEach(sale => {
        stockOut[sale.item] = (stockOut[sale.item] || 0) + sale.qty;
    });
    
    const updatedProducts = allProducts.map(p => ({
        ...p,
        stock: (p.stock || 0) - (stockOut[p.name] || 0),
    }));

    const categorized: CategorizedProducts = { fruits: [], accessories: [], fertilizers: [] };
    updatedProducts.forEach(p => {
        const cat = p.category.toLowerCase();
        if (['fruit', 'apple', 'pear', 'nakh', 'gosha', 'red delicious', 'american', 'gala mast', 'shimla'].some(fruitCat => cat.includes(fruitCat))) {
            categorized.fruits.push(p);
        } else if (['dabba', 'patti', 'layer', 'tray', 'tape', 'packing', 'crate'].some(accCat => cat.includes(accCat))) {
            categorized.accessories.push(p);
        } else if (['fertilizer', 'pesticide', 'urea', 'dap', 'fungicide', 'insecticide'].some(fertCat => cat.includes(fertCat))) {
            categorized.fertilizers.push(p);
        } else {
             categorized.accessories.push(p);
        }
    });
    return categorized;
  }, [allProducts, allAccessories, isLoading]);

  const recentWataks = useMemo(() => {
    if (isLoading) return [];
    return allInvoices
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [allInvoices, isLoading]);


  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64 p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4 text-muted-foreground">Calculating summary...</p>
        </div>
    )
  }
  
  return (
    <>
      <CardHeader>
        <div className="relative h-48 md:h-64 rounded-xl overflow-hidden">
            <Image 
                src={placeholderImages.dashboardHeader.src}
                alt={placeholderImages.dashboardHeader.alt}
                fill
                style={{objectFit: 'cover'}}
                priority
                data-ai-hint={placeholderImages.dashboardHeader.hint}
            />
            <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-6">
                <h1 className="text-3xl md:text-4xl font-bold text-white shadow-lg">Welcome to F.Co</h1>
                <p className="text-lg text-white/80 shadow-md">Your complete business management solution.</p>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="fruit" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/80 backdrop-blur-sm border-white/10 rounded-xl">
              <TabsTrigger value="fruit"><Apple className="w-4 h-4 mr-2" />Fruit Business</TabsTrigger>
              <TabsTrigger value="accessories"><Box className="w-4 h-4 mr-2" />Accessories</TabsTrigger>
              <TabsTrigger value="inventory"><Package className="w-4 h-4 mr-2" />Inventory</TabsTrigger>
          </TabsList>
          <TabsContent value="fruit" className="mt-4">
              <FruitDashboard stats={stats} yearlyStats={yearlyStats} outsideSalesStats={outsideSalesStats} accessoryStats={accessoryStats} growerProfits={growerProfits} router={router} recentWataks={recentWataks}/>
          </TabsContent>
          <TabsContent value="accessories" className="mt-4">
              <AccessoriesDashboard stats={accessoryStats} router={router} />
          </TabsContent>
          <TabsContent value="inventory" className="mt-4">
              <InventoryDashboard inventory={inventory} router={router} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </>
  );
}
