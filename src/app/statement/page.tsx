'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, Printer, Download } from 'lucide-react';
import { PartySelector } from '@/components/party-selector';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ExpenseRow = {
  id: number;
  description: string;
  amount: number;
};

export default function ManualStatementPage() {
  const { toast } = useToast();

  // State for the form
  const [partyName, setPartyName] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [patti, setPatti] = React.useState(0);
  const [dabba, setDabba] = React.useState(0);
  const [watakSalesTotal, setWatakSalesTotal] = React.useState(0);

  const [expenses, setExpenses] = React.useState<ExpenseRow[]>([
    { id: 1, description: 'Cash Amount', amount: 0 },
    { id: 2, description: 'Shop Expenses', amount: 0 },
    { id: 3, description: 'Paper', amount: 0 },
  ]);

  const totalExpenses = React.useMemo(() => {
    return expenses.reduce((acc, exp) => acc + (Number(exp.amount) || 0), 0);
  }, [expenses]);

  const finalBalance = React.useMemo(() => {
    return watakSalesTotal - totalExpenses;
  }, [watakSalesTotal, totalExpenses]);

  const addExpenseRow = () => {
    setExpenses(prev => [...prev, { id: Date.now(), description: '', amount: 0 }]);
  };

  const removeExpenseRow = (id: number) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  const handleExpenseChange = (id: number, field: 'description' | 'amount', value: string | number) => {
    setExpenses(prev =>
      prev.map(exp => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  };
  
  const handlePrint = async () => {
    const statementElement = document.getElementById('statement-print-area');
    if (!statementElement) {
        toast({variant: 'destructive', title: 'Error', description: 'Could not find statement content to print.'})
        return;
    };

    const canvas = await html2canvas(statementElement, { scale: 2 });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Statement-${partyName}-${date}.pdf`);
  };

  return (
    <div className="space-y-6">
        <Card className="max-w-4xl mx-auto" id="statement-print-area">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Statement of Account</CardTitle>
                <CardDescription>Firdous Ahmad &amp; Company, Sopore</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Header Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg">
                    <div className="space-y-2">
                        <Label htmlFor="partyName">Grower / Party Name</Label>
                        <PartySelector value={partyName} onChange={setPartyName} filter="all" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="statementDate">Statement Date</Label>
                        <Input id="statementDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                </div>

                {/* Watak Sales Section */}
                 <div className="border p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Watak Sales (Credit)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="patti">Total Patti</Label>
                            <Input id="patti" type="number" value={patti || ''} onChange={(e) => setPatti(Number(e.target.value))} placeholder="e.g., 100" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="dabba">Total Dabba</Label>
                            <Input id="dabba" type="number" value={dabba || ''} onChange={(e) => setDabba(Number(e.target.value))} placeholder="e.g., 50" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="watakSalesTotal">Total Watak Sales Amount</Label>
                            <Input id="watakSalesTotal" type="number" value={watakSalesTotal || ''} onChange={(e) => setWatakSalesTotal(Number(e.target.value))} placeholder="e.g., 50000" />
                        </div>
                    </div>
                </div>

                {/* Expenses Section */}
                <div className="border p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Expenses / Payments (Debit)</h3>
                    <div className="space-y-3">
                    {expenses.map(exp => (
                        <div key={exp.id} className="flex items-center gap-2">
                            <Input 
                                placeholder="Expense Description"
                                value={exp.description}
                                onChange={(e) => handleExpenseChange(exp.id, 'description', e.target.value)}
                            />
                            <Input 
                                type="number"
                                className="w-48"
                                placeholder="Amount"
                                value={exp.amount || ''}
                                onChange={(e) => handleExpenseChange(exp.id, 'amount', Number(e.target.value))}
                            />
                            <Button variant="ghost" size="icon" onClick={() => removeExpenseRow(exp.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                    </div>
                    <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={addExpenseRow}>
                        <PlusCircle className="h-4 w-4" /> Add Expense
                    </Button>
                </div>
                
                <Separator />

                {/* Final Calculation */}
                 <div className="bg-muted p-4 rounded-lg space-y-4">
                    <div className="flex justify-between items-center text-lg">
                        <span className="text-muted-foreground">Total Watak Sales:</span>
                        <span className="font-bold">₹{watakSalesTotal.toLocaleString('en-IN')}</span>
                    </div>
                     <div className="flex justify-between items-center text-lg">
                        <span className="text-muted-foreground">Total Expenses:</span>
                        <span className="font-bold">- ₹{totalExpenses.toLocaleString('en-IN')}</span>
                    </div>
                     <div className="flex justify-between items-center text-2xl font-bold border-t pt-4 mt-4">
                        <span>Final Balance:</span>
                         <span className={finalBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                           ₹{Math.abs(finalBalance).toLocaleString('en-IN')}
                           <span className="text-sm ml-2">({finalBalance >= 0 ? 'Profit / Balance at F.Co' : 'Loss / Due to Grower'})</span>
                        </span>
                    </div>
                </div>

            </CardContent>
             <CardFooter className="justify-center gap-4">
                <Button className="gap-2" onClick={handlePrint}>
                    <Printer className="h-4 w-4" /> Print / Save PDF
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
