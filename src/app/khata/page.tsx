

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
import { Loader2, FileDown, User, Users, Plus, ChevronDown, Leaf, Printer, UserCheck, UserX, ShoppingCart, Banknote, Building, Globe } from 'lucide-react';
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
import Lottie from 'lottie-react';

type TransactionType = 'Sale' | 'Purchase' | 'Advance' | 'Repayment' | 'Bikri';

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
    [canonicalPartyName: string]: {
        transactions: Transaction[];
        balance: number;
        partyType: PartyType;
        displayName: string; 
    }
}

type LedgerEntryWithRunningBalance = Transaction & { runningBalance: number };

const normalizeName = (name: string): string => {
    if (!name) return '';
    // This version is more aggressive for matching but preserves the original look less.
    // Good for finding the canonical name.
    return name
        .toUpperCase()
        .replace(/R\/O.*$/i, '')
        .replace(/\(.*\)/, '')
        .replace(/\b(MOHAMMAD|MOHD|MD|GH\.)\b/g, 'MOHAMMAD')
        .replace(/\b(AHMAD|AH)\b/g, 'AHMAD')
        .replace(/S\/P|B\/P|K\/P|®/g, '') // Remove specific suffixes
        .replace(/[\.\,']/g, '')
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
    { name: 'Mohd. Maqbool Baigh', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Shabaan Ahangar', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Akbar Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Tanveer Ahmad Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Shabaan Lone (Lama)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Arif Lone (Uffa)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Subhan Parry', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohiuddin Lone (Potty)', address: 'R/o Nadihal Bla.' },
    { name: 'Majoor Ahmad Lone ®', address: 'R/o Nadihal Bla.' },
    { name: 'Jaana ® B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Rayees Rajab ®', address: 'R/o Nadihal Bla.' },
    { name: 'Hilal Ahmad Wani', address: 'R/o Nadihal Bla.' },
    { name: 'Javid Ahmad Sheikh', address: 'R/o Shanoo, Mawer Handwara' },
    { name: 'Mohd. Ashraf wani', address: 'R/o Nadihal Bla.' },
    { name: 'Bashir Ah. Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Nabi Lone', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohiuddin Lone (H)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd Yousuf Lone (Waza)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Akbar Lone (Lama)', address: 'R/o Nadihal Bla.' },
    { name: 'Mushtaq Ahmed Lone B/P', address: 'R/o Nadihal Bla.'},
    { name: 'Manzoor Ahmad Lone B/P', address: 'R/o Nadihal Bla.'},
    { name: 'Mohd. Yousuf Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Farooq Ahmad Lone (Lama)', address: 'R/o Nadihal Bla.' },
    { name: 'Farooq Ahmad Bhat', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Nabi Wani', address: 'R/o Nadihal Bla.' }
];

export default function KhataLedgerPage() {
    const router = useRouter();
    const [ledgers, setLedgers] = React.useState<Ledger>({});
    const [allParties, setAllParties] = React.useState<string[]>([]);
    const [filteredParties, setFilteredParties] = React.useState<string[]>([]);
    const [selectedParty, setSelectedParty] = React.useState<string | null>(null);
    const [activeTab, setActiveTab] = React.useState('growers');
    const [isLoading, setIsLoading] = React.useState(true);
    const [loaderAnimation, setLoaderAnimation] = React.useState(null);
    
    React.useEffect(() => {
        function fetchLedgerData() {
            if (typeof window === 'undefined') return;
            setIsLoading(true);
            
            fetch('/animations/forms/fco_loader.json').then(res => res.json()).then(setLoaderAnimation);

            const canonicalMap = new Map<string, string>(); 
            const transactionsByType: { [key: string]: Transaction[] } = { sales: [], purchases: [], advances: [], bikris: []};
            const allTransactions: Transaction[] = [];

            // Pass 1: Collect all transactions and build a complete map of all parties
            const addPartyToMap = (partyName: string) => {
                if (!partyName) return;
                const normalized = normalizeName(partyName);
                if (!canonicalMap.has(normalized)) {
                    canonicalMap.set(normalized, partyName);
                }
            };

            defaultGrowers.forEach(g => addPartyToMap(g.name));

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;

                try {
                    if (key.startsWith('party-')) {
                        const doc = JSON.parse(localStorage.getItem(key)!);
                        addPartyToMap(doc.name);
                    } else if (key.startsWith('invoice-')) {
                        const doc = JSON.parse(localStorage.getItem(key)!);
                        addPartyToMap(doc.customerName);
                        allTransactions.push({
                            id: `sale-${doc.sNo}`,
                            date: doc.date,
                            type: 'Sale',
                            amount: doc.totals.netSale,
                            grossAmount: doc.totals.grossSale,
                            expenses: doc.totals.totalExpenses,
                            party: doc.customerName,
                            docId: doc.id,
                        });
                    } else if (key.startsWith('purchase-')) {
                        const doc = JSON.parse(localStorage.getItem(key)!);
                        addPartyToMap(doc.growerName);
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
                        addPartyToMap(doc.partyName);
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
                    } else if (key.startsWith('bikri-')) {
                        const doc = JSON.parse(localStorage.getItem(key)!);
                        addPartyToMap(doc.market);
                        allTransactions.push({
                            id: doc.id,
                            date: doc.date,
                            type: 'Bikri',
                            amount: doc.calculation.netProfitOrLoss,
                            grossAmount: doc.calculation.grossSale,
                            expenses: doc.calculation.totalExpenses,
                            party: doc.market,
                            docId: doc.id.replace('bikri-',''),
                            notes: `Bikri #${doc.bikriNo} (Challan #${doc.challanNo})`
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse ledger data from local storage for key:", key, e);
                }
            }

            allTransactions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            // Pass 2: Build the ledgers using the complete canonical map
            const calculatedLedgers: Ledger = {};
            
            canonicalMap.forEach((displayName, normalizedName) => {
                 calculatedLedgers[displayName] = { 
                    transactions: [], 
                    balance: 0, 
                    partyType: 'customer', // Default type, will be adjusted
                    displayName: displayName
                };
            });

            for (const trans of allTransactions) {
                if (!trans.party) continue;
                const normalized = normalizeName(trans.party);
                const canonicalName = canonicalMap.get(normalized);
                
                if (canonicalName && calculatedLedgers[canonicalName]) {
                    const ledger = calculatedLedgers[canonicalName];
                    ledger.transactions.push(trans);
                    
                    if (trans.type === 'Sale') {
                        ledger.partyType = ledger.partyType === 'supplier' ? 'both' : 'customer';
                    }
                    if (trans.type === 'Purchase') {
                        ledger.partyType = ledger.partyType === 'customer' ? 'both' : 'supplier';
                    }
                }
            }
            
            // Pass 3: Calculate final balances
            Object.keys(calculatedLedgers).forEach(partyKey => {
                let runningBalance = 0;
                calculatedLedgers[partyKey].transactions.forEach(trans => {
                    if (trans.type === 'Sale' || trans.type === 'Repayment' || (trans.type === 'Bikri' && trans.amount >= 0)) {
                        runningBalance += trans.amount;
                    } else { // Purchase, Advance, Bikri Loss
                        runningBalance -= trans.amount;
                    }
                });
                calculatedLedgers[partyKey].balance = runningBalance;
            });
            
            const sortedParties = Object.keys(calculatedLedgers).sort((a, b) => a.localeCompare(b));
            
            setLedgers(calculatedLedgers);
            setAllParties(sortedParties);
            setIsLoading(false);
        }
        fetchLedgerData();
    }, []);

    React.useEffect(() => {
        const filterAndSetParties = (tab: 'growers' | 'customers' | 'outside' | 'fco' | 'all') => {
             const fcoName = 'F.Co (Own Stock)';
             if (tab === 'fco') {
                setFilteredParties([fcoName]);
                setSelectedParty(fcoName);
                return;
             }
            
            const parties = allParties.filter(p => {
                if (tab === 'all') return true;
                if (!p || p === fcoName) return false;
                const ledger = ledgers[p];
                
                if (tab === 'growers') {
                    return ledger?.transactions.some(t => t.type === 'Sale');
                }
                if (tab === 'customers') {
                    return ledger?.transactions.some(t => t.type === 'Purchase' || t.type === 'Advance');
                }
                if (tab === 'outside') {
                    return ledger?.transactions.some(t => t.type === 'Bikri');
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
    }, [activeTab, allParties, ledgers, selectedParty]);

    const selectedLedger = selectedParty ? ledgers[selectedParty] : null;

    const navigateToDoc = (type: TransactionType, docId: string) => {
        let path = '';
        if (type === 'Sale') path = `/invoice/${docId}`;
        else if (type === 'Purchase') path = `/purchase-bill/${docId}`;
        else if (type === 'Advance' || type === 'Repayment') path = '/advances';
        else if (type === 'Bikri') path = `/bikri-bill/${docId}`;
        
        if (path) router.push(path);
    };

    const getLedgerWithRunningBalance = (): LedgerEntryWithRunningBalance[] => {
        if (!selectedLedger) return [];
        let runningBalance = 0;
        return selectedLedger.transactions.map(tx => {
             if (tx.type === 'Sale' || tx.type === 'Repayment' || (tx.type === 'Bikri' && tx.amount >= 0)) {
                runningBalance += tx.amount;
            } else { // Purchase, Advance
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
            head: [['Date', 'Doc ID / Particulars', 'Type', 'Debit (Receivable)', 'Credit (Payable)', 'Balance']],
            body: ledgerForExport.map(tx => [
                new Date(tx.date).toLocaleDateString('en-GB'),
                tx.notes || (tx.type === 'Sale' ? `Bill #${tx.docId}` : tx.type === 'Purchase' ? `Purchase #${tx.docId}` : tx.type === 'Bikri' ? `Bikri #${tx.docId}` : tx.type),
                tx.type,
                (tx.type === 'Purchase' || tx.type === 'Advance' || (tx.type === 'Bikri' && tx.amount < 0)) ? `₹${Math.abs(tx.amount).toFixed(2)}` : '-',
                (tx.type === 'Sale' || tx.type === 'Repayment' || (tx.type === 'Bikri' && tx.amount >= 0)) ? `₹${tx.amount.toFixed(2)}` : '-',
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
            'Document ID': tx.docId,
            'Particulars (Original Name)': tx.party,
            Type: tx.type,
            'Debit (Receivable)': (tx.type === 'Purchase' || tx.type === 'Advance' || (tx.type === 'Bikri' && tx.amount < 0)) ? Math.abs(tx.amount) : '',
            'Credit (Payable)': (tx.type === 'Sale' || tx.type === 'Repayment' || (tx.type === 'Bikri' && tx.amount >= 0)) ? tx.amount : '',
            'Running Balance': tx.runningBalance,
            'Notes': tx.notes || '',
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger');
        
        XLSX.utils.sheet_add_aoa(worksheet, [
            ["", "", "", "", "","Final Balance", selectedLedger.balance]
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
             if (tx.type === 'Sale' || tx.type === 'Repayment' || (tx.type === 'Bikri' && tx.amount >= 0)) {
                acc.credit += tx.amount;
            } else { // Purchase, Advance, Bikri Loss
                acc.debit += Math.abs(tx.amount);
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
            case 'Bikri': return 'default';
            default: return 'default';
        }
    }

    const FinalBalanceDisplay = () => {
        if (!selectedLedger) return null;

        let balanceText: string;
        let balanceColor: string;
        
        if (activeTab === 'outside') {
            if (selectedLedger.balance >= 0) { // Profit is owed to you
                balanceText = '(Receivable)';
                balanceColor = 'text-green-600';
            } else { // Loss is owed by you
                balanceText = '(Payable)';
                balanceColor = 'text-red-500';
            }
        } else { // For Growers and Customers
             if (selectedLedger.balance >= 0) { // You owe the grower
                balanceText = '(Payable)';
                balanceColor = 'text-red-500';
            } else { // Customer owes you
                balanceText = '(Receivable)';
                balanceColor = 'text-green-600';
            }
        }
        
        return (
            <TableRow className="font-bold text-lg bg-muted">
                <TableCell colSpan={5} className="text-right">Final Balance</TableCell>
                <TableCell className={`text-right ${balanceColor}`}>
                    ₹{Math.abs(selectedLedger.balance).toFixed(2)}
                    <span className="text-xs text-muted-foreground ml-1">
                        {balanceText}
                    </span>
                </TableCell>
            </TableRow>
        );
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
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="growers"><Leaf className="h-4 w-4 mr-2"/>Grower Ledger</TabsTrigger>
                            <TabsTrigger value="customers"><ShoppingCart className="h-4 w-4 mr-2"/>Customer Ledger</TabsTrigger>
                             <TabsTrigger value="outside"><Globe className="h-4 w-4 mr-2"/>Outside Sales</TabsTrigger>
                            <TabsTrigger value="fco"><Building className="h-4 w-4 mr-2"/>F.Co Ledger</TabsTrigger>
                            <TabsTrigger value="all"><Users className="h-4 w-4 mr-2"/>All Parties</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    {isLoading || !loaderAnimation ? (
                        <div className="flex justify-center items-center p-4">
                            {loaderAnimation && <Lottie animationData={loaderAnimation} loop={true} style={{ width: 40, height: 40 }} />}
                        </div>
                    ) : (
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

                {isLoading || !loaderAnimation ? (
                    <div className="flex justify-center items-center h-64 print-hidden">
                        {loaderAnimation && <Lottie animationData={loaderAnimation} loop={true} style={{ width: 100, height: 100 }} />}
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
                                        {tx.notes || (tx.type === 'Sale' ? `Bill #${tx.docId}` : tx.type === 'Purchase' ? `Purchase #${tx.docId}` : tx.type === 'Bikri' ? `Bikri #${tx.docId}`: tx.type)}
                                    </Button>
                                    <span className="hidden print:inline">{tx.notes || (tx.type === 'Sale' ? `Bill #${tx.docId}` : tx.type === 'Purchase' ? `Purchase #${tx.docId}` : tx.type === 'Bikri' ? `Bikri #${tx.docId}` : tx.type)}</span>
                                     <p className="text-xs text-muted-foreground hidden print:block">({tx.party})</p>
                                </TableCell>
                                <TableCell>
                                   <Badge variant={getBadgeVariant(tx.type)}>{tx.type}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono text-red-500">
                                    {(tx.type === 'Purchase' || tx.type === 'Advance' || (tx.type === 'Bikri' && tx.amount < 0)) ? `₹${Math.abs(tx.amount).toFixed(2)}` : '-'}
                                </TableCell>
                                <TableCell className="text-right font-mono text-green-600">
                                    {(tx.type === 'Sale' || tx.type === 'Repayment' || (tx.type === 'Bikri' && tx.amount >= 0)) ? `₹${tx.amount.toFixed(2)}` : '-'}
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
                            <FinalBalanceDisplay />
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
