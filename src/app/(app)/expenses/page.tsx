
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { saveDocument, deleteDocument } from '@/lib/actions';


type ExpenseEntry = {
    id: string;
    date: string;
    category: string;
    description: string;
    amount: number;
    type: 'manual' | 'auto';
};

const emptyFormState = {
    id: '',
    date: '',
    category: '',
    description: '',
    amount: 0,
}

export default function ExpensesPage() {
    const { toast } = useToast();
    const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
    const [formState, setFormState] = useState(emptyFormState);
    const [isClient, setIsClient] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        setIsClient(true);
        if (typeof window !== 'undefined') {
            setUserRole(localStorage.getItem('userRole'));
        }
    }, []);

    const fetchExpenses = () => {
        if (typeof window === 'undefined') return;
        const allExpenses: ExpenseEntry[] = [];
        
        // Fetch manual expenses
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('expense-')) {
                const expense = JSON.parse(localStorage.getItem(key)!);
                allExpenses.push({ ...expense, type: 'manual' });
            }
        }

        // Fetch automatic expenses from sales
         for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('invoice-')) {
                const sale = JSON.parse(localStorage.getItem(key)!);
                if(sale.totals) {
                    if (sale.totals.labour > 0) {
                        allExpenses.push({
                            id: `auto-labour-${sale.sNo}`,
                            date: sale.date,
                            category: 'Sales Deduction',
                            description: `Labour charges for Bill #${sale.sNo}`,
                            amount: sale.totals.labour,
                            type: 'auto',
                        });
                    }
                    if (sale.totals.association > 0) {
                         allExpenses.push({
                            id: `auto-assoc-${sale.sNo}`,
                            date: sale.date,
                            category: 'Sales Deduction',
                            description: `Association fee for Bill #${sale.sNo}`,
                            amount: sale.totals.association,
                            type: 'auto',
                        });
                    }
                    if (sale.totals.security > 0) {
                         allExpenses.push({
                            id: `auto-security-${sale.sNo}`,
                            date: sale.date,
                            category: 'Sales Deduction',
                            description: `Security fee for Bill #${sale.sNo}`,
                            amount: sale.totals.security,
                            type: 'auto',
                        });
                    }
                }
            }
        }
        
        setExpenses(allExpenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }

    useEffect(() => {
        if(isClient) {
            fetchExpenses();
        }
    }, [isClient]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormState(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    }

    const handleSaveExpense = async () => {
        if (!formState.date || !formState.category || !formState.description || formState.amount <= 0) {
            toast({
                variant: 'destructive',
                title: 'Missing Fields',
                description: 'Please fill out all fields before saving.',
            });
            return;
        }

        const id = formState.id || `expense-${Date.now()}`;
        const expenseData = { ...formState, id };
        
        localStorage.setItem(id, JSON.stringify(expenseData));

        try {
            await saveDocument('expenses', id, expenseData);
             toast({
                title: 'Expense Saved',
                description: 'Your expense has been successfully recorded.',
            });
        } catch(e) {
            toast({
                variant: 'destructive',
                title: 'Cloud Sync Failed',
                description: 'Could not save expense to cloud, but it is saved locally.',
            });
        }
        
        fetchExpenses();
        setFormState(emptyFormState);
    };

    const handleDeleteExpense = async (id: string) => {
        if (userRole !== 'admin') {
            toast({ variant: 'destructive', title: 'Permission Denied' });
            return;
        }
        if (!window.confirm('Are you sure you want to delete this expense?')) return;
        
        localStorage.removeItem(id);
        
        try {
            await deleteDocument('expenses', id);
            toast({ title: 'Expense Deleted' });
        } catch (e) {
             toast({
                variant: 'destructive',
                title: 'Cloud Delete Failed',
                description: 'Could not delete expense from cloud, but it was removed locally.',
            });
        }
        
        fetchExpenses();
    };

    const totalExpenses = useMemo(() => {
        return expenses.reduce((acc, exp) => acc + exp.amount, 0);
    }, [expenses]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Expense Register</CardTitle>
                    <CardDescription>A log of all your business expenses, both automatic and manual.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isClient && expenses.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.map((exp) => (
                                    <TableRow key={exp.id}>
                                        <TableCell>{new Date(exp.date).toLocaleDateString('en-GB')}</TableCell>
                                        <TableCell className="font-medium">{exp.category}</TableCell>
                                        <TableCell>{exp.description}</TableCell>
                                        <TableCell>
                                            <Badge variant={exp.type === 'auto' ? 'secondary' : 'default'}>{exp.type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">₹{exp.amount.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            {exp.type === 'manual' && userRole === 'admin' && (
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(exp.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                             <TableFooter>
                                <TableRow className="font-bold text-lg">
                                    <TableCell colSpan={4} className="text-right">Total Expenses</TableCell>
                                    <TableCell className="text-right font-mono">₹{totalExpenses.toFixed(2)}</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                            <Receipt className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">No expenses recorded yet.</h3>
                            <p className="mt-1 text-sm">Add your first manual expense using the form.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="h-fit">
                <CardHeader>
                    <CardTitle>Add Manual Expense</CardTitle>
                    <CardDescription>Record any other business expenses here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" name="date" type="date" value={formState.date} onChange={handleInputChange} />
                    </div>
                     <div>
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" name="category" placeholder="e.g., Shop Rent, Electricity" value={formState.category} onChange={handleInputChange} />
                    </div>
                     <div>
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" name="description" placeholder="e.g., Monthly shop rent" value={formState.description} onChange={handleInputChange} />
                    </div>
                     <div>
                        <Label htmlFor="amount">Amount</Label>
                        <Input id="amount" name="amount" type="number" placeholder="0.00" value={formState.amount || ''} onChange={handleInputChange} />
                    </div>
                </CardContent>
                 <CardFooter>
                    <Button onClick={handleSaveExpense} className="w-full">
                        <PlusCircle className="h-4 w-4 mr-2" /> Add Expense
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
