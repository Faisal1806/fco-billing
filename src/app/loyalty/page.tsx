
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Award, DollarSign, Gift, Loader2, Star, TrendingUp } from 'lucide-react';
import { PartySelector } from '@/components/party-selector';

type TransactionType = 'Sale' | 'Purchase' | 'Advance' | 'Repayment' | 'Bikri' | 'Discount';

type Transaction = {
    id: string;
    date: string;
    type: TransactionType;
    amount: number;
    party: string;
    notes?: string;
};

type PartyStats = {
    netSales: number;
    pointsEarned: number;
    pointsRedeemed: number;
    availablePoints: number;
};

const getCanonicalName = (name: string): string => {
    if (!name) return '';
    return name.trim();
};

export default function LoyaltyPage() {
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const [partyStats, setPartyStats] = useState<{[key: string]: PartyStats}>({});
    const [selectedParty, setSelectedParty] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const transactions: Transaction[] = [];
        const partyData: {[key: string]: { netSales: number, pointsRedeemed: number, transactions: Transaction[] }} = {};

        const addTransaction = (partyName: string, tx: Transaction) => {
            if (!partyName) return;
            const canonical = getCanonicalName(partyName);
            if (!partyData[canonical]) {
                partyData[canonical] = { netSales: 0, pointsRedeemed: 0, transactions: [] };
            }
            partyData[canonical].transactions.push(tx);
            if (tx.type === 'Sale' || tx.type === 'Bikri') {
                 partyData[canonical].netSales += tx.amount;
            }
            if (tx.type === 'Discount') {
                partyData[canonical].pointsRedeemed += tx.amount;
            }
        };

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            try {
                if (key.startsWith('invoice-')) {
                    const doc = JSON.parse(localStorage.getItem(key)!);
                    const tx = { id: key, date: doc.date, type: 'Sale' as TransactionType, amount: doc.totals.netSale, party: doc.customerName, notes: `Watak #${doc.watakNo || doc.sNo}` };
                    transactions.push(tx);
                    addTransaction(doc.customerName, tx);
                } else if (key.startsWith('bikri-')) {
                    const doc = JSON.parse(localStorage.getItem(key)!);
                    if (doc.bikriType === 'growerForwarding' && doc.growerName) {
                        const tx = { id: key, date: doc.date, type: 'Bikri' as TransactionType, amount: doc.calculation.netSalePayableToGrower, party: doc.growerName, notes: `Bikri #${doc.bikriNo}` };
                        transactions.push(tx);
                        addTransaction(doc.growerName, tx);
                    }
                } else if (key.startsWith('advance-')) {
                    const doc = JSON.parse(localStorage.getItem(key)!);
                    if (doc.type === 'Discount') {
                        const tx = { id: key, date: doc.date, type: 'Discount' as TransactionType, amount: doc.amount, party: doc.partyName, notes: `Points Redeemed` };
                        transactions.push(tx);
                        addTransaction(doc.partyName, tx);
                    }
                }
            } catch (e) {
                console.error("Error processing transaction:", key, e);
            }
        }
        
        const calculatedStats: {[key: string]: PartyStats} = {};
        for (const canonicalName in partyData) {
            const data = partyData[canonicalName];
            const pointsFromSales = Math.floor(data.netSales / 500);
            
            calculatedStats[canonicalName] = {
                netSales: data.netSales,
                pointsEarned: pointsFromSales,
                pointsRedeemed: data.pointsRedeemed,
                availablePoints: pointsFromSales - data.pointsRedeemed,
            };
        }

        setAllTransactions(transactions);
        setPartyStats(calculatedStats);
        setIsLoading(false);
    }, []);

    const leaderboard = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyData: {[key: string]: { name: string, netSales: number, points: number }} = {};

        allTransactions.forEach(tx => {
            const txDate = new Date(tx.date);
            if ((tx.type === 'Sale' || tx.type === 'Bikri') && txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
                const canonical = getCanonicalName(tx.party);
                if (!monthlyData[canonical]) {
                    monthlyData[canonical] = { name: tx.party, netSales: 0, points: 0 };
                }
                monthlyData[canonical].netSales += tx.amount;
            }
        });
        
        Object.values(monthlyData).forEach(data => {
            data.points = Math.floor(data.netSales / 500);
        });

        // Add bonus points for top 3
        const sortedBySales = Object.values(monthlyData).sort((a,b) => b.netSales - a.netSales);
        if (sortedBySales[0]) sortedBySales[0].points += 10;
        if (sortedBySales[1]) sortedBySales[1].points += 10;
        if (sortedBySales[2]) sortedBySales[2].points += 10;

        return sortedBySales.slice(0, 10);

    }, [allTransactions]);

    const selectedPartyTransactions = useMemo(() => {
        if (!selectedParty) return [];
        const canonical = getCanonicalName(selectedParty);
        return allTransactions
            .filter(tx => getCanonicalName(tx.party) === canonical && (tx.type === 'Sale' || tx.type === 'Bikri' || tx.type === 'Discount'))
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedParty, allTransactions]);

    const totalStats = useMemo(() => {
        return Object.values(partyStats).reduce((acc, stats) => {
            acc.earned += stats.pointsEarned;
            acc.redeemed += stats.pointsRedeemed;
            acc.available += stats.availablePoints;
            return acc;
        }, { earned: 0, redeemed: 0, available: 0 });
    }, [partyStats]);
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-3xl">🌟 F.Co Loyalty & Rewards</CardTitle>
                    <CardDescription>Earn points every time you sell or trade with F.Co. (1 Point = ₹1)</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard title="Total Points Earned" value={totalStats.earned.toLocaleString()} icon={TrendingUp} />
                    <StatCard title="Points Redeemed (₹)" value={`₹${totalStats.redeemed.toLocaleString()}`} icon={DollarSign} />
                    <StatCard title="Available Points" value={totalStats.available.toLocaleString()} icon={Gift} color="text-green-500" />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>🏆 Monthly Leaderboard</CardTitle>
                        <CardDescription>Top growers for the current month based on sales volume.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rank</TableHead>
                                    <TableHead>Grower Name</TableHead>
                                    <TableHead className="text-right">Points Earned</TableHead>
                                    <TableHead className="text-right">Total Sale (₹)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaderboard.map((grower, index) => {
                                    const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                                    return (
                                        <TableRow key={grower.name}>
                                            <TableCell className="font-bold">{rankIcon}</TableCell>
                                            <TableCell>{grower.name}</TableCell>
                                            <TableCell className="text-right font-mono text-green-500">{grower.points}</TableCell>
                                            <TableCell className="text-right font-mono">₹{grower.netSales.toLocaleString('en-IN')}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>📜 Grower Transaction History</CardTitle>
                        <div className="flex justify-between items-center">
                            <CardDescription>Select a grower to see their points history.</CardDescription>
                            <PartySelector value={selectedParty || ''} onChange={setSelectedParty} filter="grower" />
                        </div>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Points</TableHead>
                                    <TableHead>Ref</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedPartyTransactions.map(tx => {
                                    const isEarned = tx.type === 'Sale' || tx.type === 'Bikri';
                                    const points = isEarned ? `+${Math.floor(tx.amount / 500)}` : `-${tx.amount}`;
                                    return (
                                        <TableRow key={tx.id}>
                                            <TableCell>{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                                            <TableCell>{isEarned ? 'Earned' : 'Redeemed'}</TableCell>
                                            <TableCell className={`font-mono ${isEarned ? 'text-green-500' : 'text-red-500'}`}>{points}</TableCell>
                                            <TableCell>{tx.notes}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                         {!selectedParty && <p className="text-center text-muted-foreground p-8">Please select a grower to view their history.</p>}
                         {selectedParty && selectedPartyTransactions.length === 0 && <p className="text-center text-muted-foreground p-8">No loyalty transactions found for this grower.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string, icon: React.ElementType, color?: string }) => (
    <div className="flex items-center gap-4 bg-muted p-4 rounded-lg">
        <div className={`p-3 rounded-full bg-background`}>
            <Icon className={`h-6 w-6 ${color || 'text-primary'}`} />
        </div>
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);
