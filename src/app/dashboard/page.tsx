'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { sidebarSections } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, ShoppingCart, Users, DollarSign, Calendar, BarChart, FileText, BookOpen, PlusCircle, Award, Loader2, RefreshCw, Cloud, Sparkles, LayoutDashboard } from 'lucide-react';
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
             whileHover={{ y: -8, scale: 1.02 }}
             whileTap={{ scale: 0.97 }}
        >
            <div className="neon-glow-container cursor-pointer h-full flex items-center justify-start p-5 w-full glass-panel rounded-2xl text-card-foreground font-bold transition-all duration-500 hover:bg-white/5 group border-white/5 hover:border-accent/40">
                <Icon className="neon-glow-icon h-5 w-5 mr-4 text-muted-foreground group-hover:text-accent transition-all duration-500" />
                <span className="text-xs tracking-wider uppercase">{title}</span>
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
                className="w-full h-16 text-xs font-black tracking-widest glass-panel border-white/5 hover:bg-accent hover:text-black hover:border-accent/50 shadow-2xl transition-all duration-500 rounded-2xl"
                onClick={() => router.push(href)}
            >
                <Icon className="h-5 w-5 mr-3" /> {title}
            </Button>
        </motion.div>
    );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.3 }
  }
};

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
        className="space-y-12 pb-32 max-w-[1600px] mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
    >
        {/* Futuristic Cinematic Header */}
        <section className="text-center py-20 relative overflow-hidden rounded-[3rem] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 shadow-2xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.2)_0%,transparent_70%)] opacity-50" />
            
            <motion.div initial={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }} animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} className="relative z-10">
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                    <Sparkles className="h-3 w-3" /> F.CO Intelligent Terminal
                </div>
                <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-6 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                    F.CO BILLING <span className="text-accent underline decoration-accent/20 underline-offset-8">OS</span>
                </h1>
                <p className="text-xl text-muted-foreground font-semibold max-w-2xl mx-auto opacity-70 leading-relaxed text-balance">
                    Advanced Mandi operations engine for Firdous Ahmad & Company. Streamlining growth through data-driven decisions.
                </p>
            </motion.div>

            <div className="absolute right-10 top-10 flex items-center gap-4">
                {isSyncing ? (
                    <Badge variant="outline" className="bg-accent/10 animate-pulse text-accent border-accent/20 py-2 px-4 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        <RefreshCw className="h-3 w-3 animate-spin mr-2" /> Syncing Node
                    </Badge>
                ) : (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-2 px-4 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        <Cloud className="h-3 w-3 mr-2" /> Local Engine Secure
                    </Badge>
                )}
            </div>
        </section>

        {/* Dynamic Context Bar */}
        <div className="flex justify-between items-center glass-panel p-8 rounded-[2.5rem]">
             <div className="flex items-center gap-6">
                <div className="h-12 w-1.5 bg-accent rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-1">FINANCIAL CORE</h2>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Real-time performance metrics</p>
                </div>
             </div>
             <Select onValueChange={(value) => setSelectedYear(Number(value))} defaultValue={String(selectedYear)}>
                 <SelectTrigger className="w-[180px] h-14 bg-white/5 border-white/10 rounded-2xl font-black text-xs tracking-widest hover:bg-white/10 transition-all">
                    <Calendar className="h-4 w-4 mr-3 text-accent" />
                    <SelectValue placeholder="YEAR" />
                 </SelectTrigger>
                 <SelectContent className="glass-panel rounded-2xl border-white/10">
                    {availableYears.map(year => (
                        <SelectItem key={year} value={String(year)} className="font-black text-xs py-3">{year}</SelectItem>
                    ))}
                 </SelectContent>
             </Select>
        </div>

        {/* Spatial Summary Grid */}
        <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
        >
            {summaryCards.map((card, i) => (
                <SummaryCard key={i} {...card} />
            ))}
        </motion.div>

        {/* Operations Hub */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
            {/* Modular Nav Grid */}
            <Card className="xl:col-span-2 glass-panel border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                <CardHeader className="border-b border-white/5 bg-white/[0.02] p-8">
                    <CardTitle className="text-sm font-black tracking-[0.2em] flex items-center gap-3 text-muted-foreground uppercase">
                        <LayoutDashboard className="h-4 w-4 text-accent" /> System Modules
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-10">
                     <motion.div 
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5"
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

            {/* Quick Terminal */}
            <div className="space-y-8">
                <div className="glass-panel p-8 rounded-[3rem] flex flex-col gap-6 shadow-2xl">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] pl-1">Primary Actions</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <QuickActionButton title="NEW SALE INVOICE" icon={PlusCircle} href="/sales" />
                        <QuickActionButton title="WATAK REGISTER" icon={FileText} href="/watak-register" />
                        <QuickActionButton title="PURCHASE TERMINAL" icon={ShoppingCart} href="/purchases" />
                        <QuickActionButton title="ACCOUNT LEDGERS" icon={BookOpen} href="/khata" />
                    </div>
                </div>

                {/* Premier Highlight */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="glass-panel p-8 rounded-[3rem] border-accent/20 bg-gradient-to-br from-accent/10 via-transparent to-transparent relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Users className="h-24 w-24" />
                    </div>
                    <h3 className="text-[10px] font-black flex items-center gap-2 text-accent uppercase tracking-widest mb-6">
                        <Award className="h-4 w-4" /> Leading Partner
                    </h3>
                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-accent/20 flex items-center justify-center border border-accent/30 shadow-2xl shadow-accent/20">
                            <Users className="h-8 w-8 text-accent" />
                        </div>
                        <div>
                            <p className="text-xl font-black text-white tracking-tight">{loyaltyStats.topGrower.name}</p>
                            <p className="text-[10px] text-accent font-black uppercase tracking-widest mt-1">
                                {loyaltyStats.topGrower.points.toLocaleString()} Loyalty Nodes
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
        
        {/* Performance Rankings */}
        <section className="space-y-8">
            <div className="flex items-center gap-6">
                <div className="h-12 w-1.5 bg-accent rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-none mb-1">GROWER HIERARCHY ({selectedYear})</h2>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Top producers by net yield</p>
                </div>
            </div>
            
            <Card className="glass-panel border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-white/5">
                        {topGrowers.map((grower, i) => (
                            <motion.div 
                                key={grower.name}
                                variants={{
                                    hidden: { opacity: 0, scale: 0.9 },
                                    visible: { opacity: 1, scale: 1 }
                                }}
                                className="p-10 hover:bg-white/[0.03] transition-all group relative"
                            >
                                <div className="text-[9px] font-black text-muted-foreground mb-6 flex items-center gap-3 group-hover:text-accent transition-colors">
                                    <span className="h-6 w-6 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-accent group-hover:text-black transition-all font-black text-xs shadow-lg">
                                        {i + 1}
                                    </span>
                                    INDEX RANK
                                </div>
                                <p className="text-lg font-black text-white mb-2 group-hover:translate-x-2 transition-transform duration-500">{grower.name}</p>
                                <p className="text-2xl font-black text-accent drop-shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                                    ₹{grower.netSales.toLocaleString()}
                                </p>
                                <div className="absolute bottom-0 left-0 h-1 w-0 bg-accent group-hover:w-full transition-all duration-700" />
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </section>
    </motion.div>
  );
}