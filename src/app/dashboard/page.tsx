
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { sidebarSections } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, ShoppingCart, Users, DollarSign, Calendar, BarChart, FileText, BookOpen, PlusCircle, Award, Loader2, RefreshCw, Cloud, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SummaryCard } from '@/components/ui/summary-card';
import { useAppState } from '@/contexts/app-state-context';
import { Badge } from '@/components/ui/badge';

const NavTile = ({ title, icon: Icon, href }: { title: string, icon: React.ElementType, href: string }) => {
    const router = useRouter();

    return (
        <motion.div
            className="w-full h-full"
            onClick={() => router.push(href)}
            variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
            }}
             whileHover={{ y: -5, scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
        >
            <div className="neon-glow-container cursor-pointer h-full flex items-center justify-start p-4 w-full glass-panel rounded-xl text-card-foreground font-semibold transition-all duration-300 hover:bg-white/5 group border-white/5 hover:border-accent/30">
                <Icon className="neon-glow-icon h-5 w-5 mr-3 text-muted-foreground group-hover:text-accent transition-all duration-300" />
                <span className="text-sm tracking-tight">{title}</span>
            </div>
        </motion.div>
    );
};

const QuickActionButton = ({ title, icon: Icon, href }: { title: string, icon: React.ElementType, href: string }) => {
    const router = useRouter();
    return (
        <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
            }}
        >
            <Button
                variant="secondary"
                className="w-full h-16 text-sm font-bold glass-panel border-white/5 hover:bg-white/10 hover:border-accent/30 shadow-xl"
                onClick={() => router.push(href)}
            >
                <Icon className="h-5 w-5 mr-3 text-accent" /> {title}
            </Button>
        </motion.div>
    );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.2 }
  }
};

const AnimatedValue = ({ value }: { value: string | number }) => {
    // Simple spring-based count-up could be added here, but for now we focus on visual stability
    return <span>{value}</span>;
}

export default function DashboardPage() {
  const allNavItems = sidebarSections.flatMap(section => section.items);
  const { selectedYear, setSelectedYear } = useAppState();
  const [isMounted, setIsMounted] = React.useState(false);
  const [availableYears, setAvailableYears] = React.useState<number[]>([]);
  const [isSyncing, setIsSyncing] = React.useState(false);
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
    { title: "Today's Sales", value: `₹${stats.todaySales.toLocaleString()}`, description: `${stats.todayPatti} Patti / ${stats.todayDabba} Dabba sold today`, icon: DollarSign },
    { title: "Monthly Performance", value: `₹${stats.monthSales.toLocaleString()}`, description: `Net sales for ${new Date().toLocaleString('default', { month: 'long' })}`, icon: TrendingUp },
    { title: "YTD Gross Revenue", value: `₹${stats.yearGrossSales.toLocaleString()}`, description: `Total revenue for ${selectedYear}`, icon: BarChart },
    { title: "YTD Profit Margin", value: `${grossProfitMargin}%`, description: `Current profitability for ${selectedYear}`, icon: Award },
    { title: "Inventory Inward", value: (stats.pattiReceived + stats.dabbaReceived).toLocaleString(), description: `Total units received this year`, icon: ShoppingCart },
    { title: "Logistics Outward", value: (stats.pattiSent + stats.dabbaSent).toLocaleString(), description: `Total units sent outside via Challan`, icon: Users },
  ];

  if (!isMounted) {
      return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-accent" /></div>;
  }

  return (
    <motion.div 
        className="space-y-10 pb-24 max-w-[1600px] mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
    >
        {/* Cinematic Header Section */}
        <section className="text-center py-12 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-white/5 to-transparent border border-white/5">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.15)_0%,transparent_70%)]" />
            
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest mb-6">
                    <Sparkles className="h-3 w-3" /> Sopore Mandi Intelligence
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    FCO BILLING <span className="text-accent">OS</span>
                </h1>
                <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto opacity-80 leading-relaxed">
                    The modern command center for Firdous Ahmad & Company. Complete control over your Mandi operations.
                </p>
            </motion.div>

            <div className="absolute right-8 top-8 flex items-center gap-3">
                {isSyncing ? (
                    <Badge variant="outline" className="bg-accent/10 animate-pulse text-accent border-accent/20 py-1.5 px-3 rounded-full">
                        <RefreshCw className="h-3 w-3 animate-spin mr-2" /> Auto-Syncing
                    </Badge>
                ) : (
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 py-1.5 px-3 rounded-full">
                        <Cloud className="h-3 w-3 mr-2" /> Local Data Safe
                    </Badge>
                )}
            </div>
        </section>

        {/* Global Year Filter Bar */}
        <div className="flex justify-between items-center glass-panel p-6 rounded-2xl">
             <div className="flex items-center gap-4">
                <div className="h-10 w-1 bg-accent rounded-full" />
                <h2 className="text-xl font-black text-white tracking-tight">FINANCIAL OVERVIEW</h2>
             </div>
             <Select onValueChange={(value) => setSelectedYear(Number(value))} defaultValue={String(selectedYear)}>
                 <SelectTrigger className="w-[160px] h-12 bg-white/5 border-white/10 rounded-xl font-bold">
                    <Calendar className="h-4 w-4 mr-2 text-accent" />
                    <SelectValue placeholder="Year" />
                 </SelectTrigger>
                 <SelectContent className="glass-panel">
                    {availableYears.map(year => (
                        <SelectItem key={year} value={String(year)} className="font-bold">{year}</SelectItem>
                    ))}
                 </SelectContent>
             </Select>
        </div>

        {/* 3D Summary Cards Grid */}
        <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
        >
            {summaryCards.map((card, i) => (
                <SummaryCard key={i} {...card} />
            ))}
        </motion.div>

        {/* Application Navigation & Quick Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Nav Grid */}
            <Card className="xl:col-span-2 glass-panel border-white/5 rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                    <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                        <LayoutDashboard className="h-5 w-5 text-accent" /> SYSTEM MODULES
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                     <motion.div 
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                        variants={containerVariants}
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

            {/* Quick Actions */}
            <div className="space-y-6">
                <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-1">Quick Terminal</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <QuickActionButton title="NEW SALE" icon={PlusCircle} href="/sales" />
                        <QuickActionButton title="WATAK REGISTER" icon={FileText} href="/watak-register" />
                        <QuickActionButton title="PURCHASE ENTRY" icon={ShoppingCart} href="/purchases" />
                        <QuickActionButton title="KHATA LEDGER" icon={BookOpen} href="/khata" />
                    </div>
                </div>

                {/* Loyalty Mini Highlight */}
                <Card className="glass-panel border-accent/20 rounded-3xl bg-gradient-to-br from-accent/10 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black flex items-center gap-2">
                            <Award className="h-4 w-4 text-accent" /> PREMIER PARTNER
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
                                <Users className="h-6 w-6 text-accent" />
                            </div>
                            <div>
                                <p className="text-lg font-black text-white tracking-tight">{loyaltyStats.topGrower.name}</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                    {loyaltyStats.topGrower.points.toLocaleString()} Points Accumulated
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
        
        {/* Premier Growers List */}
        <section className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="h-10 w-1 bg-accent rounded-full" />
                <h2 className="text-xl font-black text-white tracking-tight uppercase">GROWER RANKINGS ({selectedYear})</h2>
            </div>
            
            <Card className="glass-panel border-white/5 rounded-[2rem] overflow-hidden">
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-white/5">
                        {topGrowers.map((grower, i) => (
                            <motion.div 
                                key={grower.name}
                                variants={{
                                    hidden: { opacity: 0, scale: 0.9 },
                                    visible: { opacity: 1, scale: 1 }
                                }}
                                className="p-8 hover:bg-white/5 transition-all group"
                            >
                                <div className="text-[10px] font-black text-muted-foreground mb-4 flex items-center gap-2 group-hover:text-accent transition-colors">
                                    <span className="h-4 w-4 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-accent group-hover:text-black transition-all">
                                        {i + 1}
                                    </span>
                                    RANKING
                                </div>
                                <p className="text-lg font-black text-white mb-1 group-hover:translate-x-1 transition-transform">{grower.name}</p>
                                <p className="text-2xl font-black text-accent drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                    ₹{grower.netSales.toLocaleString()}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </section>
    </motion.div>
  );
}
