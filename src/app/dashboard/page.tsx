'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { sidebarSections } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingCart, Users, DollarSign, Calendar, BarChart, FileText, BookOpen, PlusCircle, Award, Loader2, RefreshCw, Cloud, Sparkles, LayoutDashboard, Search, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SummaryCard } from '@/components/ui/summary-card';
import { useAppState } from '@/contexts/app-state-context';
import { Badge } from '@/components/ui/badge';
import { MarketInsights } from '@/components/MarketInsights';
import { Input } from '@/components/ui/input';

const Greeting = () => {
    const [greeting, setGreeting] = React.useState('Good Day');
    React.useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 17) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12"
        >
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase drop-shadow-2xl">
                {greeting}, <span className="text-accent">Faisal</span>
            </h1>
            <p className="text-xs font-black text-muted-foreground tracking-[0.5em] uppercase mt-3 opacity-60">
                F.CO BILLING OS • SECURE SESSION
            </p>
        </motion.div>
    );
};

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
            <div className="neon-glow-container cursor-pointer h-full flex items-center justify-start p-6 w-full glass-panel rounded-3xl text-card-foreground font-black transition-all duration-500 hover:bg-white/10 group border-white/5 hover:border-accent/50 shadow-xl">
                <Icon className="neon-glow-icon h-6 w-6 mr-5 text-muted-foreground group-hover:text-accent transition-all duration-500" />
                <span className="text-[10px] tracking-[0.2em] uppercase font-black">{title}</span>
            </div>
        </motion.div>
    );
};

const QuickActionButton = ({ title, icon: Icon, href, variant = "secondary" as const }: { title: string, icon: React.ElementType, href: string, variant?: any }) => {
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
                variant={variant}
                className="w-full h-20 text-xs font-black tracking-[0.2em] glass-panel border-white/5 hover:bg-accent hover:text-black hover:border-accent/60 shadow-2xl transition-all duration-500 rounded-[1.5rem] uppercase"
                onClick={() => router.push(href)}
            >
                <Icon className="h-5 w-5 mr-4" /> {title}
            </Button>
        </motion.div>
    );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.4 }
  }
};

export default function DashboardPage() {
  const allNavItems = sidebarSections.flatMap(section => section.items);
  const { selectedYear, setSelectedYear } = useAppState();
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);
  const [availableYears, setAvailableYears] = React.useState<number[]>([]);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [globalSearch, setGlobalSearch] = React.useState('');
  const [lastBackup, setLastBackup] = React.useState('Syncing...');
  
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
    setLastBackup(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);
  // Re-fetch when MongoDB sync completes
React.useEffect(() => {
  window.addEventListener('mongodb-synced', () => setIsMounted(true));
  return () => window.removeEventListener('mongodb-synced', () => setIsMounted(true));
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
            if (data.date || data.createdAt) {

    const rawDate = data.date || data.createdAt;
    const dateObj = new Date(rawDate);

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
        const extractedYears = Array.from(years);

if (!extractedYears.includes(2025)) {
    extractedYears.push(2025);
}

setAvailableYears(extractedYears.sort((a, b) => b - a));
if (!extractedYears.includes(selectedYear)) {
    setSelectedYear(extractedYears[0]);
}

        

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
    { title: "Today's Yield", value: `₹${stats.todaySales}`, description: `${stats.todayPatti} Patti / ${stats.todayDabba} Dabba transactions finalized today.`, icon: DollarSign },
    { title: "Monthly Index", value: `₹${stats.monthSales}`, description: `Consolidated net revenue performance for the current calendar month.`, icon: TrendingUp },
    { title: "YTD Gross", value: `₹${stats.yearGrossSales}`, description: `Aggregated seasonal gross revenue for the entire ${selectedYear} mandate.`, icon: BarChart },
    { title: "Net Efficiency", value: `${grossProfitMargin}%`, description: `Calculated operational profitability margin after mandated expenses.`, icon: Award },
    { title: "Inward Nodes", value: (stats.pattiReceived + stats.dabbaReceived).toString(), description: `Total supply units processed into the F.Co mandi network.`, icon: ShoppingCart },
    { title: "Outward Log", value: (stats.pattiSent + stats.dabbaSent).toString(), description: `Global unit distribution tracked via delivery note protocols.`, icon: Users },
  ];

  const handleGlobalSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && globalSearch.trim()) {
          router.push(`/smart-search?q=${encodeURIComponent(globalSearch.trim())}`);
      }
  };

  if (!isMounted) {
      return <div className="min-h-screen flex items-center justify-center bg-[#020205]"><Loader2 className="h-16 w-16 animate-spin text-accent" /></div>;
  }

  return (
    <motion.div 
        className="space-y-16 pb-40 max-w-[1700px] mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
    >
        {/* Personalized Greeting */}
        <Greeting />

        {/* Cinematic Operational Hero */}
        <section className="text-center py-24 relative overflow-hidden rounded-[4rem] bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 shadow-2xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.25)_0%,transparent_70%)] opacity-60" />
            
            <motion.div initial={{ scale: 0.9, opacity: 0, filter: "blur(15px)" }} animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 px-6">
                <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-accent/15 border border-accent/30 text-accent text-[11px] font-black uppercase tracking-[0.4em] mb-10 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                    <Sparkles className="h-4 w-4" /> MANDI TERMINAL SECURE
                </div>
                <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter mb-8 drop-shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
                    F.CO BILLING <span className="text-accent underline decoration-accent/30 underline-offset-[12px] decoration-8">OS</span>
                </h1>
                
                {/* Global Omni-Search Bar */}
                <div className="relative max-w-2xl mx-auto mb-12">
                    <div className="absolute inset-0 bg-accent/20 blur-3xl opacity-20 -z-10" />
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-accent opacity-50" />
                    <Input 
                        placeholder="SEARCH EVERYTHING: GROWERS, WATAKS, RECEIPTS..." 
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        onKeyDown={handleGlobalSearch}
                        className="h-20 pl-16 pr-8 rounded-[2rem] bg-white/5 border-white/10 focus:border-accent/50 text-base font-black uppercase tracking-widest shadow-2xl"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black opacity-30 tracking-[0.2em]">PRESS ENTER</div>
                </div>

                <p className="text-2xl text-muted-foreground font-bold max-w-3xl mx-auto opacity-80 leading-relaxed text-balance">
                    Intelligence-driven operations for Firdous Ahmad & Company. Streamlining seasonal yields through advanced data orchestration.
                </p>
            </motion.div>

            <div className="absolute right-12 top-12 flex flex-col items-end gap-2">
                {isSyncing ? (
                    <Badge variant="outline" className="bg-accent/15 animate-pulse text-accent border-accent/30 py-3 px-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em]">
                        <RefreshCw className="h-4 w-4 animate-spin mr-3" /> SYNCING CORE
                    </Badge>
                ) : (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/25 py-3 px-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em]">
                        <Cloud className="h-4 w-4 mr-3" /> LOCAL ENGINE SAFE
                    </Badge>
                )}
                <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest mr-2">
                    <Clock className="h-3 w-3" /> LAST CLOUD BACKUP: {lastBackup}
                </div>
            </div>
        </section>

        {/* Spatial Intelligence Grid */}
        <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
            variants={containerVariants}
        >
            {summaryCards.map((card, i) => (
                <SummaryCard key={i} {...card} />
            ))}
        </motion.div>

        {/* Market Insights Integration */}
        <MarketInsights selectedYear={selectedYear} />

        {/* Global Context Bar */}
        <div className="flex justify-between items-center glass-panel p-10 rounded-[3.5rem] border-accent/10">
             <div className="flex items-center gap-8">
                <div className="h-16 w-2 bg-accent rounded-full shadow-[0_0_25px_rgba(34,197,94,0.6)]" />
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-2 uppercase">Core System Control</h2>
                    <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.3em]">Operational Year: {selectedYear}</p>
                </div>
             </div>
             <div className="flex items-center gap-6">
                <Select onValueChange={(value) => setSelectedYear(Number(value))} defaultValue={String(selectedYear)}>
                    <SelectTrigger className="w-[220px] h-16 bg-white/5 border-white/10 rounded-2xl font-black text-xs tracking-[0.2em] hover:bg-white/10 transition-all uppercase px-6">
                        <Calendar className="h-5 w-5 mr-4 text-accent" />
                        <SelectValue placeholder="YEAR" />
                    </SelectTrigger>
                    <SelectContent className="glass-panel rounded-2xl border-white/10 p-2">
                        {availableYears.map(year => (
                            <SelectItem key={year} value={String(year)} className="font-black text-xs py-4 rounded-xl">{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button variant="outline" size="icon" className="h-16 w-16 rounded-2xl border-white/10 bg-white/5 hover:bg-accent hover:text-black transition-all" title="Secure Database Status">
                    <ShieldCheck className="h-6 w-6" />
                </Button>
             </div>
        </div>

        {/* Command & Control Hub */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
            <Card className="xl:col-span-2 glass-panel border-white/5 rounded-[4rem] overflow-hidden shadow-2xl">
                <CardHeader className="border-b border-white/5 bg-white/[0.03] p-10">
                    <CardTitle className="text-xs font-black tracking-[0.3em] flex items-center gap-4 text-muted-foreground uppercase">
                        <LayoutDashboard className="h-5 w-5 text-accent" /> Infrastructure Modules
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-12">
                     <motion.div 
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6"
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

            <div className="space-y-10">
                <div className="glass-panel p-10 rounded-[4rem] flex flex-col gap-8 shadow-2xl">
                    <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] pl-2 border-l-2 border-accent">Critical Actions</h3>
                    <div className="grid grid-cols-1 gap-5">
                        <QuickActionButton title="INITIATE SALE WATAK" icon={PlusCircle} href="/sales" variant="default" />
                        <QuickActionButton title="WATAK ARCHIVE" icon={FileText} href="/watak-register" />
                        <QuickActionButton title="PURCHASE NODE" icon={ShoppingCart} href="/purchases" />
                        <QuickActionButton title="FINANCIAL LEDGERS" icon={BookOpen} href="/khata" />
                    </div>
                </div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="glass-panel p-10 rounded-[4rem] border-accent/25 bg-gradient-to-br from-accent/10 via-transparent to-transparent relative overflow-hidden group shadow-2xl"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000">
                        <Users className="h-32 w-32" />
                    </div>
                    <h3 className="text-[11px] font-black flex items-center gap-3 text-accent uppercase tracking-[0.25em] mb-8">
                        <Award className="h-5 w-5" /> PREMIER PARTNER
                    </h3>
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-[2rem] bg-accent/20 flex items-center justify-center border border-accent/40 shadow-2xl shadow-accent/25 group-hover:rotate-12 transition-transform duration-700">
                            <Users className="h-10 w-10 text-accent" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white tracking-tight group-hover:translate-x-2 transition-transform duration-500">{loyaltyStats.topGrower.name}</p>
                            <p className="text-[11px] text-accent font-black uppercase tracking-[0.2em] mt-2">
                                {loyaltyStats.topGrower.points.toLocaleString()} OPERATIONAL NODES
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
        
        {/* Performance Hierarchies */}
        <section className="space-y-10">
            <div className="flex items-center gap-8">
                <div className="h-16 w-2 bg-accent rounded-full shadow-[0_0_25px_rgba(34,197,94,0.6)]" />
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-none mb-2">SUPPLY HIERARCHY ({selectedYear})</h2>
                    <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.3em]">Top Tier Producers by Seasonal Yield Index</p>
                </div>
            </div>
            
            <Card className="glass-panel border-white/5 rounded-[4rem] overflow-hidden shadow-2xl">
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-white/5">
                        {topGrowers.map((grower, i) => (
                            <motion.div 
                                key={grower.name}
                                variants={{
                                    hidden: { opacity: 0, scale: 0.9 },
                                    visible: { opacity: 1, scale: 1 }
                                }}
                                className="p-12 hover:bg-white/[0.04] transition-all group relative overflow-hidden"
                            >
                                <div className="text-[10px] font-black text-muted-foreground mb-8 flex items-center gap-4 group-hover:text-accent transition-colors">
                                    <span className="h-8 w-8 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-accent group-hover:text-black transition-all font-black text-xs shadow-xl">
                                        {i + 1}
                                    </span>
                                    INDEX RANK
                                </div>
                                <p className="text-xl font-black text-white mb-3 group-hover:translate-x-3 transition-transform duration-700">{grower.name}</p>
                                <h3 className="text-3xl font-black text-accent drop-shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                                    ₹{grower.netSales.toLocaleString()}
                                </h3>
                                <div className="absolute bottom-0 left-0 h-1.5 w-0 bg-accent group-hover:w-full transition-all duration-1000" />
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </section>
    </motion.div>
  );
}


