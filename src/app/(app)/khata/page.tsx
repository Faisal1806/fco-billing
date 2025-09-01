
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
import { ChevronDown, Loader2, FileDown, Factory, User, Users } from 'lucide-react';
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


type Transaction = {
    id: string;
    date: string;
    type: 'Sale' | 'Purchase';
    amount: number;
    party: string;
    docId: string;
};

type PartyType = 'customer' | 'supplier' | 'both';

type Ledger = {
    [partyName: string]: {
        transactions: Transaction[];
        balance: number; // positive means we are owed, negative means we owe
        partyType: PartyType;
    }
}

export default function KhataLedgerPage() {
    const router = useRouter();
    const [ledgers, setLedgers] = React.useState<Ledger>({});
    const [parties, setParties] = React.useState<string[]>([]);
    const [selectedParty, setSelectedParty] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        setIsLoading(true);
        const allTransactions: Transaction[] = [];

        // Fetch sales (wataks) and purchases
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
            } else {
                const existingType = calculatedLedgers[trans.party].partyType;
                const newType = trans.type === 'Sale' ? 'customer' : 'supplier';
                if(existingType !== newType && existingType !== 'both') {
                    calculatedLedgers[trans.party].partyType = 'both';
                }
            }
            const ledger = calculatedLedgers[trans.party];
            ledger.transactions.push(trans);
        }
        
        // Recalculate balances after all transactions are sorted and grouped
        Object.keys(calculatedLedgers).forEach(party => {
            let runningBalance = 0;
            const partyLedger = calculatedLedgers[party];
            partyLedger.transactions.forEach(trans => {
                 if (trans.type === 'Sale') {
                    runningBalance += trans.amount;
                } else {
                    runningBalance -= trans.amount;
                }
            });
            partyLedger.balance = runningBalance;
        });

        const sortedParties = Object.keys(calculatedLedgers).sort((a, b) => a.localeCompare(b));

        setLedgers(calculatedLedgers);
        setParties(sortedParties);
        if (sortedParties.length > 0) {
            setSelectedParty(sortedParties[0]);
        }
        setIsLoading(false);
    }, []);

    const selectedLedger = selectedParty ? ledgers[selectedParty] : null;

    const navigateToDoc = (type: 'Sale' | 'Purchase', docId: string) => {
        if (type === 'Sale') {
            router.push(`/invoice/${docId}`);
        } else {
            router.push(`/purchase-bill/${docId}`);
        }
    }

    const getLedgerWithRunningBalance = () => {
        if (!selectedLedger) return [];
        let runningBalance = 0;
        return selectedLedger.transactions.map(tx => {
            if(tx.type === 'Sale') {
                runningBalance += tx.amount;
            } else {
                runningBalance -= tx.amount;
            }
            return {...tx, runningBalance};
        })
    }
    
    const exportToPDF = () => {
        if (!selectedParty || !selectedLedger) return;
        
        const doc = new jsPDF();
        const ledgerData = getLedgerWithRunningBalance();

        doc.setFontSize(18);
        doc.text(`Ledger Statement for ${selectedParty}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 14, 28);
        
        autoTable(doc, {
            startY: 35,
            head: [['Date', 'Document', 'Type', 'Debit', 'Credit', 'Balance']],
            body: ledgerData.map(tx => [
                new Date(tx.date).toLocaleDateString('en-GB'),
                `#${tx.docId}`,
                tx.type,
                tx.type === 'Sale' ? `₹${tx.amount.toFixed(2)}` : '',
                tx.type === 'Purchase' ? `₹${tx.amount.toFixed(2)}` : '',
                `₹${tx.runningBalance.toFixed(2)}`
            ]),
            foot: [
                [{ content: 'Final Balance', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, 
                 { content: `₹${selectedLedger.balance.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } }]
            ],
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] }
        });
        
        doc.save(`Ledger-${selectedParty}.pdf`);
    };

    const exportToExcel = () => {
         if (!selectedParty || !selectedLedger) return;

        const ledgerData = getLedgerWithRunningBalance();

        const worksheetData = ledgerData.map(tx => ({
            Date: new Date(tx.date).toLocaleDateString('en-GB'),
            Document: `#${tx.docId}`,
            Type: tx.type,
            Debit: tx.type === 'Sale' ? tx.amount : '',
            Credit: tx.type === 'Purchase' ? tx.amount : '',
            Balance: tx.runningBalance,
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger');
        
        // Add final balance row
        XLSX.utils.sheet_add_aoa(worksheet, [
            ["", "", "", "", "Final Balance", selectedLedger.balance]
        ], { origin: -1 });

        // Style the currency columns
        const currencyFormat = '"₹"#,##0.00';
        worksheet['!cols'] = [
            { wch: 12 }, { wch: 12 }, { wch: 10 }, 
            { wch: 15 }, { wch: 15 }, { wch: 18 }
        ];

        for (let i = 2; i <= worksheetData.length + 2; i++) {
             if(worksheet[`D${i}`]) worksheet[`D${i}`].z = currencyFormat;
             if(worksheet[`E${i}`]) worksheet[`E${i}`].z = currencyFormat;
             if(worksheet[`F${i}`]) worksheet[`F${i}`].z = currencyFormat;
        }

        XLSX.writeFile(workbook, `Ledger-${selectedParty}.xlsx`);
    };
    
    const PartyIcon = ({ type }: { type: PartyType }) => {
        if (type === 'supplier') return <Factory className="h-4 w-4 mr-2 text-blue-500" />;
        if (type === 'customer') return <User className="h-4 w-4 mr-2 text-green-500" />;
        return <Users className="h-4 w-4 mr-2 text-purple-500" />;
    };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex flex-wrap items-center gap-4">
                <CardTitle>Khata Ledger</CardTitle>
                 {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2 min-w-[250px]">
                                {selectedParty && ledgers[selectedParty] && <PartyIcon type={ledgers[selectedParty].partyType} />}
                                <span className="flex-1 text-left">{selectedParty || 'Select a Party'}</span>
                                <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="max-h-96 overflow-y-auto">
                                {parties.map(party => (
                                    <DropdownMenuItem key={party} onSelect={() => setSelectedParty(party)}>
                                        <PartyIcon type={ledgers[party].partyType} />
                                        {party}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                         {selectedParty && (
                            <div className="flex items-center gap-2">
                                <Button onClick={exportToPDF} variant="outline" size="sm" className="gap-1">
                                    <FileDown className="h-3.5 w-3.5" /> PDF
                                </Button>
                                <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-1">
                                    <FileDown className="h-3.5 w-3.5" /> Excel
                                </Button>
                            </div>
                        )}
                    </>
                 )}
            </div>
        </div>
        <CardDescription>View the detailed transaction history and balance for each party.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
        ) : selectedLedger ? (
            <>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Document ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Debit (Sale)</TableHead>
                    <TableHead className="text-right">Credit (Purchase)</TableHead>
                    <TableHead className="text-right">Running Balance</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {getLedgerWithRunningBalance().map((tx) => (
                    <TableRow key={tx.id}>
                        <TableCell>{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell>
                            <Button variant="link" className="p-0 h-auto" onClick={() => navigateToDoc(tx.type, tx.docId)}>
                                #{tx.docId}
                            </Button>
                        </TableCell>
                        <TableCell>
                           <Badge variant={tx.type === 'Sale' ? 'default' : 'secondary'}>{tx.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-600">
                            {tx.type === 'Sale' ? `₹${tx.amount.toFixed(2)}` : '-'}
                        </TableCell>
                         <TableCell className="text-right font-mono text-red-600">
                             {tx.type === 'Purchase' ? `₹${tx.amount.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                           ₹{tx.runningBalance.toFixed(2)}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow className="font-bold text-lg">
                        <TableCell colSpan={5} className="text-right">Final Balance</TableCell>
                        <TableCell className={`text-right ${selectedLedger.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{Math.abs(selectedLedger.balance).toFixed(2)}
                            <span className="text-xs text-muted-foreground ml-1">
                                {selectedLedger.balance >= 0 ? '(Receivable)' : '(Payable)'}
                            </span>
                        </TableCell>
                    </TableRow>
                </TableFooter>
                </Table>
            </>
        ) : (
             <p className="text-center text-muted-foreground py-12">No transactions found. Start by creating sales or purchases.</p>
        )}
      </CardContent>
    </Card>
  );
}
