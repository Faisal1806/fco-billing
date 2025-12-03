
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Printer, ArrowDown, ArrowUp, Minus, Equals } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PartySelector } from './party-selector';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';

type CreditEntry = {
  date: string;
  notes: string;
  peti: number;
  dabba: number;
  grossSale: number;
  expenses: number;
  netSale: number;
};

type DebitEntry = {
  date: string;
  remittanceDetails: string;
  debitAmount: number;
};

export function StatementMakingTab() {
  const { toast } = useToast();
  const router = useRouter();

  const [customer, setCustomer] = React.useState('');
  const [statementDate, setStatementDate] = React.useState(new Date().toISOString().split('T')[0]);

  const [creditRows, setCreditRows] = React.useState<CreditEntry[]>(Array(10).fill({ date: '', notes: '', peti: 0, dabba: 0, grossSale: 0, expenses: 0, netSale: 0 }));
  const [debitRows, setDebitRows] = React.useState<DebitEntry[]>(Array(10).fill({ date: '', remittanceDetails: '', debitAmount: 0 }));

  const handleCreditUpdate = (index: number, field: keyof CreditEntry, value: any) => {
    const newRows = [...creditRows];
    newRows[index] = { ...newRows[index], [field]: value };
    // Auto-calculate net sale
    if (field === 'grossSale' || field === 'expenses') {
        const gross = field === 'grossSale' ? Number(value) : newRows[index].grossSale;
        const exp = field === 'expenses' ? Number(value) : newRows[index].expenses;
        newRows[index].netSale = gross - exp;
    }
    setCreditRows(newRows);
  };

  const handleDebitUpdate = (index: number, field: keyof DebitEntry, value: any) => {
    const newRows = [...debitRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setDebitRows(newRows);
  };

  const addCreditRow = () => setCreditRows(prev => [...prev, { date: '', notes: '', peti: 0, dabba: 0, grossSale: 0, expenses: 0, netSale: 0 }]);
  const removeCreditRow = (index: number) => setCreditRows(prev => prev.filter((_, i) => i !== index));

  const addDebitRow = () => setDebitRows(prev => [...prev, { date: '', remittanceDetails: '', debitAmount: 0 }]);
  const removeDebitRow = (index: number) => setDebitRows(prev => prev.filter((_, i) => i !== index));
  
  const creditTotals = React.useMemo(() => creditRows.reduce((acc, tx) => {
        acc.peti += Number(tx.peti) || 0;
        acc.dabba += Number(tx.dabba) || 0;
        acc.grossSale += Number(tx.grossSale) || 0;
        acc.expenses += Number(tx.expenses) || 0;
        acc.netSale += Number(tx.netSale) || 0;
        return acc;
    }, { peti: 0, dabba: 0, grossSale: 0, expenses: 0, netSale: 0 }), [creditRows]);

    const debitTotals = React.useMemo(() => debitRows.reduce((acc, tx) => {
        acc.debitAmount += Number(tx.debitAmount) || 0;
        return acc;
    }, { debitAmount: 0 }), [debitRows]);
    
    const balance = creditTotals.netSale - debitTotals.debitAmount;

  const handleSave = () => {
    if (!customer) {
        toast({ variant: 'destructive', title: 'Customer name is required' });
        return;
    }
    const statementId = `manual-statement-${customer.replace(/\s+/g, '-')}-${Date.now()}`;
    const data = {
        id: statementId,
        customer,
        statementDate,
        creditRows: creditRows.filter(r => r.date || r.notes || r.netSale > 0),
        debitRows: debitRows.filter(r => r.date || r.remittanceDetails || r.debitAmount > 0),
        creditTotals,
        debitTotals,
        balance,
    };
    localStorage.setItem(statementId, JSON.stringify(data));
    toast({ title: 'Statement Saved Locally' });
  };
  
  const handlePrint = () => {
      // Logic for printing would go here, possibly opening a new window with a print-specific layout.
      // For now, we can use the browser's print functionality on the current component.
      window.print();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
             <CardTitle>Manual Statement of Account</CardTitle>
             <Button onClick={handlePrint} variant="outline" size="sm" className="gap-1"><Printer className="h-4 w-4"/> Print</Button>
        </div>
      </CardHeader>
      <CardContent>
         <div className="grid grid-cols-2 gap-4 mb-4">
            <PartySelector value={customer} onChange={setCustomer} filter="grower" />
            <Input type="date" value={statementDate} onChange={(e) => setStatementDate(e.target.value)} />
         </div>
         <div className="grid grid-cols-2 gap-0 border rounded-lg overflow-hidden">
            {/* CREDIT SIDE */}
            <div className="border-r pr-1">
                <h3 className="font-bold text-center mb-2 p-1 bg-muted">CREDIT</h3>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="h-8 p-1 text-xs">Date</TableHead>
                            <TableHead className="h-8 p-1 text-xs">Doc</TableHead>
                            <TableHead className="h-8 p-1 text-xs">Peti</TableHead>
                            <TableHead className="h-8 p-1 text-xs">Daba</TableHead>
                            <TableHead className="h-8 p-1 text-xs text-right">Gross</TableHead>
                            <TableHead className="h-8 p-1 text-xs text-right">Exp</TableHead>
                            <TableHead className="h-8 p-1 text-xs text-right">Net</TableHead>
                            <TableHead className="w-8 h-8 p-1"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {creditRows.map((tx, i) => (
                            <TableRow key={`credit-${i}`} className="h-6">
                                <TableCell className="p-0.5"><Input type="date" className="h-7 text-xs" value={tx.date} onChange={e => handleCreditUpdate(i, 'date', e.target.value)} /></TableCell>
                                <TableCell className="p-0.5"><Input className="h-7 text-xs" placeholder="Notes" value={tx.notes} onChange={e => handleCreditUpdate(i, 'notes', e.target.value)} /></TableCell>
                                <TableCell className="p-0.5"><Input type="number" className="h-7 w-12 text-xs text-right" value={tx.peti || ''} onChange={e => handleCreditUpdate(i, 'peti', e.target.value)} /></TableCell>
                                <TableCell className="p-0.5"><Input type="number" className="h-7 w-12 text-xs text-right" value={tx.dabba || ''} onChange={e => handleCreditUpdate(i, 'dabba', e.target.value)} /></TableCell>
                                <TableCell className="p-0.5"><Input type="number" className="h-7 text-xs text-right" value={tx.grossSale || ''} onChange={e => handleCreditUpdate(i, 'grossSale', e.target.value)} /></TableCell>
                                <TableCell className="p-0.5"><Input type="number" className="h-7 text-xs text-right" value={tx.expenses || ''} onChange={e => handleCreditUpdate(i, 'expenses', e.target.value)} /></TableCell>
                                <TableCell className="p-0.5 text-xs text-right font-mono font-bold">{tx.netSale?.toFixed(2) || ''}</TableCell>
                                <TableCell className="p-0.5"><Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeCreditRow(i)}><Trash2 className="h-3 w-3 text-destructive"/></Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 <Button variant="outline" size="sm" onClick={addCreditRow} className="m-1"><PlusCircle className="h-4 w-4 mr-2"/>Add Credit Row</Button>
            </div>
            {/* DEBIT SIDE */}
            <div className="pl-1">
                <h3 className="font-bold text-center mb-2 p-1 bg-muted">DEBIT</h3>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="h-8 p-1 text-xs">Date</TableHead>
                            <TableHead className="h-8 p-1 text-xs">Details of Remittance</TableHead>
                            <TableHead className="h-8 p-1 text-xs text-right">Amount</TableHead>
                            <TableHead className="w-8 h-8 p-1"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {debitRows.map((tx, i) => (
                            <TableRow key={`debit-${i}`} className="h-6">
                                <TableCell className="p-0.5"><Input type="date" className="h-7 text-xs" value={tx.date} onChange={e => handleDebitUpdate(i, 'date', e.target.value)} /></TableCell>
                                <TableCell className="p-0.5"><Input className="h-7 text-xs" placeholder="e.g., Cash, Bank Transfer" value={tx.remittanceDetails} onChange={e => handleDebitUpdate(i, 'remittanceDetails', e.target.value)} /></TableCell>
                                <TableCell className="p-0.5"><Input type="number" className="h-7 text-xs text-right" value={tx.debitAmount || ''} onChange={e => handleDebitUpdate(i, 'debitAmount', e.target.value)} /></TableCell>
                                <TableCell className="p-0.5"><Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeDebitRow(i)}><Trash2 className="h-3 w-3 text-destructive"/></Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 <Button variant="outline" size="sm" onClick={addDebitRow} className="m-1"><PlusCircle className="h-4 w-4 mr-2"/>Add Debit Row</Button>
            </div>
            {/* TOTALS */}
            <div className="col-span-2 border-t mt-2"></div>
            <div className="border-r pr-1">
                <Table>
                    <TableBody>
                        <TableRow className="h-6 font-bold">
                            <TableCell className="p-1 text-xs" colSpan={2}>Total Credit</TableCell>
                            <TableCell className="p-1 text-xs">{creditTotals.peti}</TableCell>
                            <TableCell className="p-1 text-xs">{creditTotals.dabba}</TableCell>
                            <TableCell className="p-1 text-xs text-right font-mono">{creditTotals.grossSale.toFixed(0)}</TableCell>
                            <TableCell className="p-1 text-xs text-right font-mono">{creditTotals.expenses.toFixed(0)}</TableCell>
                            <TableCell className="p-1 text-xs text-right font-mono">{creditTotals.netSale.toFixed(2)}</TableCell>
                            <TableCell className="w-8 p-1"></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
            <div className="pl-1">
                <Table>
                    <TableBody>
                        <TableRow className="h-6 font-bold">
                                <TableCell className="p-1 text-xs" colSpan={2}>Total Debit</TableCell>
                                <TableCell className="p-1 text-xs text-right font-mono">{debitTotals.debitAmount.toFixed(2)}</TableCell>
                                <TableCell className="w-8 p-1"></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-center gap-4">
        <div className="w-full p-4 bg-muted rounded-lg flex justify-around items-center text-lg font-bold">
            <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Credit</p>
                <p className="flex items-center gap-1"><ArrowDown className="h-5 w-5 text-green-500" /> ₹{creditTotals.netSale.toFixed(2)}</p>
            </div>
            <Minus className="h-6 w-6 text-muted-foreground" />
            <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Debit</p>
                <p className="flex items-center gap-1"><ArrowUp className="h-5 w-5 text-red-500" /> ₹{debitTotals.debitAmount.toFixed(2)}</p>
            </div>
            <Equals className="h-6 w-6 text-muted-foreground" />
            <div className="text-center">
                <p className="text-sm text-muted-foreground">Final Balance</p>
                {balance === 0 ? (
                    <p className="text-yellow-500">₹0.00 <span className="text-xs ml-1">(Settled)</span></p>
                ) : (
                    <p className={`${balance > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ₹{Math.abs(balance).toFixed(2)}
                        <span className="text-xs ml-1">({balance > 0 ? 'Receivable' : 'Payable'})</span>
                    </p>
                )}
            </div>
        </div>
        <Button onClick={handleSave} className="w-full max-w-sm">Save Statement</Button>
      </CardFooter>
    </Card>
  );
}

    