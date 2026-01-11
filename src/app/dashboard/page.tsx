
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { sidebarSections } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, ShoppingCart, Users, DollarSign, Calendar, BarChart, FileText, BookOpen, PlusCircle, Award } from 'lucide-react';
import { WatakEntry } from '@/app/watak-register/page';
import { PurchaseEntry } from '@/app/purchase-register/page';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const NavTile = ({ title, icon: Icon, href }: { title: string, icon: React.ElementType, href: string }) => {
    const router = useRouter();

    return (
        <li
            className="social-tile"
            onClick={() => router.push(href)}
        >
            <a href={href} className="w-full">
                <Icon className="icon h-5 w-5" />
                {title}
            </a>
        </li>
    );
};

const StatCard = ({ title, value, icon: Icon, description, color = 'text-primary' }: { title: string, value: string, icon: React.ElementType, description: string, color?: string }) => (
    <motion.div
        whileHover={{ y: -5, scale: 1.03 }}
        className="bg-card/60 backdrop-blur-sm border border-white/10 p-4 rounded-xl shadow-lg flex items-start gap-4"
    >
        <div className={`p-2 bg-primary/10 rounded-lg ${color}`}>
            <Icon className="h-6 w-6" />
        </div>
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
    </motion.div>
);

const QuickActionButton = ({ title, icon: Icon, href }: { title: string, icon: React.ElementType, href: string }) => {
    const router = useRouter();
    return (
        <motion.div whileHover={{ y: -5, scale: 1.05 }}>
            <Button
                variant="secondary"
                className="w-full h-16 text-base bg-card/80 backdrop-blur-sm border-white/10 shadow-lg"
                onClick={() => router.push(href)}
            >
                <Icon className="h-5 w-5 mr-2" /> {title}
            </Button>
        </motion.div>
    );
}

export default function DashboardPage() {
  const allNavItems = sidebarSections.flatMap(section => section.items);
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = React.useState<number[]>([]);
  const [stats, setStats] = React.useState<any>({ 
    todaySales: 0,
    todayPatti: 0,
    todayDabba: 0,
    monthSales: 0,
    yearGrossSales: 0,
    yearNetSales: 0,
    yearExpenses: 0,
    pattiReceived: 0,
    dabbaReceived: 0,
    pattiSold: 0,
    dabbaSold: 0,
    pattiSent: 0,
    dabbaSent: 0,
  });
  const [loyaltyStats, setLoyaltyStats] = React.useState({
      totalPoints: 0,
      redeemedMonth: 0,
      topGrower: { name: 'N/A', points: 0 }
  });
   const [topGrowers, setTopGrowers] = React.useState<{name: string, netSales: number}[]>([]);


  React.useEffect(() => {
    if (typeof window !== 'undefined') {
        const today = new Date();
        const currentMonth = today.getMonth();
        
        let newStats = { 
            todaySales: 0, todayPatti: 0, todayDabba: 0, monthSales: 0,
            yearGrossSales: 0, yearNetSales: 0, yearExpenses: 0,
            pattiReceived: 0, dabbaReceived: 0, pattiSold: 0, dabbaSold: 0,
            pattiSent: 0, dabbaSent: 0
        };
        let newLoyaltyStats = { totalPoints: 0, redeemedMonth: 0, topGrower: { name: 'N/A', points: 0 } };
        const growerSales: {[key: string]: number} = {};
        const years = new Set<number>();

        const allInvoices: WatakEntry[] = [];
        const allReceipts: any[] = [];
        const allChallans: any[] = [];
        const allAdvances: any[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            let data;
            try {
                data = JSON.parse(localStorage.getItem(key)!);
            } catch {
                continue;
            }

            if(data.date) {
                years.add(new Date(data.date).getFullYear());
            }

            if(key?.startsWith('invoice-')) allInvoices.push(data);
            if(key?.startsWith('receipt-')) allReceipts.push(data);
            if(key?.startsWith('challan-')) allChallans.push(data);
            if(key?.startsWith('advance-')) allAdvances.push(data);
        }

        setAvailableYears(Array.from(years).sort((a,b) => b-a));

        allInvoices.forEach(inv => {
            const invDate = new Date(inv.date);
            if (invDate.getFullYear() === selectedYear) {
                newStats.yearGrossSales += inv.totals.grossSale || 0;
                newStats.yearNetSales += inv.totals.netSale || 0;
                newStats.yearExpenses += inv.totals.totalExpenses || 0;
                newStats.pattiSold += inv.totals.pattiQty || 0;
                newStats.dabbaSold += inv.totals.dabbaQty || 0;
                
                if(invDate.toDateString() === today.toDateString()) {
                    newStats.todaySales += inv.totals.netSale || 0;
                    newStats.todayPatti += inv.totals.pattiQty || 0;
                    newStats.todayDabba += inv.totals.dabbaQty || 0;
                }
                if (invDate.getMonth() === currentMonth) {
                    newStats.monthSales += inv.totals.netSale || 0;
                }
                growerSales[inv.customerName] = (growerSales[inv.customerName] || 0) + (inv.totals.netSale || 0);
            }
        });

        allReceipts.forEach(rec => {
             if (new Date(rec.date).getFullYear() === selectedYear) {
                 const patti = rec.entries.reduce((acc: number, e: any) => acc + (Number(e.peti) || 0), 0);
                 const dabba = rec.entries.reduce((acc: number, e: any) => acc + (Number(e.daba) || 0), 0);
                 newStats.pattiReceived += patti;
                 newStats.dabbaReceived += dabba;
             }
        });

        allChallans.forEach(ch => {
            if (new Date(ch.date).getFullYear() === selectedYear) {
                newStats.pattiSent += ch.totalPetti || 0;
                newStats.dabbaSent += ch.totalDabba || 0;
            }
        });

        newLoyaltyStats.totalPoints = Math.floor(Object.values(growerSales).reduce((acc, sale) => acc + sale, 0) * 0.01);
        allAdvances.forEach(adv => {
            const advDate = new Date(adv.date);
            if (adv.type === 'Discount' && advDate.getMonth() === currentMonth && advDate.getFullYear() === selectedYear) {
                newLoyaltyStats.redeemedMonth += adv.amount || 0;
            }
        });

        const sortedGrowers = Object.entries(growerSales).sort(([,a],[,b]) => b-a);
        if(sortedGrowers.length > 0) {
            const topGrowerName = sortedGrowers[0][0];
            newLoyaltyStats.topGrower = {
                name: topGrowerName,
                points: Math.floor(sortedGrowers[0][1] * 0.01),
            }
        }
        setTopGrowers(sortedGrowers.slice(0, 5).map(([name, netSales]) => ({name, netSales})));

        setStats(newStats);
        setLoyaltyStats(newLoyaltyStats);
    }
  }, [selectedYear]);

  const grossProfitMargin = stats.yearGrossSales > 0 ? ((stats.yearNetSales / stats.yearGrossSales) * 100).toFixed(0) : 0;
  
  const summaryCards = [
    { title: "Today's Sales (Net)", value: `₹${stats.todaySales.toLocaleString()}`, description: `From ${stats.todayPatti} Patti / ${stats.todayDabba} Dabba`, icon: DollarSign },
    { title: "This Month's Sales (Net)", value: `₹${stats.monthSales.toLocaleString()}`, description: "Current calendar month", icon: Calendar },
    { title: "This Year's Gross Sales", value: `₹${stats.yearGrossSales.toLocaleString()}`, description: "Total sale value this year", icon: TrendingUp },
    { title: "This Year's Net Sales", value: `₹${stats.yearNetSales.toLocaleString()}`, description: "After all expenses", icon: TrendingUp, color: 'text-green-500' },
    { title: "Total Yearly Expenses", value: `₹${stats.yearExpenses.toLocaleString()}`, description: "From all sales invoices", icon: TrendingUp, color: 'text-red-500' },
    { title: "Gross Profit Margin", value: `${grossProfitMargin}%`, description: "Net / Gross Sales", icon: BarChart },
    { title: "Total Patti Received", value: stats.pattiReceived.toLocaleString(), description: "This year via Goods Receipt", icon: FileText },
    { title: "Total Dabba Received", value: stats.dabbaReceived.toLocaleString(), description: "This year via Goods Receipt", icon: FileText },
    { title: "Total Nugs Received", value: (stats.pattiReceived + stats.dabbaReceived).toLocaleString(), description: "Patti + Dabba this year", icon: FileText },
    { title: "Total Patti Sold (Local)", value: stats.pattiSold.toLocaleString(), description: "This year in Sopore Mandi", icon: ShoppingCart },
    { title: "Total Dabba Sold (Local)", value: stats.dabbaSold.toLocaleString(), description: "This year in Sopore Mandi", icon: ShoppingCart },
    { title: "Total Nugs Sold (Local)", value: (stats.pattiSold + stats.dabbaSold).toLocaleString(), description: "Patti + Dabba this year", icon: ShoppingCart },
    { title: "Total Patti Sent Outside", value: stats.pattiSent.toLocaleString(), description: "This year via Challan", icon: Users },
    { title: "Total Dabba Sent Outside", value: stats.dabbaSent.toLocaleString(), description: "This year via Challan", icon: Users },
    { title: "Total Nugs Sent Outside", value: (stats.pattiSent + stats.dabbaSent).toLocaleString(), description: "Patti + Dabba this year", icon: Users },
  ];


  return (
    <div className="space-y-8">
        <Card className="text-center bg-transparent border-none">
            <CardHeader>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: 0.2, type: 'spring' }}} className="mx-auto w-fit p-4 mb-2">
                    <h1 className="text-4xl md:text-5xl font-bold text-white shadow-lg">FCO BILLING SYSTEM</h1>
                </motion.div>
                <CardDescription className="text-lg text-gray-300/80 shadow-md mt-2">
                    Your complete business management solution.
                </CardDescription>
            </CardHeader>
        </Card>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
             <Card className="bg-card/60 backdrop-blur-sm border-white/10">
                <CardHeader>
                    <CardTitle>App Sections</CardTitle>
                </CardHeader>
                <CardContent>
                     <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8 justify-center">
                         {allNavItems.map((item, index) => (
                            <NavTile 
                                key={item.name} 
                                title={item.name} 
                                icon={item.icon} 
                                href={item.href}
                            />
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </motion.div>
        
        <div className="space-y-4">
             <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold text-white/80">SUMMARY FOR {selectedYear}</h2>
                 <Select onValueChange={(value) => setSelectedYear(Number(value))} defaultValue={String(selectedYear)}>
                     <SelectTrigger className="w-[180px] bg-card/60 border-white/10">
                        <SelectValue placeholder="Select a year" />
                     </SelectTrigger>
                     <SelectContent>
                        {availableYears.map(year => (
                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                        ))}
                     </SelectContent>
                 </Select>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summaryCards.map((card, i) => (
                    <StatCard key={i} {...card} />
                ))}
            </div>
        </div>

         <div className="space-y-4">
             <h2 className="text-xl font-bold text-white/80">QUICK ACTIONS</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickActionButton title="Sales Entry" icon={PlusCircle} href="/sales" />
                <QuickActionButton title="Watak Register" icon={FileText} href="/watak-register" />
                <QuickActionButton title="Purchases" icon={ShoppingCart} href="/purchases" />
                <QuickActionButton title="Khata Ledger" icon={BookOpen} href="/khata" />
            </div>
        </div>
        
         <div className="space-y-4">
            <h2 className="text-xl font-bold text-white/80">LOYALTY & GROWERS ({selectedYear})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card/60 backdrop-blur-sm border-white/10">
                     <CardHeader>
                        <CardTitle>Loyalty Program Summary</CardTitle>
                        <CardDescription>A quick overview of your grower rewards program.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4">
                        <StatCard title="Total Points Distributed" value={loyaltyStats.totalPoints.toLocaleString()} description="This season" icon={Users} />
                        <StatCard title="Redeemed This Month" value={`₹${loyaltyStats.redeemedMonth.toLocaleString()}`} description="As discounts" icon={DollarSign} />
                        <StatCard title="Top Grower" value={loyaltyStats.topGrower.name} description={`${loyaltyStats.topGrower.points.toLocaleString()} pts`} icon={Award} />
                    </CardContent>
                </Card>
                 <Card className="bg-card/60 backdrop-blur-sm border-white/10">
                    <CardHeader>
                        <CardTitle>Top Growers by Net Sales</CardTitle>
                        <CardDescription>This session's growers ranked by their total net sales.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {topGrowers.map((grower, i) => (
                                <li key={grower.name} className="flex items-center gap-4">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 font-bold">{i + 1}</div>
                                    <p className="flex-1 font-semibold">{grower.name}</p>
                                    <p className="font-mono text-green-400">₹{grower.netSales.toLocaleString()}</p>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                 </Card>
            </div>
        </div>

    </div>
  );
}
