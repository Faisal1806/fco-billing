'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Award, DollarSign, Gift, Loader2, Star, TrendingUp, History } from 'lucide-react';
import { PartySelector } from '@/components/party-selector';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { saveDocument, sendPushNotification, getDocuments } from '@/lib/actions';
import { Input } from '@/components/ui/input';

type TransactionType = 'Sale' | 'Bikri' | 'Discount';

type Transaction = {
    id: string;
    date: string;
    type: TransactionType;
    amount: number;
    party: string;
    notes?: string;
};

const getCanonicalName = (name: string): string => {
    if (!name) return '';
    return name.trim();
};

export default function LoyaltyPage() {
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedParty, setSelectedParty] = useState<string | null>(null);
    const [redemptionAmount, setRedemptionAmount] = useState(0);
    const { toast } = useToast();
    const [fcmTokens, setFcmTokens] = React.useState<string[]>([]);

    useEffect(() => {
        const fetchTokens = async () => {
            const { success, data } = await getDocuments('fcm-tokens');
            if (success && data) {
                setFcmTokens(data.map(t => t.token));
            }
        };
        fetchTokens();
    }, []);

    const fetchLoyaltyData = () => {
        setIsLoading(true);
        const transactions: Transaction[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            try {
                if (key.startsWith('invoice-')) {
                    const doc = JSON.parse(localStorage.getItem(key)!);
                    transactions.push({ id: key, date: doc.date, type: 'Sale', amount: doc.totals.netSale, party: doc.customerName, notes: `Watak #${doc.watakNo || doc.sNo}` });
                } else if (key.startsWith('bikri-')) {
                    const doc = JSON.parse(localStorage.getItem(key)!);
                    if (doc.bikriType === 'growerForwarding' && doc.growerName) {
                        transactions.push({ id: key, date: doc.date, type: 'Bikri', amount: doc.calculation.netSalePayableToGrower, party: doc.growerName, notes: `Bikri #${doc.bikriNo}` });
                    }
                } else if (key.startsWith('advance-')) {
                    const doc = JSON.parse(localStorage.getItem(key)!);
                    if (doc.type === 'Discount') {
                        transactions.push({ id: key, date: doc.date, type: 'Discount', amount: doc.amount, party: doc.partyName, notes: `Points Redeemed` });
                    }
                }
            } catch (e) {
                console.error("Error processing transaction for loyalty:", key, e);
            }
        }
        
        setAllTransactions(transactions);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchLoyaltyData();
    }, []);

    const loyaltyData = useMemo(() => {
        const partyData: {[key: string]: { name: string; netSales: number; redeemed: number; history: any[] }} = {};
        const currentYear = new Date().getFullYear();

        allTransactions.forEach(tx => {
            const txDate = new Date(tx.date);
            const canonical = getCanonicalName(tx.party);
            if (!partyData[canonical]) {
                partyData[canonical] = { name: tx.party, netSales: 0, redeemed: 0, history: [] };
            }

            if (tx.type === 'Sale' || tx.type === 'Bikri') {
                 if (txDate.getFullYear() === currentYear) {
                    const points = Math.floor(tx.amount * 0.01);
                    partyData[canonical].netSales += tx.amount;
                    partyData[canonical].history.push({ date: tx.date, type: 'Earned', points: points, notes: tx.notes });
                }
            } else if (tx.type === 'Discount') {
                partyData[canonical].redeemed += tx.amount;
                partyData[canonical].history.push({ date: tx.date, type: 'Redeemed', points: -tx.amount, notes: tx.notes });
            }
        });
        
        Object.values(partyData).forEach(data => {
            data.history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });

        return partyData;
    }, [allTransactions]);

    const globalStats = useMemo(() => {
        let totalEarned = 0;
        let totalRedeemed = 0;

        Object.values(loyaltyData).forEach(party => {
            totalEarned += Math.floor(party.netSales * 0.01);
            totalRedeemed += party.redeemed;
        });

        return {
            totalEarned: totalEarned.toLocaleString(),
            totalRedeemed: `₹${totalRedeemed.toLocaleString()}`,
            available: (totalEarned - totalRedeemed).toLocaleString(),
        }
    }, [loyaltyData]);
    
    const leaderboard = useMemo(() => {
        const currentYear = new Date().getFullYear();

        const yearlySales: {[key: string]: { name: string, netSales: number }} = {};

        allTransactions.forEach(tx => {
            const txDate = new Date(tx.date);
            if ((tx.type === 'Sale' || tx.type === 'Bikri') && txDate.getFullYear() === currentYear) {
                const canonical = getCanonicalName(tx.party);
                if (!yearlySales[canonical]) {
                    yearlySales[canonical] = { name: tx.party, netSales: 0 };
                }
                yearlySales[canonical].netSales += tx.amount;
            }
        });

        const sortedBySales = Object.values(yearlySales).sort((a,b) => b.netSales - a.netSales).slice(0, 10);
        
        const leaderboardWithPoints = sortedBySales.map((data, index) => {
            let points = Math.floor(data.netSales * 0.01);
            if (index === 0) points += 10;
            if (index === 1) points += 10;
            if (index === 2) points += 10;
            return { ...data, points };
        });

        return leaderboardWithPoints;
    }, [allTransactions]);

    const selectedPartyData = selectedParty ? loyaltyData[getCanonicalName(selectedParty)] : null;
    const selectedPartyPoints = selectedPartyData ? Math.floor(selectedPartyData.netSales * 0.01) - selectedPartyData.redeemed : 0;
    
    const handleRedeem = async () => {
        if (!selectedPartyData || !selectedParty) return;

        if (redemptionAmount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a positive amount to redeem.' });
            return;
        }
        if (redemptionAmount > selectedPartyPoints) {
            toast({ variant: 'destructive', title: 'Not Enough Points', description: `Cannot redeem more than the available ${selectedPartyPoints} points.` });
            return;
        }

        const discountTransaction = {
            id: `advance-discount-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            partyName: selectedPartyData.name,
            type: 'Discount',
            amount: redemptionAmount,
            notes: `Redeemed ${redemptionAmount} loyalty points.`
        };

        try {
            await saveDocument('advances', discountTransaction.id, discountTransaction);
            localStorage.setItem(discountTransaction.id, JSON.stringify(discountTransaction));
            
            if (fcmTokens.length > 0) {
                 await sendPushNotification({
                    title: 'Loyalty Points Redeemed',
                    body: `${redemptionAmount} points redeemed for ${selectedPartyData.name} as a ₹${redemptionAmount} discount.`,
                    tokens: fcmTokens,
                });
            }

            toast({ title: 'Points Redeemed!', description: `${redemptionAmount} points have been applied as a discount.` });
            fetchLoyaltyData(); // Re-fetch to update stats
            setRedemptionAmount(0);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Redemption Failed', description: 'Could not save the discount transaction.' });
        }
    };


    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-3xl text-yellow-400">🏆 F.Co Loyalty & Rewards</CardTitle>
                    <CardDescription>Earn points for sales and trade activities. (1 Point = ₹1)</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard title="Total Points Earned" value={globalStats.totalEarned} icon={TrendingUp} />
                    <StatCard title="Points Redeemed (₹)" value={globalStats.totalRedeemed} icon={DollarSign} />
                    <StatCard title="Available Points" value={globalStats.available} icon={Gift} color="text-green-500" />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>🏆 Yearly Leaderboard</CardTitle>
                        <CardDescription>Top growers for the current year based on sales volume.</CardDescription>
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
                                            <TableCell className="font-bold text-lg">{rankIcon}</TableCell>
                                            <TableCell>{grower.name}</TableCell>
                                            <TableCell className="text-right font-mono text-green-500">{grower.points}</TableCell>
                                            <TableCell className="text-right font-mono">₹{grower.netSales.toLocaleString('en-IN')}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                         {leaderboard.length === 0 && <p className="text-center text-muted-foreground p-8">No sales recorded this year.</p>}
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
                        {selectedPartyData ? (
                            <>
                                <div className='grid grid-cols-2 gap-4 mb-4'>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Total Sales (This Year)</p>
                                        <p className="text-2xl font-bold">₹{selectedPartyData.netSales.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Available Points (₹)</p>
                                        <p className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                                            <Star className="h-6 w-6"/> {selectedPartyPoints.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>

                                {selectedPartyPoints >= 500 && (
                                     <CardFooter className="flex-col items-start gap-2 border-t pt-4">
                                        <Label className="font-semibold">Redeem Points</Label>
                                         <div className="flex items-center gap-2">
                                            <Input type="number" className="w-40" placeholder="Points to redeem" value={redemptionAmount || ''} onChange={e => setRedemptionAmount(Number(e.target.value))} max={selectedPartyPoints} />
                                            <Button onClick={handleRedeem} className='bg-green-600 hover:bg-green-700 gap-2' disabled={redemptionAmount <= 0 || redemptionAmount > selectedPartyPoints}>
                                                <Gift className="h-4 w-4"/> Redeem
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Minimum 500 points to redeem. This creates a "Discount" transaction, reducing their dues.</p>
                                    </CardFooter>
                                )}
                               
                                <h4 className="font-semibold mt-6 mb-2 flex items-center gap-2"><History className='h-4 w-4'/>Points History</h4>
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
                                        {selectedPartyData.history.map((tx, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                                                <TableCell><Badge variant={tx.type === 'Earned' ? 'default' : 'destructive'}>{tx.type}</Badge></TableCell>
                                                <TableCell className={`font-mono ${tx.points > 0 ? 'text-green-500' : 'text-red-500'}`}>{tx.points > 0 ? `+${tx.points}`: tx.points}</TableCell>
                                                <TableCell className='text-xs'>{tx.notes}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </>
                        ) : (
                             <p className="text-center text-muted-foreground p-8">Please select a grower to view their history.</p>
                        )}
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
