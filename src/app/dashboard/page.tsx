
'use client'

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { sidebarSections } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const NavTile = ({ title, icon: Icon, href }: { title: string, icon: React.ElementType, href: string }) => {
    const router = useRouter();
    
    // A simple hash function to get a consistent color index
    const getColorIndex = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return (hash & 0x7FFFFFFF) % 4 + 1; // Return a value between 1 and 4
    }

    const colorIndex = getColorIndex(title);

    return (
        <li
            className={`social-tile tile-${colorIndex} w-full`}
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
        
        {sidebarSections.map((section, sectionIndex) => (
            <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 * (sectionIndex + 1) }}
            >
                 <Card className="bg-card/60 backdrop-blur-sm border-white/10">
                    <CardHeader>
                        <CardTitle>{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-12">
                             {section.items.map((item) => (
                                <NavTile key={item.name} title={item.name} icon={item.icon} href={item.href} />
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </motion.div>
        ))}
    </div>
  );
}
