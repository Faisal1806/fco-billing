

'use client'

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IndianRupee, TrendingUp, Calendar, FileText, ShoppingBasket, BookOpen, Loader2, Package, Box, ClipboardList, Globe, PlusCircle, User, Truck, Receipt, PieChart, BarChart, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import placeholderImages from '@/app/lib/placeholder-images.json';
import { motion } from 'framer-motion';
import { sidebarSections } from '@/components/Sidebar';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { VictoryPie, VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryLabel } from 'victory';


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
    entries: {
        isForwarded?: boolean;
        qty: number;
        type: 'Patti' | 'Dabba';
    }[];
    customerName: string;
}

interface Receipt {
    id: string;
    date: string;
    entries: {
        peti: number;
        daba: number;
    }[];
}

interface Bikri {
    id: string;
    date: string;
    growerName?: string;
    market?: string;
    bikriType?: 'fcoStock' | 'growerForwarding';
    calculation: {
        grossSale: number;
        totalExpenses: number;
        netProfitOrLoss?: number;
        netSalePayableToGrower?: number;
        commissionAmount?: number;
    };
    saleEntries: {
        type: 'Patti' | 'Dabba';
        qty: number;
    }[];
    challanNo?: string;
}

interface Challan {
    id: string;
    date: string;
    challanNo?: string;
    totalPetti: number;
    totalDabba: number;
}

interface Advance {
    id: string;
    date: string;
    type: string;
    amount: number;
}


const StatCard = ({ title, value, subtitle, icon: Icon }: { title: string, value: string, subtitle: string, icon: React.ElementType }) => (
    <Card className="bg-card/80 backdrop-blur-sm border border-white/10 shadow-lg p-4">
         <div className="flex items-start justify-between">
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
                <Icon className="h-5 w-5 text-primary-foreground/80" />
            </div>
        </div>
    </Card>
);

const AppSectionCard = ({ item }: { item: { name: string; href: string; icon: React.ElementType } }) => {
    const router = useRouter();
    const { name, href, icon: Icon } = item;
    
    return (
        <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer group bg-card/50 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors"
            onClick={() => router.push(href)}
        >
            <div className="neon-glow-container">
                <Icon className="h-7 w-7 text-green-400 neon-glow-icon" />
            </div>
            <span className="text-xs font-medium text-center text-muted-foreground group-hover:text-primary-foreground transition-colors">{name}</span>
        </motion.div>
    );
}

export default function DashboardPage() {
  const router = useRouter();
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allBikris, setAllBikris] = useState<Bikri[]>([]);
  const [allReceipts, setAllReceipts] = useState<Receipt[]>([]);
  const [allChallans, setAllChallans] = useState<Challan[]>([]);
  const [allAdvances, setAllAdvances] = useState<Advance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function fetchData() {
        if (typeof window === 'undefined') return;
        setIsLoading(true);

        const data: { [key: string]: any[] } = {
            invoices: [],
            bikris: [],
            receipts: [],
            challans: [],
            advances: [],
        };

        const prefixes: { [key: string]: keyof typeof data } = {
            'invoice-': 'invoices',
            'bikri-': 'bikris',
            'receipt-': 'receipts',
            'challan-': 'challans',
            'advance-': 'advances',
        };

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            const matchingPrefix = Object.keys(prefixes).find(p => key.startsWith(p));
            if (matchingPrefix) {
                try {
                    const item = JSON.parse(localStorage.getItem(key)!);
                    const category = prefixes[matchingPrefix];
                    data[category].push(item);
                } catch (error) {
                    console.error(`Error parsing item from localStorage with key: ${key}`, error);
                }
            }
        }
        
        setAllInvoices(data.invoices);
        setAllBikris(data.bikris);
        setAllReceipts(data.receipts);
        setAllChallans(data.challans);
        setAllAdvances(data.advances);
        
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
    let pattiToday = 0;
    let dabbaToday = 0;
    
    const monthlySalesData = Array(12).fill(0);
    let monthlyTotalSales = 0;

    let yearGrossSales = 0;
    let yearTotalExpenses = 0;
    let yearNetSales = 0;
    let yearPattiSold = 0;
    let yearDabbaSold = 0;
    let yearPattiReceived = 0;
    let yearDabbaReceived = 0;
    let yearPattiSentOutside = 0;
    let yearDabbaSentOutside = 0;


    allInvoices.forEach(sale => {
        if (!sale.totals) return; // Fix: Check if totals object exists
        const saleDate = new Date(sale.date);
        const saleYear = saleDate.getFullYear();
        const saleMonth = saleDate.getMonth();
        const netSale = sale.totals.netSale || 0;
        const grossSale = sale.totals.grossSale || 0;
        const totalExpenses = sale.totals.totalExpenses || 0;
        
        const nonForwardedEntries = sale.entries?.filter(e => !e.isForwarded) || [];

        if (sale.date === todayStr) {
            totalSaleValueToday += netSale;
            nonForwardedEntries.forEach(entry => {
                if (entry.type === 'Patti') pattiToday += entry.qty;
                if (entry.type === 'Dabba') dabbaToday += entry.qty;
            });
        }
        
        if (saleYear === currentYear) {
            if (saleMonth === currentMonth) {
                monthlyTotalSales += netSale;
            }
            monthlySalesData[saleMonth] += netSale;
            
            yearGrossSales += grossSale;
            yearTotalExpenses += totalExpenses;
            yearNetSales += netSale;
            
            nonForwardedEntries.forEach(entry => {
                if (entry.type === 'Patti') yearPattiSold += entry.qty;
                if (entry.type === 'Dabba') yearDabbaSold += entry.qty;
            });
        }
    });
    
    allBikris.forEach(bikri => {
        if (!bikri.calculation) return;
        const bikriDate = new Date(bikri.date);
        if (bikriDate.getFullYear() !== currentYear) return;

        const grossSale = bikri.calculation.grossSale || 0;
        const totalExpenses = bikri.calculation.totalExpenses || 0;
        
        let bikriNetSale = 0;
        if (bikri.bikriType === 'growerForwarding') {
            bikriNetSale = bikri.calculation.netSalePayableToGrower || 0;
            // The profit for F.Co is the commission, which is part of expenses
            // For simplicity, we add commission to net sales from F.Co's perspective
            yearNetSales += bikri.calculation.commissionAmount || 0;
        } else { // fcoStock
            bikriNetSale = bikri.calculation.netProfitOrLoss || 0;
            yearNetSales += bikriNetSale;
        }
        
        yearTotalExpenses += totalExpenses;
        yearGrossSales += grossSale; // Add bikri gross sales to total gross

        if (bikri.date === todayStr) {
            totalSaleValueToday += bikriNetSale;
            pattiToday += bikri.saleEntries?.filter((e:any) => e.type === 'Patti').reduce((acc:number, e:any) => acc + e.qty, 0) || 0;
            dabbaToday += bikri.saleEntries?.filter((e:any) => e.type === 'Dabba').reduce((acc:number, e:any) => acc + e.qty, 0) || 0;
        }
        
        const saleMonth = bikriDate.getMonth();
        if (saleMonth === currentMonth) {
            monthlyTotalSales += bikriNetSale;
        }
        monthlySalesData[saleMonth] += bikriNetSale;

        const pattiSent = bikri.saleEntries?.filter((e:any) => e.type === 'Patti').reduce((acc:number, e:any) => acc + e.qty, 0) || 0;
        const dabbaSent = bikri.saleEntries?.filter((e:any) => e.type === 'Dabba').reduce((acc:number, e:any) => acc + e.qty, 0) || 0;
        yearPattiSentOutside += pattiSent;
        yearDabbaSentOutside += dabbaSent;
    });

    allReceipts.forEach(receipt => {
        const receiptDate = new Date(receipt.date);
        if (receiptDate.getFullYear() === currentYear && Array.isArray(receipt.entries)) {
            receipt.entries.forEach(entry => {
                yearPattiReceived += Number(entry.peti) || 0;
                yearDabbaReceived += Number(entry.daba) || 0;
            });
        }
    });
    
    // Note: This logic for sent outside might be double counting if challans are also used for bikris.
    // Assuming for now they are separate or bikris are the primary record for outside sales qty.
    allChallans.forEach(challan => {
        if (!challan.id) return;
        const challanDate = new Date(challan.date);
        const isLinkedToBikri = allBikris.some(b => b.challanId === challan.id);
        if (challanDate.getFullYear() === currentYear && !isLinkedToBikri) {
            yearPattiSentOutside += Number(challan.totalPetti) || 0;
            yearDabbaSentOutside += Number(challan.totalDabba) || 0;
        }
    });
    
    const grossProfitMargin = yearGrossSales > 0 ? ((yearNetSales / yearGrossSales) * 100) : 0;

    return {
        totalSaleValueToday,
        pattiToday,
        dabbaToday,
        monthlyTotalSales,
        monthlySalesData,
        yearGrossSales,
        yearTotalExpenses,
        yearNetSales,
        grossProfitMargin,
        yearPattiSold,
        yearDabbaSold,
        yearNugsSold: yearPattiSold + yearDabbaSold,
        yearPattiReceived,
        yearDabbaReceived,
        yearNugsReceived: yearPattiReceived + yearDabbaReceived,
        yearPattiSentOutside,
        yearDabbaSentOutside,
        yearNugsSentOutside: yearPattiSentOutside + yearDabbaSentOutside,
    };
  }, [allInvoices, allBikris, allReceipts, allChallans, isLoading]);
  
  const growerProfits = useMemo(() => {
    if (isLoading) return [];
    
    const profitsByGrower: { [name: string]: { name: string; profit: number } } = {};
    const currentYear = new Date().getFullYear();

    const addProfit = (name: string, amount: number) => {
        if (!name || !amount) return;
        if (!profitsByGrower[name]) {
            profitsByGrower[name] = { name: name, profit: 0 };
        }
        profitsByGrower[name].profit += amount;
    };

    // Process local invoices
    allInvoices.forEach(sale => {
        if (!sale.totals) return;
        const saleYear = new Date(sale.date).getFullYear();
        if (saleYear === currentYear) {
            addProfit(sale.customerName, sale.totals.netSale);
        }
    });

    // Process outside sales (bikris)
    allBikris.forEach(bikri => {
        if (!bikri.calculation) return;
        const bikriYear = new Date(bikri.date).getFullYear();
        if (bikriYear === currentYear && bikri.bikriType === 'growerForwarding' && bikri.growerName) {
            addProfit(bikri.growerName, bikri.calculation.netSalePayableToGrower || 0);
        }
    });

    return Object.values(profitsByGrower).sort((a, b) => b.profit - a.profit);
  }, [allInvoices, allBikris, isLoading]);

  const loyaltyStats = useMemo(() => {
        if (isLoading) return null;
        
        let totalPointsDistributed = 0;
        let redeemedThisMonth = 0;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        growerProfits.forEach(grower => {
            totalPointsDistributed += Math.floor(grower.profit * 0.01); // 1% of net sales
        });

        allAdvances.forEach(advance => {
            const advanceDate = new Date(advance.date);
            if(advance.type === 'Discount' && advanceDate.getMonth() === currentMonth && advanceDate.getFullYear() === currentYear) {
                redeemedThisMonth += advance.amount;
            }
        });

        const topGrower = growerProfits.length > 0 ? growerProfits[0] : null;

        return {
            totalPointsDistributed: totalPointsDistributed.toLocaleString(),
            redeemedThisMonth: `₹${redeemedThisMonth.toLocaleString()}`,
            topGrower: topGrower ? `${topGrower.name} (${Math.floor(topGrower.profit * 0.01).toLocaleString()} pts)` : 'N/A',
        };
    }, [isLoading, growerProfits, allAdvances]);


  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-screen bg-background text-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-4">Loading Dashboard...</p>
        </div>
    )
  }

  const { dashboardHeader } = placeholderImages;
  
  const appSections = sidebarSections.flatMap(s => s.items);
  
  const pieChartData = growerProfits.slice(0, 5).map(g => ({ x: g.name.split(' ')[0], y: g.profit }));
  const otherProfit = growerProfits.slice(5).reduce((acc, g) => acc + g.profit, 0);
  if (otherProfit > 0) {
      pieChartData.push({ x: 'Others', y: otherProfit });
  }

  const barChartData = stats?.monthlySalesData.map((sales, i) => ({
      x: new Date(2000, i).toLocaleString('default', { month: 'short' }),
      y: sales
  }));

  const pieColorScale = ["#10b981", "#3b82f6", "#f97316", "#8b5cf6", "#ec4899", "#64748b"];

  return (
    <div className="space-y-8">
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative h-48 rounded-xl overflow-hidden flex flex-col justify-center items-center text-center p-4 border border-white/10"
        >
            <Image 
                src={dashboardHeader.src}
                alt={dashboardHeader.alt}
                fill
                style={{objectFit: 'cover'}}
                className="opacity-20"
                data-ai-hint={dashboardHeader.hint}
                priority
            />
            <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-bold text-white shadow-lg">Welcome to F.Co App</h1>
                <p className="text-lg text-gray-300/80 shadow-md mt-2">Your complete business management solution.</p>
            </div>
        </motion.div>
        
         <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>
                    <h2 className="text-xl font-semibold tracking-wider text-muted-foreground">APP SECTIONS</h2>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 pt-4">
                        {appSections.map((item) => (
                            <AppSectionCard key={item.name} item={item} />
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-card/80 backdrop-blur-sm border border-white/10">
                <CardHeader>
                    <CardTitle>Monthly Sales</CardTitle>
                    <CardDescription>Net sales growth for the current year.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="pointer-events-none h-64">
                        {barChartData && barChartData.some(d => d.y > 0) ? (
                        <VictoryChart
                                theme={VictoryTheme.material}
                                domainPadding={{x: 20}}
                                padding={{ top: 20, bottom: 40, left: 60, right: 40 }}
                            >
                                <VictoryAxis 
                                    style={{ 
                                        tickLabels: { fill: 'hsl(var(--muted-foreground))', fontSize: 10 },
                                        grid: { stroke: 'hsl(var(--border))', strokeDasharray: '4' } 
                                    }} 
                                />
                                <VictoryAxis 
                                    dependentAxis 
                                    style={{ 
                                        tickLabels: { fill: 'hsl(var(--muted-foreground))', fontSize: 10 },
                                        grid: { stroke: 'hsl(var(--border))', strokeDasharray: '4' } 
                                    }}
                                    tickFormat={(x) => (`₹${x/1000}k`)} 
                                />
                                <VictoryBar
                                    data={barChartData}
                                    style={{ data: { fill: "#34d399" }, labels: { fill: 'white' } }}
                                    barRatio={0.8}
                                    cornerRadius={{ top: 4 }}
                                />
                            </VictoryChart>
                        ) : <div className="flex items-center justify-center h-full text-muted-foreground">No monthly sales data available for chart.</div>}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border border-white/10">
                <CardHeader>
                    <CardTitle>Top Grower Sales</CardTitle>
                    <CardDescription>Net sales distribution for top 5 growers this year.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="pointer-events-none h-64">
                        {pieChartData && pieChartData.length > 0 ? (
                            <VictoryPie
                                data={pieChartData}
                                colorScale={pieColorScale}
                                innerRadius={70}
                                labelComponent={<VictoryLabel style={{ fill: 'white', fontSize: 10, fontWeight: 'bold' }} />}
                                style={{
                                    data: {
                                        stroke: 'hsl(var(--background))',
                                        strokeWidth: 2,
                                    },
                                    labels: { fill: "white", fontSize: 12, fontWeight: "bold" }
                                }}
                            />
                        ) : <div className="flex items-center justify-center h-full text-muted-foreground">No grower sales data for chart.</div>}
                    </div>
                </CardContent>
            </Card>

        </div>
        
        <div className="space-y-4">
             <h2 className="text-xl font-semibold tracking-wider text-muted-foreground">THIS YEAR'S SUMMARY</h2>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                <StatCard title="Today's Sales (Net)" value={`₹${Math.round(stats?.totalSaleValueToday ?? 0).toLocaleString('en-IN')}`} subtitle={`From ${stats?.pattiToday} Patti / ${stats?.dabbaToday} Dabba`} icon={TrendingUp} />
                <StatCard title="This Month's Sales (Net)" value={`₹${Math.round(stats?.monthlyTotalSales ?? 0).toLocaleString('en-IN')}`} subtitle="Current calendar month" icon={Calendar} />
                <StatCard title="This Year's Gross Sales" value={`₹${Math.round(stats?.yearGrossSales ?? 0).toLocaleString('en-IN')}`} subtitle="Total sale value this year" icon={IndianRupee} />
                <StatCard title="This Year's Net Sales" value={`₹${Math.round(stats?.yearNetSales ?? 0).toLocaleString('en-IN')}`} subtitle="After all expenses" icon={IndianRupee} />
                <StatCard title="Total Yearly Expenses" value={`₹${Math.round(stats?.yearTotalExpenses ?? 0).toLocaleString('en-IN')}`} subtitle="From all sales invoices" icon={IndianRupee} />
                <StatCard title="Gross Profit Margin" value={`${Math.round(stats?.grossProfitMargin ?? 0)}%`} subtitle="Net / Gross Sales" icon={TrendingUp} />

                <StatCard title="Total Patti Received" value={stats?.yearPattiReceived.toLocaleString('en-IN') ?? '0'} subtitle="This year via Goods Receipt" icon={Receipt} />
                <StatCard title="Total Dabba Received" value={stats?.yearDabbaReceived.toLocaleString('en-IN') ?? '0'} subtitle="This year via Goods Receipt" icon={Receipt} />
                <StatCard title="Total Nugs Received" value={stats?.yearNugsReceived.toLocaleString('en-IN') ?? '0'} subtitle="Patti + Dabba this year" icon={Receipt} />

                <StatCard title="Total Patti Sold (Local)" value={stats?.yearPattiSold.toLocaleString('en-IN') ?? '0'} subtitle="This year in Sopore Mandi" icon={Package} />
                <StatCard title="Total Dabba Sold (Local)" value={stats?.yearDabbaSold.toLocaleString('en-IN') ?? '0'} subtitle="This year in Sopore Mandi" icon={Box} />
                <StatCard title="Total Nugs Sold (Local)" value={stats?.yearNugsSold.toLocaleString('en-IN') ?? '0'} subtitle="Patti + Dabba this year" icon={ClipboardList} />
                
                <StatCard title="Total Patti Sent Outside" value={stats?.yearPattiSentOutside.toLocaleString('en-IN') ?? '0'} subtitle="This year via Challan" icon={Truck} />
                <StatCard title="Total Dabba Sent Outside" value={stats?.yearDabbaSentOutside.toLocaleString('en-IN') ?? '0'} subtitle="This year via Challan" icon={Truck} />
                <StatCard title="Total Nugs Sent Outside" value={stats?.yearNugsSentOutside.toLocaleString('en-IN') ?? '0'} subtitle="Patti + Dabba this year" icon={Globe} />
             </div>
        </div>

        <div className="space-y-4">
             <h2 className="text-xl font-semibold tracking-wider text-muted-foreground">QUICK ACTIONS</h2>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <Button onClick={() => router.push('/sales')} className="h-20 text-lg bg-primary/80 hover:bg-primary border border-primary-foreground/20">
                     <PlusCircle className="mr-2 h-6 w-6" /> Sales Entry
                 </Button>
                 <Button onClick={() => router.push('/watak-register')} className="h-20 text-lg bg-primary/80 hover:bg-primary border border-primary-foreground/20">
                     <FileText className="mr-2 h-6 w-6" /> Watak Register
                 </Button>
                 <Button onClick={() => router.push('/purchases')} className="h-20 text-lg bg-primary/80 hover:bg-primary border border-primary-foreground/20">
                    <ShoppingBasket className="mr-2 h-6 w-6" /> Purchases
                 </Button>
                 <Button onClick={() => router.push('/khata')} className="h-20 text-lg bg-primary/80 hover:bg-primary border border-primary-foreground/20">
                    <BookOpen className="mr-2 h-6 w-6" /> Khata Ledger
                 </Button>
            </div>
        </div>
        
        <Card className="bg-card/80 backdrop-blur-sm border border-white/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-yellow-400" />Loyalty Program Summary</CardTitle>
                <CardDescription>A quick overview of your grower rewards program.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                 <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Points Distributed</p>
                    <p className="text-2xl font-bold">{loyaltyStats?.totalPointsDistributed}</p>
                </div>
                 <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Redeemed This Month</p>
                    <p className="text-2xl font-bold">{loyaltyStats?.redeemedThisMonth}</p>
                </div>
                 <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Top Grower</p>
                    <p className="text-2xl font-bold">{loyaltyStats?.topGrower}</p>
                </div>
            </CardContent>
        </Card>
        
        <Card className="bg-card/80 backdrop-blur-sm border border-white/10">
            <CardHeader>
                <CardTitle>All Growers</CardTitle>
                <CardDescription>This session's growers by net sales.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {growerProfits.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10">
                                <TableHead>Grower</TableHead>
                                <TableHead className="text-right">Net Sales</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {growerProfits.map((grower, index) => (
                                <TableRow key={grower.name} className="border-white/10">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <span className={cn("flex items-center justify-center h-8 w-8 rounded-full text-white font-bold", 
                                                index === 0 && "bg-yellow-500",
                                                index === 1 && "bg-gray-400",
                                                index === 2 && "bg-orange-700",
                                                index > 2 && "bg-gray-600"
                                            )}>{index + 1}</span>
                                            <div>
                                              <span className="font-medium text-base">{grower.name}</span>
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
  );
}
