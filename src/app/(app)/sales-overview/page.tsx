
'use client'

import { IndianRupee, DollarSign, FileText, Package } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { recentSales, salesData } from '@/lib/data';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Image from 'next/image';

const StatsCard = ({ title, value, icon: Icon, subtitle }: { title: string; value: string; icon: React.ElementType; subtitle: string; }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </CardContent>
  </Card>
);

const SalesChart = () => {
    return (
        <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
            <BarChart data={salesData}>
                <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                />
                <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                    }}
                />
                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
            </ResponsiveContainer>
        </CardContent>
        </Card>
    );
};

const RecentSales = () => {
    return (
        <Card className="col-span-1">
        <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8">
            {recentSales.map((sale) => (
            <div key={sale.id} className="flex items-center gap-4">
                <Avatar className="hidden h-9 w-9 sm:flex">
                    <Image src={`https://picsum.photos/seed/${sale.customer.name}/40/40`} alt="Avatar" width={40} height={40} data-ai-hint="people avatar" />
                    <AvatarFallback>{sale.customer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">{sale.customer.name}</p>
                <p className="text-sm text-muted-foreground">{sale.email}</p>
                </div>
                <div className="ms-auto font-medium text-end">+₹{sale.amount.toFixed(2)}</div>
            </div>
            ))}
             {recentSales.length === 0 && (
                <p className="text-sm text-muted-foreground text-center col-span-full">No recent sales.</p>
            )}
        </CardContent>
        </Card>
    );
}

export default function SalesOverviewPage() {
  return (
    <>
      <div className="flex-1 space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Today's Sale" value="₹12,245.50" subtitle="Total of all bills today" icon={IndianRupee} />
          <StatsCard title="Monthly Sale" value="₹1,45,231.89" subtitle="Total sales this month" icon={DollarSign} />
          <StatsCard title="Wataks Generated" value="8" subtitle="This month" icon={FileText} />
          <StatsCard title="Challans Generated" value="12" subtitle="This month" icon={Package} />
        </div>
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
            <SalesChart />
            <RecentSales />
        </div>
      </div>
    </>
  );
}
