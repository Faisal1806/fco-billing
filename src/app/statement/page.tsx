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

type CreditRow = {
  id: number;
  date: string;
  watakNo: string;
  peti: number;
  daba: number;
  netSale: number;
};

type DebitRow = {
  id: number;
  date: string;
  details: string;
  amount: number;
};

export default function StatementOfAccountPage() {
  const { toast } = useToast();

  // Header State
  const [partyName, setPartyName] = React.useState('');
  const [statementDate, setStatementDate] = React.useState(new Date().toISOString().split('T')[0]);
  
  // Credit (Sales) State
  const [creditRows, setCreditRows] = React.useState<CreditRow[]>([
    { id: 1, date: '', watakNo: '', peti: 0, daba: 0, netSale: 0 }
  ]);

  // Debit (Remittance) State
  const [debitRows, setDebitRows] = React.useState<DebitRow[]>([
    { id: 1, date: '', details: '', amount: 0 }
  ]);
  
  // --- Credit Functions ---
  const addCreditRow = () => {
    setCreditRows(prev => [...prev, { id: Date.now(), date: '', watakNo: '', peti: 0, daba: 0, netSale: 0 }]);
  };
  const removeCreditRow = (id: number) => {
    setCreditRows(prev => prev.filter(row => row.id !== id));
  };
  const handleCreditChange = (id: number, field: keyof Omit<CreditRow, 'id'>, value: string | number) => {
    setCreditRows(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  // --- Debit Functions ---
  const addDebitRow = () => {
    setDebitRows(prev => [...prev, { id: Date.now(), date: '', details: '', amount: 0 }]);
  };
  const removeDebitRow = (id: number) => {
    setDebitRows(prev => prev.filter(row => row.id !== id));
  };
  const handleDebitChange = (id: number, field: keyof Omit<DebitRow, 'id'>, value: string | number) => {
    setDebitRows(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  // --- Calculations ---
  const creditTotals = React.useMemo(() => {
    return creditRows.reduce((acc, row) => {
        acc.peti += Number(row.peti) || 0;
        acc.daba += Number(row.daba) || 0;
        acc.netSale += Number(row.netSale) || 0;
        return acc;
    }, { peti: 0, daba: 0, netSale: 0});
  }, [creditRows]);

  const totalDebit = React.useMemo(() => {
    return debitRows.reduce((acc, row) => acc + (Number(row.amount) || 0), 0);
  }, [debitRows]);

  const finalBalance = React.useMemo(() => {
      return creditTotals.netSale - totalDebit;
  }, [creditTotals.netSale, totalDebit]);

  
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
    pdf.save(`Statement-${partyName}-${statementDate}.pdf`);
  };

  return (
    <div className="space-y-6">
        <Card className="max-w-6xl mx-auto" id="statement-print-area">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">STATEMENT OF ACCOUNT</CardTitle>
                <CardDescription>
                    <p className="font-bold text-lg">Firdous Ahmad & Company</p>
                    <p>FRUIT MERCHANTS & COMMISSION AGENTS</p>
                    <p className="text-xs">Shed No.13, Fud No-12 A Fruit Mandi Apple Town Sopore -193201 (KMR)</p>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Header Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg">
                    <div className="space-y-2">
                        <Label htmlFor="partyName">M/s (Customer Name)</Label>
                        <PartySelector value={partyName} onChange={setPartyName} filter="all" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="statementDate">Date</Label>
                        <Input id="statementDate" type="date" value={statementDate} onChange={(e) => setStatementDate(e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* CREDIT Column */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-center text-green-600 border-b-2 pb-2">CREDIT</h3>
                        <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground">
                            <span className="col-span-2">Date</span>
                            <span className="col-span-2">Watak No</span>
                            <span className="col-span-2">Peti</span>
                            <span className="col-span-2">Daba</span>
                            <span className="col-span-3">Net Sale</span>
                            <span className="col-span-1"></span>
                        </div>
                        {creditRows.map(row => (
                            <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                                <Input className="col-span-2" type="text" placeholder="Date" value={row.date} onChange={e => handleCreditChange(row.id, 'date', e.target.value)} />
                                <Input className="col-span-2" placeholder="Watak No" value={row.watakNo} onChange={e => handleCreditChange(row.id, 'watakNo', e.target.value)} />
                                <Input className="col-span-2" type="number" placeholder="Peti" value={row.peti || ''} onChange={e => handleCreditChange(row.id, 'peti', Number(e.target.value))} />
                                <Input className="col-span-2" type="number" placeholder="Daba" value={row.daba || ''} onChange={e => handleCreditChange(row.id, 'daba', Number(e.target.value))} />
                                <Input className="col-span-3" type="number" placeholder="Net Sale" value={row.netSale || ''} onChange={e => handleCreditChange(row.id, 'netSale', Number(e.target.value))} />
                                <Button variant="ghost" size="icon" className="col-span-1" onClick={() => removeCreditRow(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addCreditRow} className="gap-1"><PlusCircle className="h-4 w-4" /> Add Credit Row</Button>
                        <Separator />
                        <div className="grid grid-cols-12 gap-2 font-bold text-lg">
                           <span className="col-span-4 text-right">Total:</span>
                           <span className="col-span-2 text-center">{creditTotals.peti}</span>
                           <span className="col-span-2 text-center">{creditTotals.daba}</span>
                           <span className="col-span-3 text-right">₹{creditTotals.netSale.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                     {/* DEBIT Column */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-center text-red-600 border-b-2 pb-2">DEBIT</h3>
                         <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground">
                            <span className="col-span-3">Date</span>
                            <span className="col-span-5">Details of Remittance</span>
                            <span className="col-span-3">Amount</span>
                            <span className="col-span-1"></span>
                        </div>
                         {debitRows.map(row => (
                            <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                                <Input className="col-span-3" type="text" placeholder="Date" value={row.date} onChange={e => handleDebitChange(row.id, 'date', e.target.value)} />
                                <Input className="col-span-5" placeholder="Details" value={row.details} onChange={e => handleDebitChange(row.id, 'details', e.target.value)} />
                                <Input className="col-span-3" type="number" placeholder="Amount" value={row.amount || ''} onChange={e => handleDebitChange(row.id, 'amount', Number(e.target.value))} />
                                <Button variant="ghost" size="icon" className="col-span-1" onClick={() => removeDebitRow(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addDebitRow} className="gap-1"><PlusCircle className="h-4 w-4" /> Add Debit Row</Button>
                        <Separator />
                         <div className="grid grid-cols-12 gap-2 font-bold text-lg">
                            <span className="col-span-8 text-right">Total:</span>
                            <span className="col-span-3 text-right">₹{totalDebit.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Final Calculation */}
                 <div className="bg-muted p-4 rounded-lg space-y-4">
                    <div className="flex justify-between items-center text-lg">
                        <span className="text-muted-foreground">Total Credit (Jama):</span>
                        <span className="font-bold">₹{creditTotals.netSale.toLocaleString('en-IN')}</span>
                    </div>
                     <div className="flex justify-between items-center text-lg">
                        <span className="text-muted-foreground">Total Debit (Kharch):</span>
                        <span className="font-bold">- ₹{totalDebit.toLocaleString('en-IN')}</span>
                    </div>
                     <div className="flex justify-between items-center text-2xl font-bold border-t pt-4 mt-4">
                        <span>Balance (Baqaya):</span>
                         <span className={finalBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                           ₹{Math.abs(finalBalance).toLocaleString('en-IN')}
                           <span className="text-sm ml-2">({finalBalance >= 0 ? 'Balance at F.Co' : 'Due to Grower'})</span>
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
