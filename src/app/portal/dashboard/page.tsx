
'use client'

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Loader2, FileDown, Printer, User, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import '@/app/(app)/khata/print.css'; // Reuse styles
import { addLog } from '@/lib/logger';

type TransactionType = 'Sale' | 'Purchase' | 'Advance' | 'Repayment';

type Transaction = {
    id: string;
    date: string;
    type: TransactionType;
    amount: number;
    grossAmount: number; 
    expenses: number; 
    docId: string;
    notes?: string;
};

type LedgerEntryWithRunningBalance = Transaction & { runningBalance: number };

export default function CustomerDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [transactions, setTransactions] = React.useState<Transaction[]>([]);
    const [balance, setBalance] = React.useState(0);
    const [customerName, setCustomerName] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        setIsLoading(true);
        const name = localStorage.getItem('customerName');
        if (!name) {
            router.push('/portal/login');
            return;
        }
        setCustomerName(name);
        addLog('View Ledger', `Customer "${name}" viewed their ledger dashboard.`);

        const allTransactions: Transaction[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            try {
                 if (key.startsWith('invoice-')) {
                    const sale = JSON.parse(localStorage.getItem(key)!);
                    if (sale.customerName.toLowerCase() === name.toLowerCase()) {
                        allTransactions.push({
                            id: `sale-${sale.sNo}`,
                            date: sale.date,
                            type: 'Sale',
                            amount: sale.totals.netSale,
                            grossAmount: sale.totals.grossSale,
                            expenses: sale.totals.totalExpenses,
                            docId: sale.sNo,
                        });
                    }
                } else if (key.startsWith('purchase-')) {
                     const purchase = JSON.parse(localStorage.getItem(key)!);
                     if (purchase.growerName.toLowerCase() === name.toLowerCase()) {
                         allTransactions.push({
                            id: `purchase-${purchase.billNo}`,
                            date: purchase.date,
                            type: 'Purchase',
                            amount: purchase.totals.grandTotal,
                            grossAmount: purchase.totals.grandTotal,
                            expenses: 0,
                            docId: purchase.billNo,
                        });
                     }
                } else if (key.startsWith('advance-')) {
                    const advance = JSON.parse(localStorage.getItem(key)!);
                    if (advance.partyName.toLowerCase() === name.toLowerCase()) {
                        allTransactions.push({
                            id: advance.id,
                            date: advance.date,
                            type: advance.type === 'Advance Given' ? 'Advance' : 'Repayment',
                            amount: advance.amount,
                            grossAmount: advance.amount,
                            expenses: 0,
                            docId: advance.id,
                            notes: advance.notes,
                        });
                    }
                }
            } catch (error) {
                console.error(`Failed to parse item from local storage: ${key}`, error);
            }
        }

        allTransactions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setTransactions(allTransactions);

        let runningBalance = 0;
        allTransactions.forEach(trans => {
            if (trans.type === 'Sale' || trans.type === 'Purchase' || trans.type === 'Repayment') {
                runningBalance += trans.amount;
            } else { // Advance
                runningBalance -= trans.amount;
            }
        });
        setBalance(runningBalance);

        setIsLoading(false);
    }, [router]);

    const getLedgerWithRunningBalance = (): LedgerEntryWithRunningBalance[] => {
        let runningBalance = 0;
        return transactions.map(tx => {
            if(tx.type === 'Sale' || tx.type === 'Purchase' || tx.type === 'Repayment') {
                runningBalance += tx.amount;
            } else { // Advance
                runningBalance -= tx.amount;
            }
            return {...tx, runningBalance};
        });
    };

    const ledgerForExport = getLedgerWithRunningBalance();
    
    const exportToPDF = () => {
        if (!customerName) return;
        
        addLog('Download Report', `Customer "${customerName}" downloaded their ledger as a PDF.`);

        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(`Ledger Statement for ${customerName}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 14, 28);
        
        doc.setFontSize(10);
        doc.text("F.Co - FIRDOUS AHMAD & COMPANY", doc.internal.pageSize.width - 14, 22, { align: 'right'});

        autoTable(doc, {
            startY: 35,
            head: [['Date', 'Doc ID', 'Type', 'Debit', 'Credit', 'Balance']],
            body: ledgerForExport.map(tx => [
                new Date(tx.date).toLocaleDateString('en-GB'),
                (tx.type === 'Sale' || tx.type === 'Purchase') ? `#${tx.docId}` : tx.notes || tx.type,
                tx.type,
                 (tx.type === 'Advance') ? `₹${tx.amount.toFixed(2)}` : '-',
                (tx.type === 'Sale' || tx.type === 'Purchase' || tx.type === 'Repayment') ? `₹${tx.amount.toFixed(2)}` : '-',
                `₹${tx.runningBalance.toFixed(2)}`
            ]),
            foot: [
                [{ content: 'Final Balance', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, 
                 { content: `₹${balance.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } }]
            ],
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] }
        });
        
        doc.save(`Ledger-${customerName}.pdf`);
    };

    const exportToExcel = () => {
        if (!customerName) return;

        addLog('Download Report', `Customer "${customerName}" downloaded their ledger as an Excel file.`);

        const worksheetData = ledgerForExport.map(tx => ({
            Date: new Date(tx.date).toLocaleDateString('en-GB'),
            'Document/Details': (tx.type === 'Sale' || tx.type === 'Purchase') ? `#${tx.docId}` : tx.notes || tx.type,
            Type: tx.type,
            Debit: (tx.type === 'Advance') ? tx.amount : '',
            Credit: (tx.type === 'Sale' || tx.type === 'Purchase' || tx.type === 'Repayment') ? tx.amount : '',
            'Running Balance': tx.runningBalance,
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger');
        
        XLSX.utils.sheet_add_aoa(worksheet, [
            ["", "", "", "", "Final Balance", balance]
        ], { origin: -1 });

        XLSX.writeFile(workbook, `Ledger-${customerName}.xlsx`);
    };

    const getBadgeVariant = (type: TransactionType) => {
        switch (type) {
            case 'Sale': return 'default';
            case 'Purchase': return 'secondary';
            case 'Advance': return 'destructive';
            case 'Repayment': return 'outline';
            default: return 'default';
        }
    }


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64 print-hidden">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="ml-4">Fetching your ledger...</p>
            </div>
        )
    }

    return (
        <Card className="printable-area">
            <CardHeader className="print-hidden">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2"><User className="h-6 w-6" /> Welcome, {customerName}</CardTitle>
                        <CardDescription>This is your complete transaction history with Firdous Ahmad & Company.</CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                        <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-1">
                            <Printer className="h-3.5 w-3.5" /> Print
                        </Button>
                        <Button onClick={exportToPDF} variant="outline" size="sm" className="gap-1">
                            <FileDown className="h-3.5 w-3.5" /> PDF
                        </Button>
                        <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-1">
                            <FileDown className="h-3.5 w-3.5" /> Excel
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="print-header hidden print:block text-center mb-4">
                    <h1 className="text-xl font-bold">Ledger Statement</h1>
                    <h2 className="text-lg font-semibold">{customerName}</h2>
                    <p className="text-sm">Firdous Ahmad & Company, Sopore</p>
                    <p className="text-xs">Date: {new Date().toLocaleDateString('en-GB')}</p>
                </div>
                
                 {transactions.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Particulars</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Debit</TableHead>
                                <TableHead className="text-right">Credit</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {getLedgerWithRunningBalance().map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell>{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                                <TableCell>{(tx.type === 'Sale' || tx.type === 'Purchase') ? `Bill #${tx.docId}` : tx.notes || tx.type}</TableCell>
                                <TableCell>
                                   <Badge variant={getBadgeVariant(tx.type)}>{tx.type}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono text-red-500">
                                    {(tx.type === 'Advance') ? `₹${tx.amount.toFixed(2)}` : '-'}
                                </TableCell>
                                <TableCell className="text-right font-mono text-green-600">
                                    {(tx.type === 'Sale' || tx.type === 'Purchase' || tx.type === 'Repayment') ? `₹${tx.amount.toFixed(2)}` : '-'}
                                </TableCell>
                                <TableCell className="text-right font-mono">₹{tx.runningBalance.toFixed(2)}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                             <TableRow className="font-bold text-lg bg-muted">
                                <TableCell colSpan={5} className="text-right">Final Balance</TableCell>
                                <TableCell className={`text-right ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    ₹{Math.abs(balance).toFixed(2)}
                                    <span className="text-xs text-muted-foreground ml-1">
                                        {balance >= 0 ? '(Payable)' : '(Receivable)'}
                                    </span>
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                ) : (
                    <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                        <h3 className="text-lg font-semibold">No Transactions Found</h3>
                        <p className="text-sm">We could not find any sales or purchase records under your name.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
