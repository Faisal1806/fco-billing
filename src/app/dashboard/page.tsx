'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { sidebarSections } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, ShoppingCart, Users } from 'lucide-react';
import { WatakEntry } from '@/app/watak-register/page';
import { PurchaseEntry } from '@/app/purchase-register/page';


const NavTile = ({ title, icon: Icon, href }: { title: string, icon: React.ElementType, href: string }) => {
    const router = useRouter();

    return (
        <li
            className="social-tile"
            onClick={() => router.push(href)}
        >
            <a href="#" className="w-full">
                <Icon className="icon h-5 w-5" />
                {title}
            </a>
        </li>
    );
};

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string, icon: React.ElementType, description: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);


export default function DashboardPage() {
  const allNavItems = sidebarSections.flatMap(section => section.items);
  const [stats, setStats] = React.useState({ sales: 0, purchases: 0, growers: 0 });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentYear = new Date().getFullYear();
      let totalSales = 0;
      let totalPurchases = 0;
      const growerNames = new Set<string>();

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          if (key.startsWith('invoice-')) {
            const watak: WatakEntry = JSON.parse(localStorage.getItem(key)!);
            if (new Date(watak.date).getFullYear() === currentYear) {
              totalSales += watak.totals.netSale || 0;
            }
          }
          if (key.startsWith('purchase-')) {
            const purchase: PurchaseEntry = JSON.parse(localStorage.getItem(key)!);
            if (new Date(purchase.date).getFullYear() === currentYear) {
                totalPurchases += purchase.totals.grandTotal || 0;
            }
          }
           if (key.startsWith('party-')) {
             const party = JSON.parse(localStorage.getItem(key)!);
             if(party.type === 'Grower' || party.type === 'Both') {
                growerNames.add(party.name);
             }
           }
        }
      }
      setStats({ sales: totalSales, purchases: totalPurchases, growers: growerNames.size });
    }
  }, []);

  return (
    <div className="space-y-8">
        <Card className="text-center bg-transparent border-none">
            <CardHeader>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: 0.2, type: 'spring' }}} className="mx-auto w-fit p-4 mb-2">
                    <h1 className="text-4xl md:text-5xl font-bold text-white shadow-lg">FCO BILLING SYSTEM</h1>
                </motion.div>
                <CardDescription className="text-lg text-gray-300/80 shadow-md mt-2">
                    Your complete business management solution.
                </CardDescription>
            </CardHeader>
        </Card>

        <motion.div 
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.3, staggerChildren: 0.1 } }}
        >
          <StatCard 
            title="This Year's Sales" 
            value={`₹${(stats.sales / 100000).toFixed(2)} L`} 
            icon={TrendingUp} 
            description="Total net sales recorded this year" 
          />
          <StatCard 
            title="This Year's Purchases" 
            value={`₹${(stats.purchases / 100000).toFixed(2)} L`} 
            icon={ShoppingCart}
            description="Total purchases recorded this year" 
          />
          <StatCard 
            title="Total Growers" 
            value={`${stats.growers}`} 
            icon={Users}
            description="Total number of unique growers" 
          />
        </motion.div>
        
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
             <Card className="bg-card/60 backdrop-blur-sm border-white/10">
                <CardHeader>
                    <CardTitle>App Sections</CardTitle>
                </CardHeader>
                <CardContent>
                     <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-x-4 gap-y-8 justify-center">
                         {allNavItems.map((item) => (
                            <NavTile 
                                key={item.name} 
                                title={item.name} 
                                icon={item.icon} 
                                href={item.href}
                            />
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </motion.div>
    </div>
  );
}
