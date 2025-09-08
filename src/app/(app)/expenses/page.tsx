
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
import { PlusCircle, Trash2, Receipt, Users, Building, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { saveDocument, deleteDocument, getDocuments } from '@/lib/actions';


type ExpenseEntry = {
    id: string;
    date: string;
    category: string;
    description: string;
    amount: number;
    type: 'manual' | 'auto';
};

type ExpenseStats = {
    totalWataks: number;
    totalPatti: number;
    totalDabba: number;
    totalNugs: number;
}

const emptyFormState = {
    id: '',
    date: '',
    category: '',
    description: '',
    amount: 0,
}

const ExpenseTable = ({ title, icon, description, expenses, total, children, showActions, onDelete }: {
    title: string,
    icon: React.ReactNode,
    description: React.ReactNode,
    expenses: ExpenseEntry[],
    total: number,
    children?: React.ReactNode,
    showActions: boolean,
    onDelete?: (id: string) => void
}) => (
     <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                {icon}
                <CardTitle>{title}</CardTitle>
            </div>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
             {expenses.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            {showActions && <TableHead className="text-right">Actions</TableHead>}
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
                                {showActions && onDelete && (
                                    <TableCell className="text-right">
                                        {exp.type === 'manual' && (
                                            <Button variant="ghost" size="icon" onClick={() => onDelete(exp.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                        <TableFooter>
                        <TableRow className="font-bold text-lg">
                            <TableCell colSpan={showActions ? 5 : 4} className="text-right">Total</TableCell>
                            <TableCell className="text-right font-mono">₹{total.toFixed(2)}</TableCell>
                            {showActions && <TableCell></TableCell>}
                        </TableRow>
                    </TableFooter>
                </Table>
            ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Receipt className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">No records yet.</h3>
                    <p className="mt-1 text-sm">Entries in this category will appear here automatically.</p>
                </div>
            )}
        </CardContent>
        {children && <CardFooter>{children}</CardFooter>}
    </Card>
);

const StatsDescription = ({ text, stats }: { text: string; stats: ExpenseStats }) => (
    <div className="space-y-1">
        <p>{text}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold pt-1 text-foreground">
            <span>Wataks: <Badge variant="secondary">{stats.totalWataks}</Badge></span>
            <span>Patti: <Badge variant="secondary">{stats.totalPatti}</Badge></span>
            <span>Dabba: <Badge variant="secondary">{stats.totalDabba}</Badge></span>
            <span>Total Nugs: <Badge variant="outline">{stats.totalNugs}</Badge></span>
        </div>
    </div>
);


export default function ExpensesPage() {
    const { toast } = useToast();
    const [labourExpenses, setLabourExpenses] = useState<ExpenseEntry[]>([]);
    const [companyExpenses, setCompanyExpenses] = useState<ExpenseEntry[]>([]);
    const [commissionIncome, setCommissionIncome] = useState<ExpenseEntry[]>([]);
    
    const [commissionStats, setCommissionStats] = useState<ExpenseStats>({ totalWataks: 0, totalPatti: 0, totalDabba: 0, totalNugs: 0 });
    const [labourStats, setLabourStats] = useState<ExpenseStats>({ totalWataks: 0, totalPatti: 0, totalDabba: 0, totalNugs: 0 });
    const [companyStats, setCompanyStats] = useState<ExpenseStats>({ totalWataks: 0, totalPatti: 0, totalDabba: 0, totalNugs: 0 });
    
    const [formState, setFormState] = useState(emptyFormState);
    const [userRole, setUserRole] = useState<string | null>(null);

    const fetchExpenses = async () => {
        setUserRole(localStorage.getItem('userRole'));

        const { success: manualSuccess, data: manualExpensesData } = await getDocuments('expenses');
        const { success: invoiceSuccess, data: invoicesData } = await getDocuments('invoices');

        if(!manualSuccess || !invoiceSuccess) {
            toast({variant: 'destructive', title: 'Failed to fetch expense data'});
            return;
        }

        const allLabourExpenses: ExpenseEntry[] = [];
        const allCompanyExpenses: ExpenseEntry[] = (manualExpensesData || []).map(d => ({ ...d, type: 'manual' }));
        const allCommissionIncome: ExpenseEntry[] = [];
        
        let newCommissionStats: ExpenseStats = { totalWataks: 0, totalPatti: 0, totalDabba: 0, totalNugs: 0 };
        let newLabourStats: ExpenseStats = { totalWataks: 0, totalPatti: 0, totalDabba: 0, totalNugs: 0 };
        let newCompanyStats: ExpenseStats = { totalWataks: 0, totalPatti: 0, totalDabba: 0, totalNugs: 0 };
        
        const companyWataks = new Set<string>();
        const labourWataks = new Set<string>();

        (invoicesData || []).forEach(sale => {
            if(sale.totals) {
                const pattiQty = sale.totals.pattiQty || 0;
                const dabbaQty = sale.totals.dabbaQty || 0;
                const totalNugs = pattiQty + dabbaQty;

                if (sale.totals.labour > 0) {
                    allLabourExpenses.push({
                        id: `auto-labour-${sale.sNo}`,
                        date: sale.date,
                        category: 'Sales Deduction',
                        description: `Labour charges for Bill #${sale.sNo}`,
                        amount: sale.totals.labour,
                        type: 'auto',
                    });
                    labourWataks.add(sale.sNo);
                    newLabourStats.totalPatti += pattiQty;
                    newLabourStats.totalDabba += dabbaQty;
                    newLabourStats.totalNugs += totalNugs;
                }
                if (sale.totals.association > 0) {
                     allCompanyExpenses.push({
                        id: `auto-assoc-${sale.sNo}`,
                        date: sale.date,
                        category: 'Sales Deduction',
                        description: `Association fee for Bill #${sale.sNo}`,
                        amount: sale.totals.association,
                        type: 'auto',
                    });
                    companyWataks.add(sale.sNo);
                }
                if (sale.totals.security > 0) {
                     allCompanyExpenses.push({
                        id: `auto-security-${sale.sNo}`,
                        date: sale.date,
                        category: 'Sales Deduction',
                        description: `Security fee for Bill #${sale.sNo}`,
                        amount: sale.totals.security,
                        type: 'auto',
                    });
                    companyWataks.add(sale.sNo);
                }
                 if (sale.totals.commissionAmount > 0) {
                     allCommissionIncome.push({
                        id: `auto-commission-${sale.sNo}`,
                        date: sale.date,
                        category: 'Sales Commission',
                        description: `Commission from Bill #${sale.sNo}`,
                        amount: sale.totals.commissionAmount,
                        type: 'auto',
                    });
                    newCommissionStats.totalWataks += 1;
                    newCommissionStats.totalPatti += pattiQty;
                    newCommissionStats.totalDabba += dabbaQty;
                    newCommissionStats.totalNugs += totalNugs;
                }
            }
        });

        const companyWatakIds = Array.from(companyWataks);
        newCompanyStats.totalWataks = companyWatakIds.length;
        companyWatakIds.forEach(sNo => {
            const sale = invoicesData?.find(inv => inv.sNo === sNo);
            if (sale) {
                const pattiQty = sale.totals.pattiQty || 0;
                const dabbaQty = sale.totals.dabbaQty || 0;
                newCompanyStats.totalPatti += pattiQty;
                newCompanyStats.totalDabba += dabbaQty;
                newCompanyStats.totalNugs += pattiQty + dabbaQty;
            }
        });

        newLabourStats.totalWataks = labourWataks.size;
        
        setLabourExpenses(allLabourExpenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setCompanyExpenses(allCompanyExpenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setCommissionIncome(allCommissionIncome.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        
        setCommissionStats(newCommissionStats);
        setLabourStats(newLabourStats);
        setCompanyStats(newCompanyStats);
    }

    useEffect(() => {
        fetchExpenses();
    }, []);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormState(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    }

    const handleSaveExpense = async () => {
        if (!formState.date || !formState.category || !formState.description || formState.amount <= 0) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out all fields before saving.' });
            return;
        }

        const id = `expense-${Date.now()}`;
        const expenseData = { ...formState, id };
        
        const { success, error } = await saveDocument('expenses', id, expenseData);
        if (success) {
            toast({ title: 'Expense Saved', description: 'Your expense has been successfully recorded.' });
        } else {
            toast({ variant: 'destructive', title: 'Cloud Sync Failed', description: error });
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
        
        const { success, error } = await deleteDocument('expenses', id);
        if (success) {
            toast({ title: 'Expense Deleted' });
        } else {
            toast({ variant: 'destructive', title: 'Cloud Delete Failed', description: error });
        }
        
        fetchExpenses();
    };

    const totalLabourExpenses = useMemo(() => labourExpenses.reduce((acc, exp) => acc + exp.amount, 0), [labourExpenses]);
    const totalCompanyExpenses = useMemo(() => companyExpenses.reduce((acc, exp) => acc + exp.amount, 0), [companyExpenses]);
    const totalCommissionIncome = useMemo(() => commissionIncome.reduce((acc, exp) => acc + exp.amount, 0), [commissionIncome]);

    return (
        <div className="space-y-8">
             <ExpenseTable 
                title="Commission Earned"
                icon={<Percent className="h-6 w-6 text-primary"/>}
                description={<StatsDescription text="Commission income automatically calculated from your sales invoices (wataks)." stats={commissionStats} />}
                expenses={commissionIncome}
                total={totalCommissionIncome}
                showActions={false}
            />
            
            <ExpenseTable 
                title="Labour Expenses"
                icon={<Users className="h-6 w-6 text-primary"/>}
                description={<StatsDescription text="Expenses paid out to company laborers, automatically calculated from sales deductions." stats={labourStats} />}
                expenses={labourExpenses}
                total={totalLabourExpenses}
                showActions={false}
            />

            <ExpenseTable 
                title="Company, Security & Association Expenses"
                icon={<Building className="h-6 w-6 text-primary"/>}
                description={<StatsDescription text="Expenses for the company itself, including security/association fees from sales and other manually added costs." stats={companyStats} />}
                expenses={companyExpenses}
                total={totalCompanyExpenses}
                showActions={userRole === 'admin'}
                onDelete={handleDeleteExpense}
            >
                <Card className="w-full">
                     <CardHeader>
                        <CardTitle>Add Manual Company Expense</CardTitle>
                        <CardDescription>Record any other business expenses here (e.g. Shop Rent).</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                         <div>
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" name="date" type="date" value={formState.date} onChange={handleInputChange} />
                        </div>
                        <div>
                            <Label htmlFor="category">Category</Label>
                            <Input id="category" name="category" placeholder="e.g., Shop Rent" value={formState.category} onChange={handleInputChange} />
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
                        <Button onClick={handleSaveExpense} className="gap-2">
                            <PlusCircle className="h-4 w-4" /> Add Company Expense
                        </Button>
                    </CardFooter>
                </Card>
            </ExpenseTable>
        </div>
    );
}
