
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
import { Loader2, FileDown, User, Users, Plus, ChevronDown, Leaf, Printer, UserCheck, UserX, ShoppingCart } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import './print.css';

type TransactionType = 'Sale' | 'Purchase';

type Transaction = {
    id: string;
    date: string;
    type: TransactionType;
    amount: number; // For purchase this is grandTotal, for sale this is netSale
    grossAmount: number; // For sale this is grossSale
    expenses: number; // For sale this is totalExpenses
    party: string;
    docId: string;
};

type PartyType = 'customer' | 'supplier' | 'both';

type Ledger = {
    [partyName: string]: {
        transactions: Transaction[];
        balance: number; // positive means we are owed (receivable), negative means we owe (payable)
        partyType: PartyType;
    }
}

type LedgerEntryWithRunningBalance = Transaction & { runningBalance: number };

export default function KhataLedgerPage() {
    const router = useRouter();
    const [ledgers, setLedgers] = React.useState<Ledger>({});
    const [allParties, setAllParties] = React.useState<string[]>([]);
    const [filteredParties, setFilteredParties] = React.useState<string[]>([]);
    const [selectedParty, setSelectedParty] = React.useState<string | null>(null);
    const [activeTab, setActiveTab] = React.useState('growers');
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        setIsLoading(true);
        const allTransactions: Transaction[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            try {
                if (key.startsWith('invoice-')) {
                    const sale = JSON.parse(localStorage.getItem(key)!);
                    allTransactions.push({
                        id: `sale-${sale.sNo}`,
                        date: sale.date,
                        type: 'Sale',
                        amount: sale.totals.netSale,
                        grossAmount: sale.totals.grossSale,
                        expenses: sale.totals.totalExpenses,
                        party: sale.customerName,
                        docId: sale.sNo,
                    });
                } else if (key.startsWith('purchase-')) {
                     const purchase = JSON.parse(localStorage.getItem(key)!);
                     allTransactions.push({
                        id: `purchase-${purchase.billNo}`,
                        date: purchase.date,
                        type: 'Purchase',
                        amount: purchase.totals.grandTotal,
                        grossAmount: purchase.totals.grandTotal, // In purchases, gross is the grand total
                        expenses: 0, // No separate expenses recorded this way for purchases
                        party: purchase.growerName,
                        docId: purchase.billNo,
                    });
                }
            } catch (error) {
                console.error(`Failed to parse item from local storage: ${key}`, error);
            }
        }

        allTransactions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const calculatedLedgers: Ledger = {};

        for (const trans of allTransactions) {
            if (!calculatedLedgers[trans.party]) {
                calculatedLedgers[trans.party] = { transactions: [], balance: 0, partyType: trans.type === 'Sale' ? 'customer' : 'supplier' };
            }
            
            const ledger = calculatedLedgers[trans.party];
            ledger.transactions.push(trans);
            
            const newType = trans.type === 'Sale' ? 'customer' : 'supplier';
            if(ledger.partyType !== 'both' && ledger.partyType !== newType) {
                ledger.partyType = 'both';
            }
        }
        
        Object.keys(calculatedLedgers).forEach(party => {
            let runningBalance = 0;
            calculatedLedgers[party].transactions.forEach(trans => {
                 if (trans.type === 'Sale') {
                    runningBalance += trans.amount;
                } else {
                    runningBalance -= trans.amount;
                }
            });
            calculatedLedgers[party].balance = runningBalance;
        });

        const sortedParties = Object.keys(calculatedLedgers).sort((a, b) => a.localeCompare(b));
        
        setLedgers(calculatedLedgers);
        setAllParties(sortedParties);
        setIsLoading(false);
    }, []);

    React.useEffect(() => {
        const filterAndSetParties = (type: PartyType | 'all') => {
            const parties = allParties.filter(p => {
                if (type === 'all') return true;
                const ledger = ledgers[p];
                if (type === 'customer') return ledger.partyType === 'customer' || ledger.partyType === 'both';
                if (type === 'supplier') return ledger.partyType === 'supplier' || ledger.partyType === 'both';
                return false;
            });
            setFilteredParties(parties);
            if(parties.length > 0) {
                setSelectedParty(parties[0]);
            } else {
                setSelectedParty(null);
            }
        };
        
        if (activeTab === 'growers') filterAndSetParties('supplier');
        else if (activeTab === 'customers') filterAndSetParties('customer');
        else if (activeTab === 'all') {
            filterAndSetParties('all');
        }
    }, [activeTab, allParties, ledgers]);

    const selectedLedger = selectedParty ? ledgers[selectedParty] : null;

    const navigateToDoc = (type: TransactionType, docId: string) => {
        const path = type === 'Sale' ? `/invoice/${docId}` : `/purchase-bill/${docId}`;
        router.push(path);
    };

    const getLedgerWithRunningBalance = (): LedgerEntryWithRunningBalance[] => {
        if (!selectedLedger) return [];
        let runningBalance = 0;
        return selectedLedger.transactions.map(tx => {
            if(tx.type === 'Sale') {
                runningBalance += tx.amount;
            } else {
                runningBalance -= tx.amount;
            }
            return {...tx, runningBalance};
        });
    };

    const ledgerForExport = getLedgerWithRunningBalance();
    
    const exportToPDF = () => {
        if (!selectedParty || !selectedLedger) return;
        
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(18);
        doc.text(`Fruit Ledger Statement for ${selectedParty}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 14, 28);
        
        // F.Co Header
        doc.setFontSize(10);
        doc.text("F.Co - FIRDOUS AHMAD & COMPANY", doc.internal.pageSize.width - 14, 22, { align: 'right'});

        autoTable(doc, {
            startY: 35,
            head: [['Date', 'Doc ID', 'Type', 'Gross', 'Expenses', 'Net', 'Balance']],
            body: ledgerForExport.map(tx => [
                new Date(tx.date).toLocaleDateString('en-GB'),
                `#${tx.docId}`,
                tx.type,
                `₹${tx.grossAmount.toFixed(2)}`,
                tx.type === 'Sale' ? `₹${tx.expenses.toFixed(2)}` : '-',
                tx.type === 'Sale' ? `₹${tx.amount.toFixed(2)}` : `(₹${tx.amount.toFixed(2)})`,
                `₹${tx.runningBalance.toFixed(2)}`
            ]),
            foot: [
                [{ content: 'Final Balance', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } }, 
                 { content: `₹${selectedLedger.balance.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } }]
            ],
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] }
        });

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text('Your Satisfaction is Our Success – Subject to Sopore Jurisdiction Only', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center'});
        }
        
        doc.save(`Fruit-Ledger-${selectedParty}.pdf`);
    };

    const exportToExcel = () => {
        if (!selectedParty || !selectedLedger) return;

        const worksheetData = ledgerForExport.map(tx => ({
            Date: new Date(tx.date).toLocaleDateString('en-GB'),
            'Document ID': `#${tx.docId}`,
            Type: tx.type,
            'Gross Amount': tx.grossAmount,
            'Expenses': tx.type === 'Sale' ? tx.expenses : 0,
            'Net Amount': tx.type === 'Sale' ? tx.amount : -tx.amount,
            'Running Balance': tx.runningBalance,
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger');
        
        XLSX.utils.sheet_add_aoa(worksheet, [
            ["", "", "", "", "", "Final Balance", selectedLedger.balance]
        ], { origin: -1 });

        XLSX.writeFile(workbook, `Fruit-Ledger-${selectedParty}.xlsx`);
    };
    
    const handlePrint = () => {
        window.print();
    }

    const PartyIcon = ({ type }: { type: PartyType }) => {
        if (type === 'supplier') return <Leaf className="h-4 w-4 mr-2 text-green-500" />;
        if (type === 'customer') return <ShoppingCart className="h-4 w-4 mr-2 text-blue-500" />;
        return <Users className="h-4 w-4 mr-2 text-purple-500" />;
    };
    
    const totals = React.useMemo(() => {
        if (!selectedLedger) return { debit: 0, credit: 0 };
        return selectedLedger.transactions.reduce((acc, tx) => {
            if (tx.type === 'Sale') {
                acc.debit += tx.amount;
            } else {
                acc.credit += tx.amount;
            }
            return acc;
        }, { debit: 0, credit: 0 });
    }, [selectedLedger]);

    const AddNewFab = () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg print-hidden" size="icon">
                    <Plus className="h-8 w-8" />
                 </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="mb-2">
                <DropdownMenuItem onSelect={() => router.push('/sales')}>
                    New Sale
                </DropdownMenuItem>
                 <DropdownMenuItem onSelect={() => router.push('/purchases')}>
                    New Purchase
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
    <>
        <Card className="printable-area">
            <CardHeader className="print-hidden">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Fruit Ledger (Khata)</CardTitle>
                        <CardDescription>Separate ledgers for what you owe to Growers (Payable) and what Customers owe you (Receivable).</CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                         {selectedParty && (
                            <>
                                <Button onClick={handlePrint} variant="outline" size="sm" className="gap-1">
                                    <Printer className="h-3.5 w-3.5" /> Print
                                </Button>
                                <Button onClick={exportToPDF} variant="outline" size="sm" className="gap-1">
                                    <FileDown className="h-3.5 w-3.5" /> PDF
                                </Button>
                                <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-1">
                                    <FileDown className="h-3.5 w-3.5" /> Excel
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="print-header hidden print:block text-center mb-4">
                    <h1 className="text-xl font-bold">Fruit Ledger Statement</h1>
                    <h2 className="text-lg font-semibold">{selectedParty}</h2>
                    <p className="text-sm">Firdous Ahmad & Company, Sopore</p>
                    <p className="text-xs">Date: {new Date().toLocaleDateString('en-GB')}</p>
                </div>

                <div className="flex justify-between items-center mb-4 print-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="growers"><Leaf className="h-4 w-4 mr-2"/>Grower Ledger (Payable)</TabsTrigger>
                            <TabsTrigger value="customers"><ShoppingCart className="h-4 w-4 mr-2"/>Customer Ledger (Receivable)</TabsTrigger>
                            <TabsTrigger value="all"><Users className="h-4 w-4 mr-2"/>All Parties</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2 min-w-[250px]">
                                {selectedParty && ledgers[selectedParty] && <PartyIcon type={ledgers[selectedParty].partyType} />}
                                <span className="flex-1 text-left">{selectedParty || 'Select a Party'}</span>
                                <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="max-h-96 overflow-y-auto">
                                {filteredParties.map(party => (
                                    <DropdownMenuItem key={party} onSelect={() => setSelectedParty(party)}>
                                        <PartyIcon type={ledgers[party].partyType} />
                                        {party}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64 print-hidden">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : selectedLedger ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Doc ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Gross</TableHead>
                                <TableHead className="text-right">Expenses</TableHead>
                                <TableHead className="text-right">Net</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {getLedgerWithRunningBalance().map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell>{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                                <TableCell>
                                    <Button variant="link" className="p-0 h-auto print-hidden" onClick={() => navigateToDoc(tx.type, tx.docId)}>
                                        #{tx.docId}
                                    </Button>
                                    <span className="hidden print:inline">#{tx.docId}</span>
                                </TableCell>
                                <TableCell>
                                   <Badge variant={tx.type === 'Sale' ? 'default' : 'secondary'}>{tx.type}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono">₹{tx.grossAmount.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono text-red-500">{tx.type === 'Sale' ? `₹${tx.expenses.toFixed(2)}` : '-'}</TableCell>
                                <TableCell className={`text-right font-mono ${tx.type === 'Sale' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'Sale' ? `₹${tx.amount.toFixed(2)}` : `(₹${tx.amount.toFixed(2)})`}
                                </TableCell>
                                <TableCell className="text-right font-mono">₹{tx.runningBalance.toFixed(2)}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold">
                                <TableCell colSpan={3} className="text-right">Totals</TableCell>
                                <TableCell className="text-right text-green-600">₹{totals.debit.toFixed(2)}</TableCell>
                                <TableCell colSpan={1}></TableCell>
                                <TableCell className="text-right text-red-600">(₹{totals.credit.toFixed(2)})</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                             <TableRow className="font-bold text-lg bg-muted">
                                <TableCell colSpan={6} className="text-right">Final Balance</TableCell>
                                <TableCell className={`text-right ${selectedLedger.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    ₹{Math.abs(selectedLedger.balance).toFixed(2)}
                                    <span className="text-xs text-muted-foreground ml-1">
                                        {selectedLedger.balance >= 0 ? '(Receivable)' : '(Payable)'}
                                    </span>
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                ) : (
                    <div className="text-center text-muted-foreground py-12 print-hidden">
                        <p>No transactions found for the selected category.</p>
                        <p className="text-sm">Start by creating sales or purchases, or select a different category.</p>
                    </div>
                )}
            </CardContent>
        </Card>
        <AddNewFab />
    </>
  );
}

    