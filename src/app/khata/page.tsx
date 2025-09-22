

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
import { Loader2, FileDown, User, Users, Plus, ChevronDown, Leaf, Printer, UserCheck, UserX, ShoppingCart, Banknote, Building } from 'lucide-react';
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

type TransactionType = 'Sale' | 'Purchase' | 'Advance' | 'Repayment';

type Transaction = {
    id: string;
    date: string;
    type: TransactionType;
    amount: number; 
    grossAmount: number; 
    expenses: number; 
    party: string;
    docId: string;
    notes?: string;
};

type PartyType = 'customer' | 'supplier' | 'both';

type Ledger = {
    [normalizedPartyName: string]: {
        transactions: Transaction[];
        balance: number; // positive means we owe them (payable), negative means they owe us (receivable)
        partyType: PartyType;
        displayName: string; // The original, non-normalized name to display
    }
}

type LedgerEntryWithRunningBalance = Transaction & { runningBalance: number };

const normalizeName = (name: string): string => {
    if (!name) return '';
    return name
        .toUpperCase()
        .replace(/R\/O.*$/i, '')
        .replace(/\(.*\)/, '')
        .replace(/\b(MOHAMMAD|MOHD|MD|GH\.)\b/g, 'MOHAMMAD')
        .replace(/\b(AHMAD|AH)\b/g, 'AHMAD')
        .replace(/S\/P|B\/P|K\/P|®|\(R\)/g, '')
        .replace(/[\.\,\']/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

const defaultGrowers: { name: string, address: string }[] = [
    { name: 'AB. Majeed Lone S/P', address: 'R/o Nadihal Bla.' },
    { name: 'AB. Salaam Lone K/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Ayoub Khan', address: 'R/o Nadihal Bla.' },
    { name: 'Nazir Ahmad Dar (Happa)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Maqbool Dar (Happa)', address: 'R/o Nadihal Bla.' },
    { name: 'Mushtaq Ahmad Lone K/P', address: 'R/o Nadihal Bla.' },
    { name: 'Manzoor Ahmad Lone K/P', address: 'R/o Nadihal Bla.' },
    { name: 'Naseer Ahmad Bhat', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohd. Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohd. Bhat', address: 'R/o Nadihal Bla.' },
    { name: 'Nazir Ahmad Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mushtaq Ahmad Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Maqbool Baigh', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Shabaan Ahangar', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Akbar Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Tanveer Ahmad Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Shabaan Lone (Lama)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Arif Lone (Uffa)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Subhan Parry', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohiuddin Lone (Potty)', address: 'R/o Nadihal Bla.' },
    { name: 'Majoor Ahmad Lone ®', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Akbar Lone (Lama)', address: 'R/o Nadihal Bla.' },
    { name: 'Jaana ® B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Rayees Rajab ®', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Nabi Lone', address: 'R/o Nadihal Bla.' },
    { name: 'Hilal Ahmad Wani', address: 'R/o Nadihal Bla.' },
    { name: 'Javid Ahmad Sheikh', address: 'R/o Shanoo, Mawer Handwara' },
    { name: 'Manzoor Ah. Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Farooq Ahmad Lone (Lama)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Ashraf wani', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Yousuf Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Yousuf Lone (Waza)', address: 'R/o Nadihal Bla.' },
    { name: 'Farooq Ahmad Bhat', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Nabi Wani', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohiuddin Lone ®', address: 'R/o Nadihal Baramulla' },
    { name: 'Bashir Ah. Lone B/P', address: 'R/o Nadihal Bla.' }
];

export default function KhataLedgerPage() {
    const router = useRouter();
    const [ledgers, setLedgers] = React.useState<Ledger>({});
    const [allParties, setAllParties] = React.useState<string[]>([]);
    const [filteredParties, setFilteredParties] = React.useState<string[]>([]);
    const [selectedParty, setSelectedParty] = React.useState<string | null>(null);
    const [activeTab, setActiveTab] = React.useState('growers');
    const [isLoading, setIsLoading] = React.useState(true);
    const [partyNameMap, setPartyNameMap] = React.useState<Map<string, string>>(new Map());

    React.useEffect(() => {
        function fetchLedgerData() {
            if (typeof window === 'undefined') return;
            setIsLoading(true);

            // 1. Create a canonical name map
            const canonicalMap = new Map<string, string>();
            const displayNameMap = new Map<string, string>();
            const allKnownParties: { name: string, type: PartyType }[] = [];

            // Add default growers to establish canonical names
            defaultGrowers.forEach(p => {
                const normalized = normalizeName(p.name);
                if (!canonicalMap.has(normalized)) {
                    canonicalMap.set(normalized, p.name);
                    displayNameMap.set(p.name, p.name);
                    allKnownParties.push({ name: p.name, type: 'supplier' });
                }
            });

            // Load all other parties from storage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('party-')) {
                    const party = JSON.parse(localStorage.getItem(key)!);
                    const normalized = normalizeName(party.name);
                    if (!canonicalMap.has(normalized)) {
                        canonicalMap.set(normalized, party.name);
                        displayNameMap.set(party.name, party.name);
                        allKnownParties.push({ name: party.name, type: party.type === 'Grower' ? 'supplier' : 'customer' });
                    }
                }
            }
             setPartyNameMap(displayNameMap);
            
            // 2. Process all transactions
            const allTransactions: Transaction[] = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;

                try {
                    if (key.startsWith('invoice-')) {
                        const doc = JSON.parse(localStorage.getItem(key)!);
                         allTransactions.push({
                            id: `sale-${doc.sNo}`,
                            date: doc.date,
                            type: 'Sale',
                            amount: doc.totals.netSale,
                            grossAmount: doc.totals.grossSale,
                            expenses: doc.totals.totalExpenses,
                            party: doc.customerName,
                            docId: doc.sNo,
                        });
                    } else if (key.startsWith('purchase-')) {
                        const doc = JSON.parse(localStorage.getItem(key)!);
                        allTransactions.push({
                            id: `purchase-${doc.billNo}`,
                            date: doc.date,
                            type: 'Purchase',
                            amount: doc.totals.grandTotal,
                            grossAmount: doc.totals.grandTotal,
                            expenses: 0,
                            party: doc.growerName,
                            docId: doc.billNo,
                        });
                    } else if (key.startsWith('advance-')) {
                        const doc = JSON.parse(localStorage.getItem(key)!);
                        allTransactions.push({
                            id: doc.id,
                            date: doc.date,
                            type: doc.type === 'Advance Given' ? 'Advance' : 'Repayment',
                            amount: doc.amount,
                            grossAmount: doc.amount,
                            expenses: 0,
                            party: doc.partyName,
                            docId: doc.id.replace('advance-',''),
                            notes: doc.notes,
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse ledger data from local storage for key:", key, e);
                }
            }

            allTransactions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            // 3. Build ledgers using canonical names
            const calculatedLedgers: Ledger = {};

            for (const trans of allTransactions) {
                if (!trans.party) continue;
                const normalized = normalizeName(trans.party);
                const canonicalName = canonicalMap.get(normalized) || trans.party;
                
                if (!calculatedLedgers[canonicalName]) {
                    calculatedLedgers[canonicalName] = { 
                        transactions: [], 
                        balance: 0, 
                        partyType: 'customer', // Default
                        displayName: canonicalName 
                    };
                }
                
                const ledger = calculatedLedgers[canonicalName];
                ledger.transactions.push(trans);
                
                const isSupplierTx = trans.type === 'Sale';
                if (isSupplierTx && ledger.partyType === 'customer') {
                    ledger.partyType = 'both';
                } else if (isSupplierTx) {
                     ledger.partyType = 'supplier';
                }
            }
            
            Object.keys(calculatedLedgers).forEach(partyKey => {
                let runningBalance = 0;
                calculatedLedgers[partyKey].transactions.forEach(trans => {
                    if (trans.type === 'Sale' || trans.type === 'Repayment') {
                        runningBalance += trans.amount;
                    } else { // Purchase or Advance
                        runningBalance -= trans.amount;
                    }
                });
                calculatedLedgers[partyKey].balance = runningBalance;
            });
            
            const sortedParties = [...new Set([...Object.keys(calculatedLedgers), ...Array.from(canonicalMap.values())])].sort((a, b) => a.localeCompare(b));
            
            setLedgers(calculatedLedgers);
            setAllParties(sortedParties);
            setIsLoading(false);
        }
        fetchLedgerData();
    }, []);

    React.useEffect(() => {
        const filterAndSetParties = (tab: 'growers' | 'customers' | 'fco' | 'all') => {
             const fcoName = 'F.Co (Own Stock)';
             if (tab === 'fco') {
                setFilteredParties([fcoName]);
                setSelectedParty(fcoName);
                return;
             }
            
            const parties = allParties.filter(p => {
                if (tab === 'all') return true;
                if (!p || p === fcoName) return false;
                const ledger = ledgers[p]; // Use direct key since it's already canonical
                
                if (tab === 'growers') {
                    return ledger?.transactions.some(t => t.type === 'Sale');
                }
                if (tab === 'customers') {
                    return ledger?.transactions.some(t => t.type === 'Purchase' || t.type === 'Advance' || t.type === 'Repayment');
                }
                return false;
            });

            setFilteredParties(parties);
            if(parties.length > 0) {
                if (!selectedParty || !parties.includes(selectedParty)) {
                  setSelectedParty(parties[0]);
                }
            } else {
                setSelectedParty(null);
            }
        };
        
        filterAndSetParties(activeTab as any);
    }, [activeTab, allParties, ledgers]);

    const selectedLedger = selectedParty ? ledgers[selectedParty] : null;

    const navigateToDoc = (type: TransactionType, docId: string) => {
        let path = '';
        if (type === 'Sale') path = `/invoice/${docId}`;
        else if (type === 'Purchase') path = `/purchase-bill/${docId}`;
        else if (type === 'Advance' || type === 'Repayment') path = '/advances';
        
        if (path) router.push(path);
    };

    const getLedgerWithRunningBalance = (): LedgerEntryWithRunningBalance[] => {
        if (!selectedLedger) return [];
        let runningBalance = 0;
        return selectedLedger.transactions.map(tx => {
            if(tx.type === 'Sale' || tx.type === 'Repayment') {
                runningBalance += tx.amount;
            } else { // Advance or Purchase
                runningBalance -= tx.amount;
            }
            return {...tx, runningBalance};
        });
    };

    const ledgerForExport = getLedgerWithRunningBalance();
    
    const exportToPDF = () => {
        if (!selectedParty || !selectedLedger) return;
        
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(`Ledger Statement for ${selectedParty}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 14, 28);
        
        doc.setFontSize(10);
        doc.text("F.Co - FIRDOUS AHMAD & COMPANY", doc.internal.pageSize.width - 14, 22, { align: 'right'});

        autoTable(doc, {
            startY: 35,
            head: [['Date', 'Doc ID', 'Type', 'Debit (You Get)', 'Credit (You Give)', 'Balance']],
            body: ledgerForExport.map(tx => [
                new Date(tx.date).toLocaleDateString('en-GB'),
                `#${tx.docId}`,
                tx.type,
                (tx.type === 'Purchase' || tx.type === 'Advance') ? `₹${tx.amount.toFixed(2)}` : '-',
                (tx.type === 'Sale' || tx.type === 'Repayment') ? `₹${tx.amount.toFixed(2)}` : '-',
                `₹${tx.runningBalance.toFixed(2)}`
            ]),
            foot: [
                [{ content: 'Final Balance', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, 
                 { content: `₹${selectedLedger.balance.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } }]
            ],
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] }
        });

        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text('Your Satisfaction is Our Success – Subject to Sopore Jurisdiction Only', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center'});
        }
        
        doc.save(`Ledger-${selectedParty}.pdf`);
    };

    const exportToExcel = () => {
        if (!selectedParty || !selectedLedger) return;

        const worksheetData = ledgerForExport.map(tx => ({
            Date: new Date(tx.date).toLocaleDateString('en-GB'),
            'Document ID': `#${tx.docId}`,
            Type: tx.type,
            'Debit (You Get)': (tx.type === 'Purchase' || tx.type === 'Advance') ? tx.amount : '',
            'Credit (You Give)': (tx.type === 'Sale' || tx.type === 'Repayment') ? tx.amount : '',
            'Running Balance': tx.runningBalance,
            'Notes': tx.notes || '',
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger');
        
        XLSX.utils.sheet_add_aoa(worksheet, [
            ["", "", "", "", "", "Final Balance", selectedLedger.balance]
        ], { origin: -1 });

        XLSX.writeFile(workbook, `Ledger-${selectedParty}.xlsx`);
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
            if (tx.type === 'Purchase' || tx.type === 'Advance') {
                acc.debit += tx.amount;
            } else { // Sale, Repayment
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
                 <DropdownMenuItem onSelect={() => router.push('/advances')}>
                    New Advance/Repayment
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
    
    const getBadgeVariant = (type: TransactionType) => {
        switch (type) {
            case 'Sale': return 'default';
            case 'Purchase': return 'secondary';
            case 'Advance': return 'destructive';
            case 'Repayment': return 'outline';
            default: return 'default';
        }
    }

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
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="growers"><Leaf className="h-4 w-4 mr-2"/>Grower Ledger</TabsTrigger>
                            <TabsTrigger value="customers"><ShoppingCart className="h-4 w-4 mr-2"/>Customer Ledger</TabsTrigger>
                            <TabsTrigger value="fco"><Building className="h-4 w-4 mr-2"/>F.Co Ledger</TabsTrigger>
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
                                        {ledgers[party] && <PartyIcon type={ledgers[party].partyType} />}
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
                                <TableHead>Particulars</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Debit (Receivable)</TableHead>
                                <TableHead className="text-right">Credit (Payable)</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {getLedgerWithRunningBalance().map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell>{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                                <TableCell>
                                    <Button variant="link" className="p-0 h-auto print-hidden" onClick={() => navigateToDoc(tx.type, tx.docId)}>
                                        {tx.type === 'Sale' ? `Bill #${tx.docId}` : tx.type === 'Purchase' ? `Purchase #${tx.docId}` : tx.notes || tx.type}
                                    </Button>
                                    <span className="hidden print:inline">{tx.type === 'Sale' ? `Bill #${tx.docId}` : tx.type === 'Purchase' ? `Purchase #${tx.docId}` : tx.notes || tx.type}</span>
                                </TableCell>
                                <TableCell>
                                   <Badge variant={getBadgeVariant(tx.type)}>{tx.type}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono text-red-500">
                                    {(tx.type === 'Purchase' || tx.type === 'Advance') ? `₹${tx.amount.toFixed(2)}` : '-'}
                                </TableCell>
                                <TableCell className="text-right font-mono text-green-600">
                                    {(tx.type === 'Sale' || tx.type === 'Repayment') ? `₹${tx.amount.toFixed(2)}` : '-'}
                                </TableCell>
                                <TableCell className="text-right font-mono">₹{tx.runningBalance.toFixed(2)}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold">
                                <TableCell colSpan={3} className="text-right">Totals</TableCell>
                                <TableCell className="text-right text-red-500">₹{totals.debit.toFixed(2)}</TableCell>
                                <TableCell className="text-right text-green-600">₹{totals.credit.toFixed(2)}</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                             <TableRow className="font-bold text-lg bg-muted">
                                <TableCell colSpan={5} className="text-right">Final Balance</TableCell>
                                <TableCell className={`text-right ${selectedLedger.balance < 0 ? 'text-red-700' : 'text-green-700'}`}>
                                    ₹{Math.abs(selectedLedger.balance).toFixed(2)}
                                    <span className="text-xs text-muted-foreground ml-1">
                                        {selectedLedger.balance < 0 ? '(Receivable)' : '(Payable)'}
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
