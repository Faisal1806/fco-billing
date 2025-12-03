'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Logo } from '@/components/logo';

type CreditRow = {
  id: number;
  date: string;
  watakNo: string;
  peti: number;
  daba: number;
  grossSale: number;
  expenses: number;
  netSale: number;
};

type DebitRow = {
  id: number;
  date: string;
  details: string;
  amount: number;
};

export default function StatementOfAccountPage() {

  // Header State
  const [sNo, setSNo] = React.useState('');
  const [partyName, setPartyName] = React.useState('');
  const [statementDate, setStatementDate] = React.useState(new Date().toISOString().split('T')[0]);
  
  // Credit (Sales) State
  const [creditRows, setCreditRows] = React.useState<CreditRow[]>(
    Array.from({ length: 12 }, (_, i) => ({ id: i, date: '', watakNo: '', peti: 0, daba: 0, grossSale: 0, expenses: 0, netSale: 0 }))
  );

  // Debit (Remittance) State
  const [debitRows, setDebitRows] = React.useState<DebitRow[]>(
     Array.from({ length: 12 }, (_, i) => ({ id: i, date: '', details: '', amount: 0 }))
  );
  
  // --- Credit Functions ---
  const addCreditRow = () => {
    setCreditRows(prev => [...prev, { id: Date.now(), date: '', watakNo: '', peti: 0, daba: 0, grossSale: 0, expenses: 0, netSale: 0 }]);
  };
  const removeCreditRow = (id: number) => {
    setCreditRows(prev => prev.length > 1 ? prev.filter(row => row.id !== id) : prev);
  };
  const handleCreditChange = (id: number, field: keyof Omit<CreditRow, 'id'>, value: string | number) => {
    setCreditRows(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  // --- Debit Functions ---
  const addDebitRow = () => {
    setDebitRows(prev => [...prev, { id: Date.now(), date: '', details: '', amount: 0 }]);
  };
  const removeDebitRow = (id: number) => {
    setDebitRows(prev => prev.length > 1 ? prev.filter(row => row.id !== id) : prev);
  };
  const handleDebitChange = (id: number, field: keyof Omit<DebitRow, 'id'>, value: string | number) => {
    setDebitRows(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  // --- Calculations ---
  const creditTotals = React.useMemo(() => {
    return creditRows.reduce((acc, row) => {
        acc.peti += Number(row.peti) || 0;
        acc.daba += Number(row.daba) || 0;
        acc.grossSale += Number(row.grossSale) || 0;
        acc.expenses += Number(row.expenses) || 0;
        acc.netSale += Number(row.netSale) || 0;
        return acc;
    }, { peti: 0, daba: 0, grossSale: 0, expenses: 0, netSale: 0 });
  }, [creditRows]);

  const totalDebit = React.useMemo(() => {
    return debitRows.reduce((acc, row) => acc + (Number(row.amount) || 0), 0);
  }, [debitRows]);

  const finalBalance = React.useMemo(() => {
      return creditTotals.netSale - totalDebit;
  }, [creditTotals.netSale, totalDebit]);

  
  const handlePrint = async () => {
    const statementElement = document.getElementById('statement-print-area');
    if (!statementElement) return;

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
                 <div className="text-muted-foreground flex justify-between items-center text-xs">
                    <span>Trade Mark: F.Co.</span>
                    <span className="font-bold text-lg text-foreground">STATEMENT OF ACCOUNT</span>
                    <span>Mob: 9797002164, 7298998763</span>
                </div>
                <div className="flex items-center justify-center gap-4 py-2">
                    <Logo className="h-16 w-16" />
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-red-700">Firdous Ahmad & Company</h1>
                        <p className="font-semibold">FRUIT MERCHANTS & COMMISSION AGENTS</p>
                        <p className="text-sm">Shed No.13, Fud No-12 A Fruit Mandi Apple Town Sopore -193201 (KMR)</p>
                        <p className="text-sm">Prop: Firdous Ahmad Lone (Nadihal Rafiabad)</p>
                    </div>
                    <Logo className="h-16 w-16" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Header Details */}
                <div className="grid grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="sNo">S.No:</Label>
                        <Input id="sNo" value={sNo} onChange={(e) => setSNo(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="partyName">M/s</Label>
                        <Input id="partyName" value={partyName} onChange={(e) => setPartyName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="statementDate">Date</Label>
                        <Input id="statementDate" type="date" value={statementDate} onChange={(e) => setStatementDate(e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-t-2 border-b-2 border-black py-4">
                    {/* CREDIT Column */}
                    <div className="space-y-1 lg:pr-2 lg:border-r-2 lg:border-black">
                        <h3 className="text-lg font-bold text-center">CREDIT (Jama)</h3>
                        <div className="grid grid-cols-7 gap-1 text-[10px] font-bold text-muted-foreground text-center">
                            <span className="col-span-1">Date</span>
                            <span className="col-span-1">Watak No.</span>
                            <span className="col-span-1">Peti</span>
                            <span className="col-span-1">Daba</span>
                            <span className="col-span-1">Gross Sale</span>
                            <span className="col-span-1">Expenses</span>
                            <span className="col-span-1">Net Sale</span>
                        </div>
                        {creditRows.map((row, i) => (
                            <div key={row.id} className="grid grid-cols-7 gap-1 items-center">
                                <Input className="h-8 text-xs" value={row.date} onChange={e => handleCreditChange(row.id, 'date', e.target.value)} />
                                <Input className="h-8 text-xs" value={row.watakNo} onChange={e => handleCreditChange(row.id, 'watakNo', e.target.value)} />
                                <Input className="h-8 text-xs" type="number" value={row.peti || ''} onChange={e => handleCreditChange(row.id, 'peti', Number(e.target.value))} />
                                <Input className="h-8 text-xs" type="number" value={row.daba || ''} onChange={e => handleCreditChange(row.id, 'daba', Number(e.target.value))} />
                                <Input className="h-8 text-xs" type="number" value={row.grossSale || ''} onChange={e => handleCreditChange(row.id, 'grossSale', Number(e.target.value))} />
                                <Input className="h-8 text-xs" type="number" value={row.expenses || ''} onChange={e => handleCreditChange(row.id, 'expenses', Number(e.target.value))} />
                                <Input className="h-8 text-xs" type="number" value={row.netSale || ''} onChange={e => handleCreditChange(row.id, 'netSale', Number(e.target.value))} />
                            </div>
                        ))}
                         <div className="flex justify-start mt-2 print-hidden">
                           <Button size="sm" variant="outline" onClick={addCreditRow} className="gap-1"><PlusCircle className="h-4 w-4"/>Add Row</Button>
                         </div>
                         <Separator className="my-2 bg-black"/>
                         <div className="grid grid-cols-7 gap-1 font-bold text-sm text-center">
                           <span className="col-span-2">Total:</span>
                           <span className="col-span-1">{creditTotals.peti}</span>
                           <span className="col-span-1">{creditTotals.daba}</span>
                           <span className="col-span-1 text-right pr-1">₹{creditTotals.grossSale.toLocaleString('en-IN')}</span>
                           <span className="col-span-1 text-right pr-1">₹{creditTotals.expenses.toLocaleString('en-IN')}</span>
                           <span className="col-span-1 text-right pr-1">₹{creditTotals.netSale.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                     {/* DEBIT Column */}
                    <div className="space-y-1 lg:pl-2">
                        <h3 className="text-lg font-bold text-center">DEBIT (Kharch)</h3>
                         <div className="grid grid-cols-3 gap-1 text-[10px] font-bold text-muted-foreground text-center">
                            <span className="col-span-1">Date</span>
                            <span className="col-span-1">Details of Remittance</span>
                            <span className="col-span-1">Amount</span>
                        </div>
                         {debitRows.map((row, i) => (
                            <div key={row.id} className="grid grid-cols-3 gap-1 items-center">
                                <Input className="h-8 text-xs" value={row.date} onChange={e => handleDebitChange(row.id, 'date', e.target.value)} />
                                <Input className="h-8 text-xs font-urdu" placeholder="تفصیل" value={row.details} onChange={e => handleDebitChange(row.id, 'details', e.target.value)} />
                                <Input className="h-8 text-xs" type="number" value={row.amount || ''} onChange={e => handleDebitChange(row.id, 'amount', Number(e.target.value))} />
                            </div>
                        ))}
                        <div className="flex justify-start mt-2 print-hidden">
                           <Button size="sm" variant="outline" onClick={addDebitRow} className="gap-1"><PlusCircle className="h-4 w-4"/>Add Row</Button>
                        </div>
                         <Separator className="my-2 bg-black" />
                         <div className="grid grid-cols-3 gap-1 font-bold text-sm">
                            <span className="col-span-2 text-right pr-1 font-urdu">کل خرچ:</span>
                            <span className="col-span-1 text-right pr-1">₹{totalDebit.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                {/* Final Calculation */}
                 <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2 text-right pr-4 border-r-2 border-black">
                        <div className="flex justify-end items-center font-bold">
                            <span className="font-urdu text-lg">کل ولنگ مع:</span>
                            <span className="ml-4 text-lg">₹{creditTotals.netSale.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                     <div className="space-y-2 text-right pr-4">
                        <div className="flex justify-end items-center font-bold">
                            <span className="font-urdu text-lg">کل خرچ:</span>
                            <span className="ml-4 text-lg">₹{totalDebit.toLocaleString('en-IN')}</span>
                        </div>
                        <Separator className="bg-black" />
                        <div className="flex justify-end items-center font-bold">
                            {finalBalance >= 0 ? (
                                <>
                                <span className="font-urdu text-lg text-green-600">جمع (Jama/Profit):</span>
                                <span className="ml-4 text-lg text-green-600">₹{finalBalance.toLocaleString('en-IN')}</span>
                                </>
                            ) : (
                                <>
                                <span className="font-urdu text-lg text-red-600">بقایا (Baqaya/Due):</span>
                                <span className="ml-4 text-lg text-red-600">₹{Math.abs(finalBalance).toLocaleString('en-IN')}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
             <CardFooter className="justify-between items-end">
                <div className="flex flex-col items-center">
                    <p className="font-bold">Signature</p>
                </div>
                <Button className="gap-2 print-hidden" onClick={handlePrint}>
                    <Printer className="h-4 w-4" /> Print / Save PDF
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
