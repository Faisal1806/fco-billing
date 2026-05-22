'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, TrendingUp, TrendingDown, Users, Apple, Wallet, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface InsightData {
    averageRateThisWeek: number;
    averageRateLastWeek: number;
    topVariety: string;
    topGrower: string;
    topCustomer: string;
    estCommission: number;
    rateChange: number;
}

export const MarketInsights = ({ selectedYear }: { selectedYear: number }) => {
    const [insights, setInsights] = React.useState<InsightData | null>(null);

    React.useEffect(() => {
        const today = new Date();
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

        let thisWeekSum = 0;
        let thisWeekQty = 0;
        let lastWeekSum = 0;
        let lastWeekQty = 0;

        const varietyCounts: { [key: string]: number } = {};
        const growerSales: { [key: string]: number } = {};
        const customerSales: { [key: string]: number } = {};
        let totalComm = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key?.startsWith('invoice-')) continue;

            try {
                const data = JSON.parse(localStorage.getItem(key)!);
                const date = new Date(data.date);
                if (date.getFullYear() !== selectedYear) continue;

                // Rate Trends
                data.entries.forEach((e: any) => {
                    const rate = Number(e.rate) || 0;
                    const qty = Number(e.qty) || 0;
                    const variety = e.variety || 'Unknown';

                    if (date >= oneWeekAgo) {
                        thisWeekSum += rate * qty;
                        thisWeekQty += qty;
                    } else if (date >= twoWeeksAgo && date < oneWeekAgo) {
                        lastWeekSum += rate * qty;
                        lastWeekQty += qty;
                    }

                    // Top Variety (Monthly)
                    if (date.getMonth() === today.getMonth()) {
                        varietyCounts[variety] = (varietyCounts[variety] || 0) + qty;
                    }
                });

                // Top Parties
                const netSale = data.totals?.netSale || 0;
                const grower = data.customerName; // In Mandi context, "Customer" in invoice is usually the Grower/Supplier
                growerSales[grower] = (growerSales[grower] || 0) + netSale;
                
                // Commission Logic
                totalComm += data.totals?.commissionAmount || 0;

            } catch (e) { console.error(e); }
        }

        const avgThis = thisWeekQty > 0 ? thisWeekSum / thisWeekQty : 0;
        const avgLast = lastWeekQty > 0 ? lastWeekSum / lastWeekQty : 0;
        const change = avgLast > 0 ? ((avgThis - avgLast) / avgLast) * 100 : 0;

        const topV = Object.entries(varietyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        const topG = Object.entries(growerSales).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        setInsights({
            averageRateThisWeek: avgThis,
            averageRateLastWeek: avgLast,
            topVariety: topV,
            topGrower: topG,
            topCustomer: 'Various', // Placeholder if not distinct
            estCommission: totalComm,
            rateChange: change
        });
    }, [selectedYear]);

    if (!insights) return null;

    return (
        <section className="space-y-8 mt-16">
            <div className="flex items-center gap-8">
                <div className="h-16 w-2 bg-blue-500 rounded-full shadow-[0_0_25px_rgba(59,130,246,0.6)]" />
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-none mb-2">Market Intelligence Hub</h2>
                    <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.3em]">AI-Driven analysis of your seasonal trade patterns</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                {/* Rate Trend Card */}
                <motion.div whileHover={{ y: -5 }} className="glass-panel p-8 rounded-[3rem] border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-6">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 py-1.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            Price Index
                        </Badge>
                        <Zap className="h-5 w-5 text-blue-400 opacity-50 group-hover:animate-pulse" />
                    </div>
                    <div className="space-y-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Avg Rate (Last 7 Days)</p>
                        <h3 className="text-4xl font-black text-white tracking-tighter">₹{Math.round(insights.averageRateThisWeek).toLocaleString()}</h3>
                        <div className="flex items-center gap-2">
                            {insights.rateChange >= 0 ? (
                                <div className="flex items-center text-emerald-400 font-black text-xs">
                                    <TrendingUp className="h-4 w-4 mr-1" /> +{insights.rateChange.toFixed(1)}%
                                </div>
                            ) : (
                                <div className="flex items-center text-rose-400 font-black text-xs">
                                    <TrendingDown className="h-4 w-4 mr-1" /> {insights.rateChange.toFixed(1)}%
                                </div>
                            )}
                            <span className="text-[10px] text-muted-foreground font-bold uppercase">vs Prev Week</span>
                        </div>
                    </div>
                </motion.div>

                {/* Top Performer Card */}
                <motion.div whileHover={{ y: -5 }} className="glass-panel p-8 rounded-[3rem] border-accent/20 bg-gradient-to-br from-accent/5 to-transparent relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-6">
                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 py-1.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            Top Variety
                        </Badge>
                        <Apple className="h-5 w-5 text-accent opacity-50 group-hover:scale-125 transition-transform" />
                    </div>
                    <div className="space-y-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Most Traded (This Month)</p>
                        <h3 className="text-3xl font-black text-white tracking-tight truncate">{insights.topVariety}</h3>
                        <p className="text-[10px] text-muted-foreground font-bold leading-relaxed uppercase">Capturing the highest volume in the current inventory cycle.</p>
                    </div>
                </motion.div>

                {/* Supply Chain Card */}
                <motion.div whileHover={{ y: -5 }} className="glass-panel p-8 rounded-[3rem] border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-6">
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 py-1.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            Supply King
                        </Badge>
                        <Users className="h-5 w-5 text-purple-400 opacity-50 group-hover:rotate-12 transition-transform" />
                    </div>
                    <div className="space-y-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Top Revenue Grower</p>
                        <h3 className="text-3xl font-black text-white tracking-tight truncate">{insights.topGrower}</h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Leading the season in net sale value contribution.</p>
                    </div>
                </motion.div>

                {/* Revenue Insight Card */}
                <motion.div whileHover={{ y: -5 }} className="glass-panel p-8 rounded-[3rem] border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-6">
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 py-1.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            Agency Yield
                        </Badge>
                        <Wallet className="h-5 w-5 text-yellow-400 opacity-50 group-hover:translate-y-[-2px] transition-transform" />
                    </div>
                    <div className="space-y-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Estimated Comm. Income</p>
                        <h3 className="text-4xl font-black text-white tracking-tighter">₹{Math.round(insights.estCommission).toLocaleString()}</h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Projected revenue based on current Mandi mandates.</p>
                    </div>
                </motion.div>
            </div>

            {/* AI Narrative Panel */}
            <div className="glass-panel p-10 rounded-[3.5rem] border-white/5 bg-white/[0.02] flex items-center gap-10">
                <div className="h-20 w-20 rounded-[2.5rem] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <BrainCircuit className="h-10 w-10 text-blue-400" />
                </div>
                <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-[0.4em] text-blue-400">Strategic Recommendation</h4>
                    <p className="text-xl text-white/80 font-bold leading-relaxed">
                        {insights.rateChange >= 0 
                            ? `Apple rates have surged by ${insights.rateChange.toFixed(1)}% this week. Consider advising growers to capitalize on this upward trend for higher profitability.`
                            : `Current market rates are showing a minor correction of ${Math.abs(insights.rateChange).toFixed(1)}%. Monitor ${insights.topVariety} stock levels closely to manage margin risks.`
                        }
                    </p>
                </div>
            </div>
        </section>
    );
};

