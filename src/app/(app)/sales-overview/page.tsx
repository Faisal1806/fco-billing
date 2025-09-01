
'use client'

import { useState, useEffect } from 'react';
import { IndianRupee, HandCoins, UserRound, Award, Package, Users, BarChart } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

interface Sale {
    id: string;
    customerName: string;
    date: string;
    totals: {
        netSale: number;
    },
    entries: {
        variety: string;
        rate: number;
        qty: number;
    }[];
}

interface Purchase {
    growerName: string;
    date: string;
    totals: {
        grandTotal: number;
    }
}

interface OverviewStats {
    monthlySale: number;
    outstandingBalance: number;
    bestSellingVariety: string;
    topCustomer: string;
    recentSales: { id: string; name: string; avatar: string; amount: number }[];
}

const StatsCard = ({ title, value, icon: Icon, subtitle }: { title: string; value: string; icon: React.ElementType; subtitle?: string; }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </CardContent>
  </Card>
);

const RecentSales = ({sales}: {sales: OverviewStats['recentSales']}) => {
    return (
        <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8">
            {sales.map((sale) => (
            <div key={sale.id} className="flex items-center gap-4">
                <Avatar className="hidden h-9 w-9 sm:flex">
                    <Image src={`https://picsum.photos/seed/${sale.name}/40/40`} alt="Avatar" width={40} height={40} data-ai-hint="people avatar" />
                    <AvatarFallback>{sale.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">{sale.name}</p>
                </div>
                <div className="ms-auto font-medium text-end">+₹{sale.amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
            ))}
             {sales.length === 0 && (
                <p className="text-sm text-muted-foreground text-center col-span-full">No recent sales found.</p>
            )}
        </CardContent>
        </Card>
    );
}

export default function SalesOverviewPage() {
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined' || !localStorage) {
            setIsLoading(false);
            return;
        }

        const sales: Sale[] = [];
        const purchases: Purchase[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('invoice-')) {
                sales.push(JSON.parse(localStorage.getItem(key)!));
            } else if (key?.startsWith('purchase-')) {
                purchases.push(JSON.parse(localStorage.getItem(key)!));
            }
        }
        
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Monthly Sale
        const monthlySale = sales
            .filter(s => {
                const saleDate = new Date(s.date);
                return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
            })
            .reduce((acc, s) => acc + s.totals.netSale, 0);

        // Outstanding Balance
        const totalReceivable = sales.reduce((acc, s) => acc + s.totals.netSale, 0);
        const totalPayable = purchases.reduce((acc, p) => acc + p.totals.grandTotal, 0);
        const outstandingBalance = totalReceivable - totalPayable;
        
        // Best-selling variety (this month)
        const monthlyVarietySales: { [key: string]: number } = {};
        sales.filter(s => {
            const saleDate = new Date(s.date);
            return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
        }).forEach(s => {
            s.entries.forEach(e => {
                if (e.variety) {
                    const saleValue = e.qty * e.rate;
                    monthlyVarietySales[e.variety] = (monthlyVarietySales[e.variety] || 0) + saleValue;
                }
            });
        });
        const bestSellingVariety = Object.entries(monthlyVarietySales).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

        // Top customer
        const customerSales: { [key: string]: number } = {};
        sales.forEach(s => {
            customerSales[s.customerName] = (customerSales[s.customerName] || 0) + s.totals.netSale;
        });
        const topCustomer = Object.entries(customerSales).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

        // Recent Sales
        const recentSales = sales
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map(s => ({
                id: s.id,
                name: s.customerName,
                avatar: '', // Placeholder
                amount: s.totals.netSale
            }));

        setStats({
            monthlySale,
            outstandingBalance,
            bestSellingVariety,
            topCustomer,
            recentSales
        });
        setIsLoading(false);
    }, []);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="ml-4 text-muted-foreground">Crunching the numbers...</p>
            </div>
        )
    }

    if (!stats) {
        return <p>Could not load sales overview statistics. Make sure you have some sales and purchase data.</p>
    }

  return (
    <>
      <div className="flex-1 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="This Month's Sale" value={`₹${stats.monthlySale.toLocaleString('en-IN')}`} icon={IndianRupee} />
          <StatsCard title="Outstanding Balance" value={`₹${stats.outstandingBalance.toLocaleString('en-IN')}`} subtitle={stats.outstandingBalance >= 0 ? 'Receivable' : 'Payable'} icon={HandCoins} />
          <StatsCard title="Top Customer" value={stats.topCustomer} icon={UserRound} />
          <StatsCard title="Best Selling Variety" value={stats.bestSellingVariety} subtitle="This Month" icon={Award} />
        </div>
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
            <Card className="col-span-1 lg:col-span-1">
                <CardHeader>
                    <CardTitle>Profit Analysis</CardTitle>
                    <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">More profit analytics coming soon, including detailed expense breakdowns and commission tracking.</p>
                    </CardContent>
                </CardHeader>
            </Card>
            <RecentSales sales={stats.recentSales} />
        </div>
      </div>
    </>
  );
}
