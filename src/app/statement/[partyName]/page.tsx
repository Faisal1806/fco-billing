
'use client'

import * as React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowDown, ArrowUp, Minus, Equals, Printer, Download, FileText, Receipt } from 'lucide-react';
import Lottie from 'lottie-react';
import { FaWhatsapp } from 'react-icons/fa';
import QRCode from 'qrcode.react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useRouter } from 'next/navigation';


type TransactionType = 'Sale' | 'Purchase' | 'Advance' | 'Repayment' | 'Bikri' | 'Discount';

type Transaction = {
    id: string;
    date: string;
    type: TransactionType;
    docId: string;
    notes?: string;

    // Credit side fields
    peti?: number;
    dabba?: number;
    grossSale?: number;
    expenses?: number;
    netSale?: number;
    
    // Debit side fields
    remittanceDetails?: string;
    debitAmount?: number;
};

const getCanonicalName = (name: string): string => {
    if (!name) return '';
    return name.trim();
};

export default function StatementPage({ params }: { params: { partyName: string } }) {
    const partyName = decodeURIComponent(params.partyName);
    const [transactions, setTransactions] = React.useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [loaderAnimation, setLoaderAnimation] = React.useState(null);
    const [pageUrl, setPageUrl] = React.useState('');

    React.useEffect(() => {
        if(typeof window !== 'undefined'){
            setPageUrl(window.location.href);
        }
        function fetchLedgerData() {
            if (typeof window === 'undefined' || !partyName) return;
            setIsLoading(true);
            
            fetch('/animations/forms/fco_loader.json').then(res => res.json()).then(setLoaderAnimation);

            const allTransactions: any[] = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;

                try {
                    let doc;
                    let docPartyName;
                    if (key.startsWith('invoice-')) {
                        doc = JSON.parse(localStorage.getItem(key)!);
                        docPartyName = doc.customerName;
                        if(getCanonicalName(docPartyName) === getCanonicalName(partyName)) allTransactions.push({ ...doc, _type: 'Sale' });
                    } else if (key.startsWith('purchase-')) {
                        doc = JSON.parse(localStorage.getItem(key)!);
                        docPartyName = doc.growerName;
                         if(getCanonicalName(docPartyName) === getCanonicalName(partyName)) allTransactions.push({ ...doc, _type: 'Purchase' });
                    } else if (key.startsWith('advance-')) {
                        doc = JSON.parse(localStorage.getItem(key)!);
                        docPartyName = doc.partyName;
                        const type = doc.type === 'Advance Given' ? 'Advance' : (doc.type === 'Discount' ? 'Discount' : 'Repayment');
                         if(getCanonicalName(docPartyName) === getCanonicalName(partyName)) allTransactions.push({ ...doc, _type: type });
                    } else if (key.startsWith('bikri-')) {
                        doc = JSON.parse(localStorage.getItem(key)!);
                        docPartyName = doc.bikriType === 'growerForwarding' ? doc.growerName : doc.market;
                         if(getCanonicalName(docPartyName) === getCanonicalName(partyName)) allTransactions.push({ ...doc, _type: 'Bikri' });
                    }
                } catch (e) {
                    console.error("Failed to parse ledger data from local storage for key:", key, e);
                }
            }

            allTransactions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            const processedTransactions: Transaction[] = allTransactions.map(tx => {
                if (tx._type === 'Sale') {
                    return { id: `sale-${tx.sNo}`, date: tx.date, type: 'Sale', docId: tx.id, peti: tx.totals.pattiQty, dabba: tx.totals.dabbaQty, grossSale: tx.totals.grossSale, expenses: tx.totals.totalExpenses, netSale: tx.totals.netSale, notes: `Watak #${tx.watakNo}` };
                } else if (tx._type === 'Bikri') {
                    return { id: `bikri-${tx.id}`, date: tx.date, type: 'Bikri', docId: tx.id, grossSale: tx.calculation.grossSale, expenses: tx.calculation.totalExpenses, netSale: tx.calculation.netSalePayableToGrower, notes: `Bikri #${tx.bikriNo}` };
                } else if (tx._type === 'Purchase') {
                    return { id: `purchase-${tx.billNo}`, date: tx.date, type: 'Purchase', docId: tx.id, remittanceDetails: `Goods purchased`, debitAmount: tx.totals.grandTotal, notes: `Purchase Bill #${tx.billNo}` };
                } else if (tx._type === 'Advance') {
                    return { id: tx.id, date: tx.date, type: 'Advance', docId: tx.id.replace('advance-', ''), remittanceDetails: tx.notes || 'Advance paid', debitAmount: tx.amount };
                } else if (tx._type === 'Repayment') {
                     return { id: tx.id, date: tx.date, type: 'Repayment', docId: tx.id.replace('advance-', ''), remittanceDetails: tx.notes || 'Payment Received', debitAmount: -tx.amount }; // Negative for credit
                } else if (tx._type === 'Discount') {
                     return { id: tx.id, date: tx.date, type: 'Discount', docId: tx.id.replace('advance-',''), remittanceDetails: tx.notes || 'Discount given', debitAmount: tx.amount };
                }
                return null;
            }).filter((tx): tx is Transaction => tx !== null);
            
            setTransactions(processedTransactions);
            setIsLoading(false);
        }
        fetchLedgerData();
    }, [partyName]);

    const statementData = React.useMemo(() => {
        const creditRows: Transaction[] = [];
        const debitRows: Transaction[] = [];

        transactions.forEach(tx => {
            if (tx.netSale !== undefined || tx.type === 'Repayment') {
                 if (tx.type === 'Repayment') {
                    creditRows.push({ ...tx, netSale: tx.debitAmount! * -1 }); // Convert repayment to credit
                } else {
                    creditRows.push(tx);
                }
            } else if (tx.debitAmount !== undefined) {
                debitRows.push(tx);
            }
        });
        
        const maxRows = Math.max(creditRows.length, debitRows.length, 15);
        const paddedCreditRows = [...creditRows, ...Array(Math.max(0, maxRows - creditRows.length)).fill({})];
        const paddedDebitRows = [...debitRows, ...Array(Math.max(0, maxRows - debitRows.length)).fill({})];


        const creditTotals = creditRows.reduce((acc, tx) => {
            acc.peti += tx.peti || 0;
            acc.dabba += tx.dabba || 0;
            acc.grossSale += tx.grossSale || 0;
            acc.expenses += tx.expenses || 0;
            acc.netSale += tx.netSale || 0;
            return acc;
        }, { peti: 0, dabba: 0, grossSale: 0, expenses: 0, netSale: 0 });

        const debitTotals = debitRows.reduce((acc, tx) => {
            acc.debitAmount += tx.debitAmount || 0;
            return acc;
        }, { debitAmount: 0 });

        const balance = creditTotals.netSale - debitTotals.debitAmount;

        return {
            creditRows: paddedCreditRows,
            debitRows: paddedDebitRows,
            creditTotals,
            debitTotals,
            balance
        };
    }, [transactions]);


    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = () => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const element = document.querySelector('.printable-area');
        if (element) {
             doc.html(element as HTMLElement, {
                callback: function (doc) {
                    doc.save(`Statement-${partyName}.pdf`);
                },
                x: 10,
                y: 10,
                width: 190,
                windowWidth: 650,
            });
        }
    };
    
    const handleShare = () => {
        const message = `Check out the Statement of Account for ${partyName}: ${pageUrl}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    if (isLoading || !loaderAnimation) {
        return (
            <div className="bg-gray-100 dark:bg-gray-900 flex justify-center items-center h-screen">
                {loaderAnimation && <Lottie animationData={loaderAnimation} loop={true} style={{ width: 150, height: 150 }} />}
            </div>
        )
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-900 font-sans print:bg-white flex flex-col md:flex-row gap-8 justify-center p-4 md:p-8">
            <style jsx global>{`
                @media print {
                  body {
                    background-color: white;
                  }
                  .print-hidden {
                    display: none !important;
                  }
                  .printable-area {
                    box-shadow: none;
                    border: none;
                    width: 100%;
                    max-width: 100%;
                  }
                   @page {
                        size: A4 portrait;
                        margin: 1cm;
                    }
                }
            `}</style>
            <div className="print-hidden w-full max-w-xs space-y-4">
                 <div className="flex flex-col gap-2">
                    <Button onClick={handlePrint} className="w-full gap-2"><Printer className="h-4 w-4" /> Print Statement</Button>
                    <Button onClick={handleDownloadPdf} variant="secondary" className="w-full gap-2"><Download className="h-4 w-4" /> Download PDF</Button>
                    <Button onClick={handleShare} variant="outline" className="w-full gap-2"><FaWhatsapp className="h-5 w-5 text-green-500" /> Share</Button>
                </div>
                 <Card>
                    <CardContent className="p-4 flex flex-col items-center gap-2">
                        <QRCode value={pageUrl} size={128} />
                        <p className="text-xs font-semibold text-muted-foreground mt-1">Scan to View Statement</p>
                    </CardContent>
                </Card>
            </div>
            <Card className="printable-area w-full max-w-4xl shadow-lg p-6">
                <header className="text-center mb-4 border-b-2 pb-2">
                    <h1 className="text-xl font-bold">STATEMENT OF ACCOUNT</h1>
                    <h2 className="text-lg">Firdous Ahmad & Company</h2>
                    <p className="text-xs">Shed No.13, Fud No-12 A Fruit Mandi Apple Town Sopore -193201 (KMR)</p>
                </header>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <p><strong>M/s:</strong> {partyName}</p>
                    <p className="text-right"><strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}</p>
                </div>

                <div className="grid grid-cols-2 gap-0 border">
                    {/* CREDIT SIDE */}
                    <div className="border-r">
                        <h3 className="font-bold text-center mb-2 p-1 bg-muted">CREDIT</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="h-8 p-1 text-[10px]">Date</TableHead>
                                    <TableHead className="h-8 p-1 text-[10px]">Doc</TableHead>
                                    <TableHead className="h-8 p-1 text-[10px]">Peti</TableHead>
                                    <TableHead className="h-8 p-1 text-[10px]">Daba</TableHead>
                                    <TableHead className="h-8 p-1 text-[10px] text-right">Gross</TableHead>
                                    <TableHead className="h-8 p-1 text-[10px] text-right">Exp</TableHead>
                                    <TableHead className="h-8 p-1 text-[10px] text-right">Net Sale</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statementData.creditRows.map((tx, i) => (
                                    <TableRow key={`credit-${i}`} className="h-6">
                                        <TableCell className="p-1 text-[10px]">{tx.date ? new Date(tx.date).toLocaleDateString('en-GB') : ''}</TableCell>
                                        <TableCell className="p-1 text-[10px]">{tx.notes || tx.remittanceDetails || ''}</TableCell>
                                        <TableCell className="p-1 text-[10px]">{tx.peti || ''}</TableCell>
                                        <TableCell className="p-1 text-[10px]">{tx.dabba || ''}</TableCell>
                                        <TableCell className="p-1 text-[10px] text-right font-mono">{tx.grossSale?.toFixed(0) || ''}</TableCell>
                                        <TableCell className="p-1 text-[10px] text-right font-mono">{tx.expenses?.toFixed(0) || ''}</TableCell>
                                        <TableCell className="p-1 text-[10px] text-right font-mono font-bold">{tx.netSale?.toFixed(2) || ''}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {/* DEBIT SIDE */}
                    <div>
                        <h3 className="font-bold text-center mb-2 p-1 bg-muted">DEBIT</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="h-8 p-1 text-[10px]">Date</TableHead>
                                    <TableHead className="h-8 p-1 text-[10px]">Details of Remittance</TableHead>
                                    <TableHead className="h-8 p-1 text-[10px] text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statementData.debitRows.map((tx, i) => (
                                     <TableRow key={`debit-${i}`} className="h-6">
                                        <TableCell className="p-1 text-[10px]">{tx.date ? new Date(tx.date).toLocaleDateString('en-GB') : ''}</TableCell>
                                        <TableCell className="p-1 text-[10px]">{tx.remittanceDetails || ''}</TableCell>
                                        <TableCell className="p-1 text-[10px] text-right font-mono">{tx.debitAmount?.toFixed(2) || ''}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                     {/* TOTALS */}
                    <div className="col-span-2 border-t mt-2"></div>
                    <div className="border-r">
                         <Table>
                            <TableBody>
                                <TableRow className="h-6 font-bold">
                                    <TableCell className="p-1 text-xs" colSpan={2}>Total Credit</TableCell>
                                    <TableCell className="p-1 text-xs">{statementData.creditTotals.peti}</TableCell>
                                    <TableCell className="p-1 text-xs">{statementData.creditTotals.dabba}</TableCell>
                                    <TableCell className="p-1 text-xs text-right font-mono">{statementData.creditTotals.grossSale.toFixed(0)}</TableCell>
                                    <TableCell className="p-1 text-xs text-right font-mono">{statementData.creditTotals.expenses.toFixed(0)}</TableCell>
                                    <TableCell className="p-1 text-xs text-right font-mono">{statementData.creditTotals.netSale.toFixed(2)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                     <div>
                         <Table>
                            <TableBody>
                                <TableRow className="h-6 font-bold">
                                     <TableCell className="p-1 text-xs" colSpan={2}>Total Debit</TableCell>
                                     <TableCell className="p-1 text-xs text-right font-mono">{statementData.debitTotals.debitAmount.toFixed(2)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    <div className="col-span-2 mt-2">
                        <CardFooter className="p-4 bg-muted rounded-lg">
                            <div className="w-full flex justify-around items-center text-lg font-bold">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Total Credit</p>
                                    <p className="flex items-center gap-1"><ArrowDown className="h-5 w-5 text-green-500" /> ₹{statementData.creditTotals.netSale.toFixed(2)}</p>
                                </div>
                                <Minus className="h-6 w-6 text-muted-foreground" />
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Total Debit</p>
                                    <p className="flex items-center gap-1"><ArrowUp className="h-5 w-5 text-red-500" /> ₹{statementData.debitTotals.debitAmount.toFixed(2)}</p>
                                </div>
                                <Equals className="h-6 w-6 text-muted-foreground" />
                                 <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Final Balance</p>
                                    {statementData.balance === 0 ? (
                                        <p className="text-yellow-500">
                                            ₹0.00 <span className="text-xs ml-1">(Settled)</span>
                                        </p>
                                    ) : (
                                        <p className={`${statementData.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            ₹{Math.abs(statementData.balance).toFixed(2)}
                                            <span className="text-xs ml-1">({statementData.balance > 0 ? 'Payable' : 'Receivable'})</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardFooter>
                    </div>

                </div>
            </Card>
        </div>
    );
}
