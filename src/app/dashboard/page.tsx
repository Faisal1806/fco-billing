'use client'

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { sidebarSections } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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


export default function DashboardPage() {
  const allNavItems = sidebarSections.flatMap(section => section.items);

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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
             <Card className="bg-card/60 backdrop-blur-sm border-white/10">
                <CardHeader>
                    <CardTitle>App Sections</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-x-8 gap-y-12 justify-center">
                         {allNavItems.map((item, index) => (
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
