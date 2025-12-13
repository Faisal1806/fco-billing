

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
import { PlusCircle, Trash2, Printer, Eye, Save, FilePenLine, FilePlus, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import '@/app/khata/print.css';


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

const emptyCreditRow = { id: Date.now(), date: '', watakNo: '', peti: 0, daba: 0, grossSale: 0, expenses: 0, netSale: 0 };
const emptyDebitRow = { id: Date.now(), date: '', details: '', amount: 0 };

export default function StatementOfAccountPage() {
    const { toast } = useToast();
    const router = useRouter();
    // Header State
    const [sNo, setSNo] = React.useState('');
    const [partyName, setPartyName] = React.useState('');
    const [statementDate, setStatementDate] = React.useState(new Date().toISOString().split('T')[0]);
    
    // Credit (Sales) State
    const [creditRows, setCreditRows] = React.useState<CreditRow[]>([emptyCreditRow]);
    // Debit (Remittance) State
    const [debitRows, setDebitRows] = React.useState<DebitRow[]>([emptyDebitRow]);

    // Saved statements state
    const [savedStatements, setSavedStatements] = React.useState<any[]>([]);
    const [isEditing, setIsEditing] = React.useState(false);
    
    const fetchStatements = () => {
        if (typeof window !== 'undefined') {
            const statements = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('manual-statement-')) {
                    statements.push(JSON.parse(localStorage.getItem(key)!));
                }
            }
            // Sort by statement number (sNo)
            setSavedStatements(statements.sort((a,b) => Number(a.sNo) - Number(b.sNo)));
        }
    };
    
    React.useEffect(() => {
        fetchStatements();
    }, []);

    // --- Credit Functions ---
    const addCreditRow = () => {
        setCreditRows(prev => [...prev, { ...emptyCreditRow, id: Date.now() }]);
    };
    const removeCreditRow = (id: number) => {
        setCreditRows(prev => prev.length > 1 ? prev.filter(row => row.id !== id) : [{...emptyCreditRow, id: Date.now()}]);
    };
    const handleCreditChange = (id: number, field: keyof Omit<CreditRow, 'id'>, value: string | number) => {
        setCreditRows(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));
    };

    // --- Debit Functions ---
    const addDebitRow = () => {
        setDebitRows(prev => [...prev, { ...emptyDebitRow, id: Date.now() }]);
    };
    const removeDebitRow = (id: number) => {
        setDebitRows(prev => prev.length > 1 ? prev.filter(row => row.id !== id) : [{...emptyDebitRow, id: Date.now()}]);
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
    
    const resetForm = () => {
        setSNo('');
        setPartyName('');
        setStatementDate(new Date().toISOString().split('T')[0]);
        setCreditRows([emptyCreditRow]);
        setDebitRows([emptyDebitRow]);
        setIsEditing(false);
    };

    const handleSave = () => {
        if (!sNo || !partyName) {
            toast({ variant: "destructive", title: "Missing Info", description: "Please enter a Statement No. and Party Name." });
            return;
        }
        const statementData = {
            sNo,
            partyName,
            statementDate,
            creditRows: creditRows.filter(r => r.netSale > 0 || r.grossSale > 0 || r.peti > 0 || r.daba > 0),
            debitRows: debitRows.filter(r => r.amount > 0),
            creditTotals,
            totalDebit,
            finalBalance
        };
        localStorage.setItem(`manual-statement-${sNo}`, JSON.stringify(statementData));
        toast({ title: "Statement Saved", description: "The statement has been saved locally." });
        fetchStatements();
        setIsEditing(true);
    };

    const handleLoadStatement = (statement: any) => {
        setSNo(statement.sNo);
        setPartyName(statement.partyName);
        setStatementDate(statement.statementDate);
        setCreditRows(statement.creditRows.length > 0 ? statement.creditRows : [emptyCreditRow]);
        setDebitRows(statement.debitRows.length > 0 ? statement.debitRows : [emptyDebitRow]);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteStatement = (sNoToDelete: string) => {
        if (!window.confirm(`Are you sure you want to delete statement #${sNoToDelete}?`)) return;
        localStorage.removeItem(`manual-statement-${sNoToDelete}`);
        toast({ title: "Statement Deleted" });
        fetchStatements();
        if (sNo === sNoToDelete) {
            resetForm();
        }
    };


  const handleSaveAsPdf = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;

    // Load custom font for signature
    doc.addFont('/fonts/DancingScript-Bold.ttf', 'DancingScript', 'normal');

    // Header
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#DC2626');
    doc.text('🍎', margin, margin);
    doc.setTextColor('#000000');
    doc.setFont('helvetica', 'normal');
    doc.text('Mob: 9797002164, 7006136330, 9906740921', pageWidth - margin, margin, { align: 'right' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('STATEMENT OF ACCOUNT', pageWidth / 2, margin + 5, { align: 'center' });

    doc.setFontSize(22);
    doc.setTextColor('#DC2626'); // Red color
    doc.text('Firdous Ahmad & Company', pageWidth / 2, margin + 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor('#000000');
    doc.setFont('helvetica', 'normal');
    doc.text('FRUIT MERCHANTS & COMMISSION AGENTS', pageWidth / 2, margin + 20, { align: 'center' });
    doc.text('Shed No.13, Fud No-12 A Fruit Mandi Apple Town Sopore -193201 (KMR)', pageWidth / 2, margin + 24, { align: 'center' });
    doc.text('Prop: Firdous Ahmad Lone (Nadihal Rafiabad)', pageWidth / 2, margin + 28, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#DC2626');
    doc.text('🍎', pageWidth - margin - 5, margin);
    doc.setTextColor('#000000');

    // Bill Info
    doc.setLineWidth(0.5);
    doc.line(margin, margin + 32, pageWidth - margin, margin + 32);
    doc.setFontSize(10);
    doc.text(`S.No: ${sNo}`, margin, margin + 37);
    doc.text(`M/s: ${partyName}`, pageWidth / 2 - 30, margin + 37);
    doc.text(`Date: ${new Date(statementDate).toLocaleDateString('en-GB')}`, pageWidth - margin, margin + 37, { align: 'right' });
    doc.line(margin, margin + 40, pageWidth - margin, margin + 40);

    // --- Tables ---
    let finalY = margin + 42;

    // Credit Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CREDIT (Jama)', margin, finalY);
    const creditData = creditRows
        .filter(r => r.netSale > 0 || r.grossSale > 0 || r.peti > 0 || r.daba > 0)
        .map(r => [
          r.date ? new Date(r.date).toLocaleDateString('en-GB') : '', 
          r.watakNo, 
          r.peti || '', 
          r.daba || '', 
          r.grossSale ? r.grossSale.toLocaleString('en-IN') : '', 
          r.expenses ? r.expenses.toLocaleString('en-IN') : '', 
          r.netSale ? r.netSale.toLocaleString('en-IN') : ''
        ]);
    
    autoTable(doc, {
      head: [['Date', 'Watak No.', 'Peti', 'Daba', 'Gross', 'Exp', 'Net']],
      body: creditData,
      startY: finalY + 2,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.5, lineColor: '#000' },
      headStyles: { fillColor: '#F3F4F6', textColor: '#000', fontStyle: 'bold' },
      foot: [
          [{ content: 'Total:', colSpan: 2, styles: { halign: 'right' } }, creditTotals.peti, creditTotals.daba, creditTotals.grossSale.toLocaleString('en-IN'), creditTotals.expenses.toLocaleString('en-IN'), creditTotals.netSale.toLocaleString('en-IN')]
      ],
      footStyles: { fontStyle: 'bold', fillColor: '#E5E7EB' },
    });
    
    finalY = (doc as any).lastAutoTable.finalY + 5;


    // Debit Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DEBIT (Kharch)', margin, finalY);
    const debitData = debitRows
        .filter(r => r.amount > 0)
        .map(r => [
          r.date ? new Date(r.date).toLocaleDateString('en-GB') : '', 
          r.details, 
          r.amount ? r.amount.toLocaleString('en-IN') : ''
        ]);

    autoTable(doc, {
        head: [['Date', 'Details', 'Amount']],
        body: debitData,
        startY: finalY + 2,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.5, lineColor: '#000' },
        headStyles: { fillColor: '#F3F4F6', textColor: '#000', fontStyle: 'bold' },
        foot: [
            [{ content: 'Total:', colSpan: 2, styles: { halign: 'right' } }, totalDebit.toLocaleString('en-IN')]
        ],
        footStyles: { fontStyle: 'bold', fillColor: '#E5E7EB' },
    });
    
    finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Final Balance Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    
    const summaryX = margin;
    doc.text('Total Credit (Jama):', summaryX, finalY);
    doc.text(`₹${creditTotals.netSale.toLocaleString('en-IN')}`, pageWidth - margin, finalY, { align: 'right' });
    
    finalY += 7;
    doc.text('Total Debit (Kharch):', summaryX, finalY);
    doc.text(`- ₹${totalDebit.toLocaleString('en-IN')}`, pageWidth - margin, finalY, { align: 'right' });

    finalY += 2;
    doc.setLineWidth(0.5);
    doc.line(summaryX, finalY, pageWidth - margin, finalY);
    
    finalY += 7;
    doc.setFontSize(14);
    if (finalBalance >= 0) {
        doc.setTextColor('#16A34A'); // Green
        doc.text('Jama (Profit/Credit):', summaryX, finalY);
        doc.text(`₹${finalBalance.toLocaleString('en-IN')}`, pageWidth - margin, finalY, { align: 'right' });
    } else {
        doc.setTextColor('#DC2626'); // Red
        doc.text('Baqaya (Balance/Due):', summaryX, finalY);
        doc.text(`₹${Math.abs(finalBalance).toLocaleString('en-IN')}`, pageWidth - margin, finalY, { align: 'right' });
    }
    
    // Signature
    doc.setTextColor('#000000');
    doc.setFont('DancingScript', 'normal');
    doc.setFontSize(22);
    doc.text('Faisal', pageWidth - margin - 35, doc.internal.pageSize.getHeight() - 25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Signature', pageWidth - margin - 30, doc.internal.pageSize.getHeight() - 18);


    doc.save(`Statement-${partyName}-${statementDate}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  }


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="printable-area lg:col-span-2">
            <Card>
                <CardHeader className="text-center">
                    <div className="text-muted-foreground flex justify-between items-center text-xs">
                        <span className="font-bold text-lg text-red-600">🍎</span>
                        <span>Mob: 9797002164, 7006136330, 9906740921</span>
                        <span className="font-bold text-lg text-red-600">🍎</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 py-2">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-red-700">Firdous Ahmad & Company</h1>
                            <p className="text-sm text-muted-foreground">
                                FRUIT MERCHANTS & COMMISSION AGENTS <br/>
                                Shed No.13, Fud No-12 A Fruit Mandi Apple Town Sopore -193201 (KMR) <br/>
                                Prop: Firdous Ahmad Lone (Nadihal Rafiabad)
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Header Details */}
                    <div className="grid grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="sNo">S.No:</Label>
                            <Input id="sNo" value={sNo} onChange={(e) => setSNo(e.target.value)} disabled={isEditing} />
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

                    <div className="space-y-4 border-t-2 border-b-2 border-black py-4">
                        {/* CREDIT Column */}
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-center">CREDIT (Jama)</h3>
                            <div className="grid grid-cols-8 gap-1 text-[10px] font-bold text-muted-foreground text-center">
                                <span className="col-span-1">Date</span>
                                <span className="col-span-1">Watak</span>
                                <span className="col-span-1">Peti</span>
                                <span className="col-span-1">Daba</span>
                                <span className="col-span-1">Gross</span>
                                <span className="col-span-1">Exp</span>
                                <span className="col-span-1">Net</span>
                            </div>
                            {creditRows.map((row) => (
                                <div key={row.id} className="grid grid-cols-8 gap-1 items-center">
                                    <Input className="h-8 text-xs" type="date" value={row.date} onChange={e => handleCreditChange(row.id, 'date', e.target.value)} />
                                    <Input className="h-8 text-xs" value={row.watakNo} onChange={e => handleCreditChange(row.id, 'watakNo', e.target.value)} />
                                    <Input className="h-8 text-xs" type="number" value={row.peti || ''} onChange={e => handleCreditChange(row.id, 'peti', Number(e.target.value))} />
                                    <Input className="h-8 text-xs" type="number" value={row.daba || ''} onChange={e => handleCreditChange(row.id, 'daba', Number(e.target.value))} />
                                    <Input className="h-8 text-xs" type="number" value={row.grossSale || ''} onChange={e => handleCreditChange(row.id, 'grossSale', Number(e.target.value))} />
                                    <Input className="h-8 text-xs" type="number" value={row.expenses || ''} onChange={e => handleCreditChange(row.id, 'expenses', Number(e.target.value))} />
                                    <Input className="h-8 text-xs" type="number" value={row.netSale || ''} onChange={e => handleCreditChange(row.id, 'netSale', Number(e.target.value))} />
                                    <Button variant="ghost" size="icon" onClick={() => removeCreditRow(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ))}
                            <div className="flex justify-start mt-2">
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
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-center">DEBIT (Kharch)</h3>
                            <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-muted-foreground text-center">
                                <span className="col-span-1">Date</span>
                                <span className="col-span-2">Details of Remittance</span>
                                <span className="col-span-1">Amount</span>
                            </div>
                            {debitRows.map((row) => (
                                <div key={row.id} className="grid grid-cols-4 gap-1 items-center">
                                    <Input className="h-8 text-xs" type="date" value={row.date} onChange={e => handleDebitChange(row.id, 'date', e.target.value)} />
                                    <Input className="h-8 text-xs font-urdu col-span-2" placeholder="" value={row.details} onChange={e => handleDebitChange(row.id, 'details', e.target.value)} />
                                    <Input className="h-8 text-xs" type="number" value={row.amount || ''} onChange={e => handleDebitChange(row.id, 'amount', Number(e.target.value))} />
                                    <Button variant="ghost" size="icon" onClick={() => removeDebitRow(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ))}
                            <div className="flex justify-start mt-2">
                            <Button size="sm" variant="outline" onClick={addDebitRow} className="gap-1"><PlusCircle className="h-4 w-4"/>Add Row</Button>
                            </div>
                            <Separator className="my-2 bg-black" />
                            <div className="grid grid-cols-3 gap-1 font-bold text-sm">
                                <span className="col-span-2 text-right pr-1">Total Debit (Kharch):</span>
                                <span className="col-span-1 text-right pr-1">₹{totalDebit.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Final Calculation */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="space-y-2 text-right pr-4 border-r-2 border-black">
                            <div className="flex justify-end items-center font-bold">
                                <span className="text-lg">Total Credit (Jama):</span>
                                <span className="ml-4 text-lg">₹{creditTotals.netSale.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <div className="space-y-2 text-right pr-4">
                            <div className="flex justify-end items-center font-bold">
                                <span className="text-lg">Total Debit (Kharch):</span>
                                <span className="ml-4 text-lg">₹{totalDebit.toLocaleString('en-IN')}</span>
                            </div>
                            <Separator className="bg-black" />
                            <div className="flex justify-end items-center font-bold">
                                {finalBalance >= 0 ? (
                                    <>
                                    <span className="text-lg text-green-600">Jama (Profit/Credit):</span>
                                    <span className="ml-4 text-lg text-green-600">₹{finalBalance.toLocaleString('en-IN')}</span>
                                    </>
                                ) : (
                                    <>
                                    <span className="text-lg text-red-600">Baqaya (Balance/Due):</span>
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
                    <div className='flex gap-2 flex-wrap'>
                        <Button className="gap-2" onClick={handleSave}>
                            <Save className="h-4 w-4" /> {isEditing ? 'Update' : 'Save'}
                        </Button>
                        <Button variant="secondary" className="gap-2" onClick={resetForm}>
                            <FilePlus className="h-4 w-4" /> New
                        </Button>
                        <Button variant="secondary" className="gap-2" onClick={handlePrint}>
                            <Printer className="h-4 w-4" /> View/Print
                        </Button>
                        <Button variant="secondary" className="gap-2" onClick={handleSaveAsPdf}>
                            <FileDown className="h-4 w-4" /> Save as PDF
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
        <Card className="lg:col-span-1 h-fit print-hidden">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">Saved Statements</h3>
                    {savedStatements.length > 0 && <Badge variant="secondary">{savedStatements.length} Saved</Badge>}
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[calc(100vh-12rem)]">
                    <div className="space-y-2">
                        {savedStatements.map(stmt => (
                            <div key={stmt.sNo} className="flex justify-between items-center p-2 border rounded-md">
                                <div>
                                    <p className="font-medium">Statement #{stmt.sNo}</p>
                                    <p className="text-sm text-muted-foreground">{stmt.partyName}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(stmt.statementDate).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center">
                                    <Button variant="ghost" size="icon" onClick={() => handleLoadStatement(stmt)}>
                                        <FilePenLine className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteStatement(stmt.sNo)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {savedStatements.length === 0 && <p className="text-sm text-muted-foreground text-center">No saved statements found.</p>}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
}
