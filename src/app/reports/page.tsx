
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/PageHeader';

const cardVariants = {
    initial: { opacity: 0, y: 50, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

export default function ReportsPage() {
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [expenseData, setExpenseData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        if (typeof window !== 'undefined') {
            const sales: any[] = [];
            const purchases: any[] = [];
            const expenses: any[] = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('invoice-')) sales.push(JSON.parse(localStorage.getItem(key)!));
                if (key?.startsWith('purchase-')) purchases.push(JSON.parse(localStorage.getItem(key)!));
                if (key?.startsWith('expense-')) expenses.push(JSON.parse(localStorage.getItem(key)!));
            }

            // Process Monthly Sales and Purchases
            const monthlyAgg: { [key: string]: { sales: number; purchases: number } } = {};
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            sales.forEach(sale => {
                const month = new Date(sale.date).getMonth();
                const year = new Date(sale.date).getFullYear();
                const key = `${year}-${monthNames[month]}`;
                if (!monthlyAgg[key]) monthlyAgg[key] = { sales: 0, purchases: 0 };
                monthlyAgg[key].sales += sale.totals.netSale || 0;
            });

            purchases.forEach(purchase => {
                const month = new Date(purchase.date).getMonth();
                const year = new Date(purchase.date).getFullYear();
                const key = `${year}-${monthNames[month]}`;
                if (!monthlyAgg[key]) monthlyAgg[key] = { sales: 0, purchases: 0 };
                monthlyAgg[key].purchases += purchase.totals.grandTotal || 0;
            });
            
            const sortedMonthlyData = Object.entries(monthlyAgg)
                .map(([name, values]) => ({ name, ...values }))
                .sort((a, b) => new Date(`01 ${a.name.split('-')[1]} ${a.name.split('-')[0]}`).getTime() - new Date(`01 ${b.name.split('-')[1]} ${b.name.split('-')[0]}`).getTime());

            setMonthlyData(sortedMonthlyData);

            // Process Expense Categories
            const expenseAgg: { [key: string]: number } = {};
            expenses.forEach(exp => {
                const category = exp.category || 'Uncategorized';
                if (!expenseAgg[category]) expenseAgg[category] = 0;
                expenseAgg[category] += exp.amount || 0;
            });

            const expenseChartData = Object.entries(expenseAgg).map(([name, value]) => ({ name, value }));
            setExpenseData(expenseChartData);

            setIsLoading(false);
        }
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg">Generating Reports...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <PageHeader
                title="Business Analytics & Reports"
                description="An overview of your company's financial performance."
                icon={<TrendingUp className="h-8 w-8" />}
                imageUrl="/assets/3d/reports.png"
            />

            <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ y: -10, scale: 1.02, transition: { type: 'spring', stiffness: 300 } }}
                className="[perspective:1000px]"
            >
                <Card className="bg-card/60 backdrop-blur-sm border-white/10 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <DollarSign className="h-5 w-5 text-green-400" /> Monthly Sales vs. <ShoppingCart className="h-5 w-5 text-orange-400" /> Purchases
                        </CardTitle>
                        <CardDescription>Comparison of total net sales and purchase amounts per month.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                                <Tooltip
                                    contentStyle={{
                                        background: "rgba(30, 41, 59, 0.9)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "0.5rem",
                                    }}
                                    cursor={{fill: "rgba(130, 202, 157, 0.1)"}}
                                />
                                <Legend />
                                <Bar dataKey="sales" fill="#82ca9d" name="Net Sales" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="purchases" fill="#ffc658" name="Purchases" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>
             <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 0.5, delay: 0.4 }}
                 whileHover={{ y: -10, scale: 1.02, transition: { type: 'spring', stiffness: 300 } }}
                 className="[perspective:1000px]"
            >
                <Card className="bg-card/60 backdrop-blur-sm border-white/10 shadow-xl">
                    <CardHeader>
                        <CardTitle>Expense Breakdown</CardTitle>
                        <CardDescription>Distribution of expenses across different categories.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                <Pie
                                    data={expenseData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                        const RADIAN = Math.PI / 180;
                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                        return (
                                            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                                {`${(percent * 100).toFixed(0)}%`}
                                            </text>
                                        );
                                    }}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {expenseData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: "rgba(30, 41, 59, 0.9)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "0.5rem",
                                    }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
