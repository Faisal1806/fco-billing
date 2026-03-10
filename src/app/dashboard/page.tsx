
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { sidebarSections } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, ShoppingCart, Users, DollarSign, Calendar, BarChart, FileText, BookOpen, PlusCircle, Award, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SummaryCard } from '@/components/ui/summary-card';
import { useAppState } from '@/contexts/app-state-context';

const NavTile = ({ title, icon: Icon, href }: { title: string, icon: React.ElementType, href: string }) => {
    const router = useRouter();

    return (
        <motion.div
            className="w-full"
            onClick={() => router.push(href)}
            variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
            }}
             whileHover={{ y: -8, scale: 1.05, boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.4)" }}
             whileTap={{ scale: 0.95 }}
             transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
            <div className="neon-glow-container cursor-pointer flex items-center justify-start text-left p-3 w-full bg-card/60 backdrop-blur-sm border border-white/10 rounded-lg text-card-foreground no-underline font-medium shadow-md transition-shadow hover:shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                <Icon className="neon-glow-icon icon h-5 w-5 mr-3 text-primary transition-all duration-300" />
                {title}
            </div>
        </motion.div>
    );
};

const QuickActionButton = ({ title, icon: Icon, href }: { title: string, icon: React.ElementType, href: string }) => {
    const router = useRouter();
    return (
        <motion.div 
            whileHover={{ y: -8, scale: 1.05, boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.4)" }}
             whileTap={{ scale: 0.95 }}
             variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
            }}
        >
            <Button
                variant="secondary"
                className="w-full h-16 text-base bg-card/80 backdrop-blur-sm border-white/10 shadow-lg shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                onClick={() => router.push(href)}
            >
                <Icon className="h-5 w-5 mr-2" /> {title}
            </Button>
        </motion.div>
    );
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

export default function DashboardPage() {
  const allNavItems = sidebarSections.flatMap(section => section.items);
  const { selectedYear, setSelectedYear } = useAppState();
  const [isMounted, setIsMounted] = React.useState(false);
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
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (isMounted) {
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
        
        const years = new Set<number>([today.getFullYear()]);

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            let data;
            try {
                data = JSON.parse(localStorage.getItem(key)!);
            } catch { continue; }

            if(data.date) {
                const dateObj = new Date(data.date);
                if (!isNaN(dateObj.getTime())) {
                    years.add(dateObj.getFullYear());
                    
                    if (dateObj.getFullYear() === selectedYear) {
                        if(key.startsWith('invoice-')) {
                            newStats.yearGrossSales += data.totals?.grossSale || 0;
                            newStats.yearNetSales += data.totals?.netSale || 0;
                            newStats.yearExpenses += data.totals?.totalExpenses || 0;
                            newStats.pattiSold += data.totals?.pattiQty || 0;
                            newStats.dabbaSold += data.totals?.dabbaQty || 0;
                            
                            if(dateObj.toDateString() === today.toDateString()) {
                                newStats.todaySales += data.totals?.netSale || 0;
                                newStats.todayPatti += data.totals?.pattiQty || 0;
                                newStats.todayDabba += data.totals?.dabbaQty || 0;
                            }
                            if (dateObj.getMonth() === currentMonth) {
                                newStats.monthSales += data.totals?.netSale || 0;
                            }
                            if (data.customerName) {
                                growerSales[data.customerName] = (growerSales[data.customerName] || 0) + (data.totals?.netSale || 0);
                            }
                        }
                        if(key.startsWith('receipt-')) {
                             const patti = (data.entries || []).reduce((acc: number, e: any) => acc + (Number(e.peti) || 0), 0);
                             const dabba = (data.entries || []).reduce((acc: number, e: any) => acc + (Number(e.daba) || 0), 0);
                             newStats.pattiReceived += patti;
                             newStats.dabbaReceived += dabba;
                        }
                        if(key.startsWith('challan-')) {
                            newStats.pattiSent += data.totalPetti || 0;
                            newStats.dabbaSent += data.totalDabba || 0;
                        }
                        if(key.startsWith('advance-')) {
                            if (data.type === 'Discount' && dateObj.getMonth() === currentMonth) {
                                newLoyaltyStats.redeemedMonth += data.amount || 0;
                            }
                        }
                    }
                }
            }
        }

        setAvailableYears(Array.from(years).sort((a,b) => b-a));

        newLoyaltyStats.totalPoints = Math.floor(Object.values(growerSales).reduce((acc, sale) => acc + sale, 0) * 0.01);
        const sortedGrowers = Object.entries(growerSales).sort(([,a],[,b]) => b-a);
        if(sortedGrowers.length > 0) {
            newLoyaltyStats.topGrower = {
                name: sortedGrowers[0][0],
                points: Math.floor(sortedGrowers[0][1] * 0.01),
            }
        }
        setTopGrowers(sortedGrowers.slice(0, 5).map(([name, netSales]) => ({name, netSales})));

        setStats(newStats);
        setLoyaltyStats(newLoyaltyStats);
    }
  }, [selectedYear, isMounted]);

  const grossProfitMargin = stats.yearGrossSales > 0 ? ((stats.yearNetSales / stats.yearGrossSales) * 100).toFixed(0) : 0;
  
  const summaryCards = [
    { title: "Today's Sales (Net)", value: `₹${stats.todaySales.toLocaleString()}`, description: `From ${stats.todayPatti} Patti / ${stats.todayDabba} Dabba`, icon: DollarSign },
    { title: "This Month's Sales (Net)", value: `₹${stats.monthSales.toLocaleString()}`, description: "Current calendar month", icon: Calendar },
    { title: "This Year's Gross Sales", value: `₹${stats.yearGrossSales.toLocaleString()}`, description: "Total sale value this year", icon: TrendingUp },
    { title: "This Year's Net Sales", value: `₹${stats.yearNetSales.toLocaleString()}`, description: "After all expenses", icon: TrendingUp },
    { title: "Total Yearly Expenses", value: `₹${stats.yearExpenses.toLocaleString()}`, description: "From all sales invoices", icon: TrendingUp },
    { title: "Gross Profit Margin", value: `${grossProfitMargin}%`, description: "Net / Gross Sales", icon: BarChart },
    { title: "Total Patti Received", value: stats.pattiReceived.toLocaleString(), description: "This year via Goods Receipt", icon: FileText },
    { title: "Total Dabba Received", value: stats.dabbaReceived.toLocaleString(), description: "This year via Goods Receipt", icon: FileText },
    { title: "Total Nugs Received", value: (stats.pattiReceived + stats.dabbaReceived).toLocaleString(), description: "Patti + Dabba this year", icon: FileText },
    { title: "Total Patti Sold (Local)", value: stats.pattiSold.toLocaleString(), description: "This year in Sopore Mandi", icon: ShoppingCart },
    { title: "Total Dabba Sold (Local)", value: stats.dabbaSold.toLocaleString(), description: "This year in Sopore Mandi", icon: ShoppingCart },
    { title: "Total Nugs Sold (Local)", value: (stats.pattiSold + stats.dabbaSold).toLocaleString(), description: "Patti + Dabba this year", icon: FileText },
    { title: "Total Patti Sent Outside", value: stats.pattiSent.toLocaleString(), description: "This year via Challan", icon: Users },
    { title: "Total Dabba Sent Outside", value: stats.dabbaSent.toLocaleString(), description: "This year via Challan", icon: Users },
    { title: "Total Nugs Sent Outside", value: (stats.pattiSent + stats.dabbaSent).toLocaleString(), description: "Patti + Dabba this year", icon: Users },
  ];

  if (!isMounted) {
      return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div 
        className="space-y-8 pb-20"
        initial="hidden"
        animate="visible"
        variants={listContainerVariants}
    >
        <Card className="text-center bg-transparent border-none">
            <CardHeader>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: 0.2, type: 'spring' }}} className="mx-auto w-fit p-4 mb-2">
                    <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">FCO BILLING SYSTEM</h1>
                </motion.div>
                <CardDescription className="text-lg text-gray-300/80 mt-2 font-medium tracking-wide">
                    The Modern Intelligence Engine for Sopore Mandi.
                </CardDescription>
            </CardHeader>
        </Card>

        <motion.div variants={listContainerVariants}>
             <Card className="bg-card/60 backdrop-blur-sm border-white/10 shadow-2xl">
                <CardHeader>
                    <CardTitle>App Sections</CardTitle>
                </CardHeader>
                <CardContent>
                     <motion.div 
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                        variants={listContainerVariants}
                    >
                         {allNavItems.map((item, index) => (
                            <NavTile 
                                key={index}
                                title={item.name} 
                                icon={item.icon} 
                                href={item.href}
                            />
                        ))}
                    </motion.div>
                </CardContent>
            </Card>
        </motion.div>
        
        <motion.div className="space-y-6" variants={listContainerVariants}>
             <div className="flex justify-between items-center bg-card/40 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg">
                 <h2 className="text-xl font-black text-white/90 tracking-tighter">FINANCIAL INTELLIGENCE ({selectedYear})</h2>
                 <Select onValueChange={(value) => setSelectedYear(Number(value))} defaultValue={String(selectedYear)}>
                     <SelectTrigger className="w-[180px] bg-card/60 border-white/10 shadow-inner">
                        <SelectValue placeholder="Select Year" />
                     </SelectTrigger>
                     <SelectContent>
                        {availableYears.map(year => (
                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                        ))}
                     </SelectContent>
                 </Select>
             </div>
             <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                variants={listContainerVariants}
                style={{ perspective: "1200px" }}
            >
                {summaryCards.map((card, i) => (
                    <SummaryCard key={i} {...card} />
                ))}
            </motion.div>
        </motion.div>

         <motion.div className="space-y-4" variants={listContainerVariants}>
             <h2 className="text-xl font-bold text-white/80 uppercase tracking-widest pl-2">Quick Commands</h2>
             <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
                variants={listContainerVariants}
             >
                <QuickActionButton title="Sales Entry" icon={PlusCircle} href="/sales" />
                <QuickActionButton title="Watak Register" icon={FileText} href="/watak-register" />
                <QuickActionButton title="Purchases" icon={ShoppingCart} href="/purchases" />
                <QuickActionButton title="Khata Ledger" icon={BookOpen} href="/khata" />
            </motion.div>
        </motion.div>
        
         <motion.div className="space-y-4" variants={listContainerVariants}>
            <h2 className="text-xl font-bold text-white/80 uppercase tracking-widest pl-2">Grower Insights ({selectedYear})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={listContainerVariants} style={{ perspective: "1000px" }}>
                    <Card className="bg-card/60 backdrop-blur-sm border-white/10 h-full shadow-2xl">
                        <CardHeader>
                            <CardTitle>Loyalty Summary</CardTitle>
                            <CardDescription>Grower rewards distribution.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4">
                            <SummaryCard title="Earned Points" value={loyaltyStats.totalPoints.toLocaleString()} description="Points rewarded this season" icon={Users} />
                            <SummaryCard title="Redeemed (₹)" value={`₹${loyaltyStats.redeemedMonth.toLocaleString()}`} description="Value given as discounts" icon={DollarSign} />
                            <SummaryCard title="Top Contributor" value={loyaltyStats.topGrower.name} description={`${loyaltyStats.topGrower.points.toLocaleString()} pts accumulated`} icon={Award} />
                        </CardContent>
                    </Card>
                </motion.div>
                 <motion.div variants={listContainerVariants} style={{ perspective: "1000px" }}>
                    <Card className="bg-card/60 backdrop-blur-sm border-white/10 h-full shadow-2xl overflow-hidden">
                        <CardHeader>
                            <CardTitle>Premier Growers</CardTitle>
                            <CardDescription>Ranked by net sales contributions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                {topGrowers.map((grower, i) => (
                                    <motion.li 
                                        key={grower.name} 
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary font-black text-lg shadow-lg">{i + 1}</div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white">{grower.name}</p>
                                            <p className="text-xs text-muted-foreground">Premier Partner</p>
                                        </div>
                                        <p className="font-mono text-xl font-bold text-green-400">₹{grower.netSales.toLocaleString()}</p>
                                    </motion.li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    </motion.div>
  );
}
