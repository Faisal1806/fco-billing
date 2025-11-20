
'use client'

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Loader2, FileDown, User, Users, Plus, ChevronDown, Leaf, Printer, ShoppingCart, Banknote, Building, Globe, Gift, ArrowDown, ArrowUp, Minus, Equals } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './print.css';
import Lottie from 'lottie-react';
import { Separator } from '@/components/ui/separator';

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

type PartyType = 'supplier' | 'customer' | 'both' | 'outside' | 'fco';

type Ledger = {
    [canonicalPartyName: string]: {
        transactions: Transaction[];
        partyType: PartyType;
        displayName: string; 
    }
}

const getCanonicalName = (name: string): string => {
    if (!name) return '';
    return name.trim();
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
    { name: 'GH. Mohiuddin Lone (Poltry)', address: 'R/o Nadihal Bla.' },
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
    const [selectedParty, setSelectedParty] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [loaderAnimation, setLoaderAnimation] = React.useState(null);
    
    React.useEffect(() => {
        function fetchLedgerData() {
            if (typeof window === 'undefined') return;
            setIsLoading(true);
            
            fetch('/animations/forms/fco_loader.json').then(res => res.json()).then(setLoaderAnimation);

            const allTransactions: any[] = [];
            const partyDisplayNameMap = new Map<string, string>();
             const partyTypes = new Map<string, Set<TransactionType>>();

            const addParty = (name: string) => {
                if (!name) return;
                const canonical = getCanonicalName(name);
                if (!partyDisplayNameMap.has(canonical)) {
                    partyDisplayNameMap.set(canonical, name);
                }
            };

            const recordPartyActivity = (name: string, activity: TransactionType) => {
                 if (!name) return;
                 addParty(name);
                 const canonical = getCanonicalName(name);
                 if(!partyTypes.has(canonical)) {
                     partyTypes.set(canonical, new Set());
                 }
                 partyTypes.get(canonical)!.add(activity);
            };
            
            defaultGrowers.forEach(g => addParty(g.name));
            for (let i = 0; i < localStorage.length; i++) {
                 const key = localStorage.key(i);
                 if (key?.startsWith('party-')) {
                    try {
                        const doc = JSON.parse(localStorage.getItem(key)!);
                        addParty(doc.name);
                    } catch(e) { console.error('Error parsing party', e)}
                }
            }


            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;

                try {
                    if (key.startsWith('invoice-')) {
                        const doc = JSON.parse(localStorage.getItem(key)!);
                        recordPartyActivity(doc.customerName, 'Sale');
                        allTransactions.push({ ...doc, _type: 'Sale' });
                    } else if (key.startsWith('purchase-')) {
                        const doc = JSON.parse(localStorage.getItem(key)!);
                        recordPartyActivity(doc.growerName, 'Purchase');
                        allTransactions.push({ ...doc, _type: 'Purchase' });
                    } else if (key.startsWith('advance-')) {
                        const doc = JSON.parse(localStorage.getItem(key)!);
                        const type = doc.type === 'Advance Given' ? 'Advance' : (doc.type === 'Discount' ? 'Discount' : 'Repayment');
                        recordPartyActivity(doc.partyName, type as TransactionType);
                         allTransactions.push({ ...doc, _type: type });
                    } else if (key.startsWith('bikri-')) {
                        const doc = JSON.parse(localStorage.getItem(key)!);
                         const isForwarding = doc.bikriType === 'growerForwarding';
                         const partyName = isForwarding ? doc.growerName : doc.market;
                        recordPartyActivity(partyName, 'Bikri');
                        allTransactions.push({ ...doc, _type: 'Bikri' });
                    }
                } catch (e) {
                    console.error("Failed to parse ledger data from local storage for key:", key, e);
                }
            }

            allTransactions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            const calculatedLedgers: Ledger = {};
            
            partyDisplayNameMap.forEach((displayName, canonicalName) => {
                 const activities = partyTypes.get(canonicalName) || new Set();
                 let partyType: PartyType;
                 const hasSales = activities.has('Sale');
                 const hasPurchases = activities.has('Purchase');
                 const hasBikri = activities.has('Bikri');
                 if (displayName === 'F.Co (Own Stock)') {
                     partyType = 'fco';
                 } else if (hasBikri && !hasSales && !hasPurchases) {
                     partyType = 'outside';
                 } else if (hasSales && !hasPurchases) {
                     partyType = 'supplier';
                 } else if (hasPurchases && !hasSales) {
                     partyType = 'customer';
                 } else if (hasSales || hasPurchases) {
                     partyType = 'both';
                 }
                 else {
                     partyType = 'customer';
                 }
                 calculatedLedgers[displayName] = { transactions: [], partyType: partyType, displayName: displayName };
            });

            for (const tx of allTransactions) {
                let partyName: string | undefined;
                if (tx._type === 'Sale') partyName = tx.customerName;
                else if (tx._type === 'Purchase') partyName = tx.growerName;
                else if (tx._type === 'Advance' || tx._type === 'Repayment' || tx._type === 'Discount') partyName = tx.partyName;
                else if (tx._type === 'Bikri') partyName = tx.bikriType === 'growerForwarding' ? tx.growerName : tx.market;

                if (!partyName) continue;
                
                const foundKey = Array.from(partyDisplayNameMap.keys()).find(k => getCanonicalName(partyName!) === k);
                const displayName = foundKey ? partyDisplayNameMap.get(foundKey) : partyName;
                
                if (calculatedLedgers[displayName!]) {
                    let transaction: Transaction | null = null;
                     if (tx._type === 'Sale') {
                        transaction = { id: `sale-${tx.sNo}`, date: tx.date, type: 'Sale', docId: tx.id, peti: tx.totals.pattiQty, dabba: tx.totals.dabbaQty, grossSale: tx.totals.grossSale, expenses: tx.totals.totalExpenses, netSale: tx.totals.netSale, notes: `Watak #${tx.watakNo}` };
                    } else if (tx._type === 'Bikri' && calculatedLedgers[displayName!].partyType === 'supplier') {
                        transaction = { id: `bikri-${tx.id}`, date: tx.date, type: 'Bikri', docId: tx.id, grossSale: tx.calculation.grossSale, expenses: tx.calculation.totalExpenses, netSale: tx.calculation.netSalePayableToGrower, notes: `Bikri #${tx.bikriNo}` };
                    } else if (tx._type === 'Purchase') {
                        transaction = { id: `purchase-${tx.billNo}`, date: tx.date, type: 'Purchase', docId: tx.billNo, remittanceDetails: `Goods purchased`, debitAmount: tx.totals.grandTotal, notes: `Purchase Bill #${tx.billNo}` };
                    } else if (tx._type === 'Advance') {
                        transaction = { id: tx.id, date: tx.date, type: 'Advance', docId: tx.id.replace('advance-', ''), remittanceDetails: tx.notes || 'Advance paid', debitAmount: tx.amount };
                    } else if (tx._type === 'Repayment') {
                         transaction = { id: tx.id, date: tx.date, type: 'Repayment', docId: tx.id.replace('advance-', ''), remittanceDetails: tx.notes || 'Payment Received', debitAmount: -tx.amount }; // Negative for credit
                    } else if (tx._type === 'Discount') {
                         transaction = { id: tx.id, date: tx.date, type: 'Discount', docId: tx.id.replace('advance-',''), remittanceDetails: tx.notes || 'Discount given', debitAmount: tx.amount };
                    }

                    if (transaction) {
                        calculatedLedgers[displayName!].transactions.push(transaction);
                    }
                }
            }
            
            const sortedParties = Object.keys(calculatedLedgers).filter(p => calculatedLedgers[p].partyType === 'supplier' || calculatedLedgers[p].partyType === 'both').sort((a, b) => a.localeCompare(b));
            
            setLedgers(calculatedLedgers);
            setAllParties(sortedParties);
            if (sortedParties.length > 0) {
                setSelectedParty(sortedParties[0]);
            }
            setIsLoading(false);
        }
        fetchLedgerData();
    }, []);

    const selectedLedger = selectedParty ? ledgers[selectedParty] : null;

    const statementData = React.useMemo(() => {
        if (!selectedLedger) return { creditRows: [], debitRows: [], creditTotals: {}, debitTotals: {}, balance: 0 };
        
        const creditRows: Transaction[] = [];
        const debitRows: Transaction[] = [];

        selectedLedger.transactions.forEach(tx => {
            if (tx.netSale !== undefined) {
                creditRows.push(tx);
            } else if (tx.debitAmount !== undefined) {
                debitRows.push(tx);
            }
        });
        
        const maxRows = Math.max(creditRows.length, debitRows.length);
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
    }, [selectedLedger]);


    const navigateToDoc = (type: TransactionType, docId: string) => {
        let path = '';
        if (type === 'Sale') path = `/invoice/${docId}`;
        else if (type === 'Purchase') path = `/purchase-bill/${docId}`;
        else if (type === 'Advance' || type === 'Repayment' || type === 'Discount') path = '/advances';
        else if (type === 'Bikri') path = `/bikri-bill/${encodeURIComponent(docId)}`;
        
        if (path) router.push(path);
    };
    
    const handlePrint = () => {
        window.print();
    }

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
    
    return (
    <>
        <Card className="printable-area">
            <CardHeader className="print-hidden">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Statement of Account</CardTitle>
                        <CardDescription>A complete credit/debit statement for each grower.</CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                         {selectedParty && (
                            <Button onClick={handlePrint} variant="outline" size="sm" className="gap-1">
                                <Printer className="h-3.5 w-3.5" /> Print
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-4 print-hidden">
                     <p className="text-muted-foreground">Select a grower to view their statement.</p>
                    {isLoading || !loaderAnimation ? (
                        <div className="flex justify-center items-center p-4">
                            {loaderAnimation && <Lottie animationData={loaderAnimation} loop={true} style={{ width: 40, height: 40 }} />}
                        </div>
                    ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2 min-w-[250px]">
                                <Leaf className="h-4 w-4 mr-2 text-green-500" />
                                <span className="flex-1 text-left">{selectedParty || 'Select a Grower'}</span>
                                <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="max-h-96 overflow-y-auto">
                                {allParties.map(party => (
                                    <DropdownMenuItem key={party} onSelect={() => setSelectedParty(party)}>
                                        <Leaf className="h-4 w-4 mr-2 text-green-500" />
                                        {party}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <div className="print-header hidden print:block text-center mb-4 border-b-2 pb-2">
                    <h1 className="text-xl font-bold">STATEMENT OF ACCOUNT</h1>
                    <h2 className="text-lg">Firdous Ahmad & Company</h2>
                    <p className="text-xs">Shed No.13, Fud No-12 A Fruit Mandi Apple Town Sopore -193201 (KMR)</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4 print:grid-cols-2">
                    <p><strong>M/s:</strong> {selectedParty}</p>
                    <p className="text-right"><strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64 print-hidden">
                        {loaderAnimation && <Lottie animationData={loaderAnimation} loop={true} style={{ width: 100, height: 100 }} />}
                    </div>
                ) : selectedLedger ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                        {/* CREDIT SIDE */}
                        <div className="border-r pr-2">
                            <h3 className="font-bold text-center mb-2">CREDIT</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="h-8 p-1 text-xs">Date</TableHead>
                                        <TableHead className="h-8 p-1 text-xs">Doc</TableHead>
                                        <TableHead className="h-8 p-1 text-xs">Peti</TableHead>
                                        <TableHead className="h-8 p-1 text-xs">Daba</TableHead>
                                        <TableHead className="h-8 p-1 text-xs text-right">Gross</TableHead>
                                        <TableHead className="h-8 p-1 text-xs text-right">Exp</TableHead>
                                        <TableHead className="h-8 p-1 text-xs text-right">Net Sale</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {statementData.creditRows.map((tx, i) => (
                                        <TableRow key={`credit-${i}`} className="h-6">
                                            <TableCell className="p-1 text-xs">{tx.date ? new Date(tx.date).toLocaleDateString('en-GB') : ''}</TableCell>
                                            <TableCell className="p-1 text-xs">{tx.notes || ''}</TableCell>
                                            <TableCell className="p-1 text-xs">{tx.peti || ''}</TableCell>
                                            <TableCell className="p-1 text-xs">{tx.dabba || ''}</TableCell>
                                            <TableCell className="p-1 text-xs text-right font-mono">{tx.grossSale?.toFixed(2) || ''}</TableCell>
                                            <TableCell className="p-1 text-xs text-right font-mono">{tx.expenses?.toFixed(2) || ''}</TableCell>
                                            <TableCell className="p-1 text-xs text-right font-mono font-bold">{tx.netSale?.toFixed(2) || ''}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {/* DEBIT SIDE */}
                        <div>
                            <h3 className="font-bold text-center mb-2">DEBIT</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="h-8 p-1 text-xs">Date</TableHead>
                                        <TableHead className="h-8 p-1 text-xs">Details of Remittance</TableHead>
                                        <TableHead className="h-8 p-1 text-xs text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {statementData.debitRows.map((tx, i) => (
                                         <TableRow key={`debit-${i}`} className="h-6">
                                            <TableCell className="p-1 text-xs">{tx.date ? new Date(tx.date).toLocaleDateString('en-GB') : ''}</TableCell>
                                            <TableCell className="p-1 text-xs">{tx.remittanceDetails || ''}</TableCell>
                                            <TableCell className="p-1 text-xs text-right font-mono">{tx.debitAmount?.toFixed(2) || ''}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                         {/* TOTALS */}
                        <Separator className="col-span-2 my-2" />
                        <div className="border-r pr-2">
                             <Table>
                                <TableBody>
                                    <TableRow className="h-6 font-bold">
                                        <TableCell className="p-1 text-xs" colSpan={2}>Total Credit</TableCell>
                                        <TableCell className="p-1 text-xs">{statementData.creditTotals.peti}</TableCell>
                                        <TableCell className="p-1 text-xs">{statementData.creditTotals.dabba}</TableCell>
                                        <TableCell className="p-1 text-xs text-right font-mono">{statementData.creditTotals.grossSale.toFixed(2)}</TableCell>
                                        <TableCell className="p-1 text-xs text-right font-mono">{statementData.creditTotals.expenses.toFixed(2)}</TableCell>
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

                        <Separator className="col-span-2 my-2" />
                         <CardFooter className="col-span-2 mt-4 p-4 bg-muted rounded-lg">
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
                                    <p className={`${statementData.balance >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        ₹{Math.abs(statementData.balance).toFixed(2)}
                                        <span className="text-xs ml-1">({statementData.balance >= 0 ? 'Payable' : 'Receivable'})</span>
                                    </p>
                                </div>
                            </div>
                        </CardFooter>

                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-12 print-hidden">
                        <p>No transactions found for the selected grower.</p>
                        <p className="text-sm">Start by creating sales or purchases, or select a different grower.</p>
                    </div>
                )}
            </CardContent>
        </Card>
        <AddNewFab />
    </>
  );
}
