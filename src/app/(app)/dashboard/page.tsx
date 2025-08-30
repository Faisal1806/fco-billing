'use client'

import { DollarSign, Package, Users, Activity } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { recentSales, salesData } from '@/lib/data';
import { useLanguage } from '@/contexts/language-context';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    const { t } = useLanguage();
    return (
        <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
            <CardTitle>{t('sales_overview')}</CardTitle>
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
                tickFormatter={(value) => `$${value}`}
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
    const { t } = useLanguage();
    return (
        <Card className="col-span-1">
        <CardHeader>
            <CardTitle>{t('recent_sales')}</CardTitle>
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
                <div className="ms-auto font-medium text-end">+${sale.amount.toFixed(2)}</div>
            </div>
            ))}
        </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
  const { t } = useLanguage();

  return (
    <>
      <div className="flex-1 space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title={t('total_revenue')} value="$45,231.89" subtitle="+20.1% from last month" icon={DollarSign} />
          <StatsCard title={t('total_sales')} value="+2350" subtitle="+180.1% from last month" icon={Users} />
          <StatsCard title={t('products')} value="573" subtitle="+19% from last month" icon={Package} />
          <StatsCard title={t('active_now')} value="+573" subtitle="+201 since last hour" icon={Activity} />
        </div>
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
            <SalesChart />
            <RecentSales />
        </div>
      </div>
    </>
  );
}
