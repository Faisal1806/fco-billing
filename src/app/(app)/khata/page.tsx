
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
import { ChevronDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';


type Transaction = {
    id: string;
    date: string;
    type: 'Sale' | 'Purchase';
    amount: number; // For sales, it's netSale. For purchases, it's grandTotal.
    party: string;
    docId: string;
};

type Ledger = {
    [partyName: string]: {
        transactions: Transaction[];
        balance: number; // positive means we are owed, negative means we owe
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

        // Fetch sales (wataks)
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('invoice-')) {
                const sale = JSON.parse(localStorage.getItem(key)!);
                allTransactions.push({
                    id: `sale-${sale.sNo}`,
                    date: sale.date,
                    type: 'Sale',
                    amount: sale.totals.netSale,
                    party: sale.customerName,
                    docId: sale.sNo,
                });
            } else if (key && key.startsWith('purchase-')) {
                 const purchase = JSON.parse(localStorage.getItem(key)!);
                 allTransactions.push({
                    id: `purchase-${purchase.billNo}`,
                    date: purchase.date,
                    type: 'Purchase',
                    amount: purchase.totals.grandTotal,
                    party: purchase.growerName, // Or companyName
                    docId: purchase.billNo,
                });
            }
        }

        allTransactions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const calculatedLedgers: Ledger = {};

        for (const trans of allTransactions) {
            if (!calculatedLedgers[trans.party]) {
                calculatedLedgers[trans.party] = { transactions: [], balance: 0 };
            }
            const ledger = calculatedLedgers[trans.party];
            ledger.transactions.push(trans);

            // If it's a sale, the party owes us, so balance increases.
            // If it's a purchase, we owe the party, so balance decreases.
            if (trans.type === 'Sale') {
                ledger.balance += trans.amount;
            } else {
                ledger.balance -= trans.amount;
            }
        }

        setLedgers(calculatedLedgers);
        setParties(Object.keys(calculatedLedgers));
        if (Object.keys(calculatedLedgers).length > 0) {
            setSelectedParty(Object.keys(calculatedLedgers)[0]);
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
                <CardTitle>Khata Ledger</CardTitle>
                 {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2 min-w-[250px]">
                               <span className="flex-1 text-left">{selectedParty || 'Select a Party'}</span>
                               <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="max-h-96 overflow-y-auto">
                            {parties.map(party => (
                                 <DropdownMenuItem key={party} onSelect={() => setSelectedParty(party)}>
                                    {party}
                                 </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {selectedLedger.transactions.map((tx) => (
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
                    </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow className="font-bold text-lg">
                        <TableCell colSpan={4} className="text-right">Final Balance</TableCell>
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
