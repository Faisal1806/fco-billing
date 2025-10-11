

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
import { Loader2, FileDown, User, Users, Plus, ChevronDown, Leaf, Printer, UserCheck, UserX, ShoppingCart, Banknote, Building, Globe, TrendingUp } from 'lucide-react';
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

type PartyType = 'supplier' | 'customer' | 'both' | 'outside' | 'fco';

type Ledger = {
    [canonicalPartyName: string]: {
        transactions: Transaction[];
        balance: number;
        partyType: PartyType;
        displayName: string; 
    }
}

type LedgerEntryWithRunningBalance = Transaction & { runningBalance: number };

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

            const allTransactions: Transaction[] = [];
            const partyTypes = new Map<string, Set<TransactionType>>();
            const partyDisplayNameMap = new Map<string, string>();

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
                        allTransactions.push({ id: `sale-${doc.sNo}`, date: doc.date, type: 'Sale', amount: doc.totals.netSale, grossAmount: doc.totals.grossSale, expenses: doc.totals.totalExpenses, party: doc.customerName, docId: doc.id });
                    } else if (key.startsWith('purchase-')) {
                        const doc = JSON.parse(localStorage.getItem(key)!);
                        recordPartyActivity(doc.growerName, 'Purchase');
                        allTransactions.push({ id: `purchase-${doc.billNo}`, date: doc.date, type: 'Purchase', amount: doc.totals.grandTotal, grossAmount: doc.totals.grandTotal, expenses: 0, party: doc.growerName, docId: doc.billNo });
                    } else if (key.startsWith('advance-')) {
                        const doc = JSON.parse(localStorage.getItem(key)!);
                        const type = doc.type === 'Advance Given' ? 'Advance' : 'Repayment';
                        recordPartyActivity(doc.partyName, type);
                        allTransactions.push({ id: doc.id, date: doc.date, type, amount: doc.amount, grossAmount: doc.amount, expenses: 0, party: doc.partyName, docId: doc.id.replace('advance-',''), notes: doc.notes });
                    } else if (key.startsWith('bikri-')) {
                        const doc = JSON.parse(localStorage.getItem(key)!);
                        recordPartyActivity(doc.market, 'Bikri');
                        allTransactions.push({ id: doc.id, date: doc.date, type: 'Bikri', amount: doc.calculation.netProfitOrLoss, grossAmount: doc.calculation.grossSale, expenses: doc.calculation.totalExpenses, party: doc.market, docId: doc.id.replace('bikri-',''), notes: `Bikri #${doc.bikriNo}` });
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
                 const hasAdvances = activities.has('Advance') || activities.has('Repayment');
                 const hasBikri = activities.has('Bikri');

                 if (displayName === 'F.Co (Own Stock)') {
                     partyType = 'fco';
                 } else if (hasBikri) {
                     partyType = 'outside';
                 } else if (hasSales && (hasPurchases || hasAdvances)) {
                     partyType = 'both';
                 } else if (hasSales) {
                     partyType = 'supplier'; // Grower is a supplier to us
                 } else if (hasPurchases || hasAdvances) {
                     partyType = 'customer'; // Customer is who we purchase for, or give advances to
                 } else {
                     partyType = 'customer'; // Default for parties with no txns
                 }

                 calculatedLedgers[displayName] = { 
                    transactions: [], 
                    balance: 0, 
                    partyType: partyType,
                    displayName: displayName
                };
            });

            for (const trans of allTransactions) {
                if (!trans.party) continue;
                
                const foundKey = Array.from(partyDisplayNameMap.keys()).find(k => getCanonicalName(trans.party) === k);
                const displayName = foundKey ? partyDisplayNameMap.get(foundKey) : trans.party;
                
                if (calculatedLedgers[displayName]) {
                    calculatedLedgers[displayName].transactions.push(trans);
                } else if (displayName) {
                    // This is a fallback for a party that somehow wasn't pre-populated.
                    calculatedLedgers[displayName] = {
                        transactions: [trans],
                        balance: 0,
                        partyType: 'customer',
                        displayName: displayName
                    };
                }
            }
            
            Object.keys(calculatedLedgers).forEach(partyKey => {
                let runningBalance = 0;
                const partyType = calculatedLedgers[partyKey].partyType;

                calculatedLedgers[partyKey].transactions.forEach(trans => {
                    let amount = trans.amount;

                    if (partyType === 'supplier') { // Grower
                        if (trans.type === 'Sale') runningBalance += amount; // We owe them for their produce (Credit)
                        else if (trans.type === 'Advance' || trans.type === 'Repayment' || trans.type === 'Purchase') runningBalance -= amount; // We paid them, so our debt decreases (Debit)
                    } else if (partyType === 'customer') { // Buyer / Loanee
                         if (trans.type === 'Purchase' || trans.type === 'Advance') runningBalance += amount; // They owe us for goods/cash (Debit)
                         else if (trans.type === 'Sale' || trans.type === 'Repayment') runningBalance -= amount; // They paid us, so their debt decreases (Credit)
                    } else if (partyType === 'outside') { // Bikri Party
                        runningBalance += amount; // Profit is receivable, loss is payable
                    } else if (partyType === 'fco') {
                        if (trans.type === 'Purchase') runningBalance += amount; // Asset value increases
                    }
                    else { // 'both' type
                         if (trans.type === 'Sale') runningBalance += amount; // Owed to them as grower (Credit)
                         else if (trans.type === 'Purchase' || trans.type === 'Advance') runningBalance -= amount; // They owe us as customer (Debit)
                         else if (trans.type === 'Repayment') runningBalance +=amount; // They paid us back, our asset (their debt) decreases. But contextually this is their debt reducing. So this is also a debit from their perspective, but a credit to our cash. Let's treat it as reducing their due.
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
        const filterAndSetParties = () => {
            const parties = allParties.filter(p => {
                if (!p) return false;
                const ledger = ledgers[p];
                if (!ledger) return false;

                switch (activeTab) {
                    case 'growers': return ledger.partyType === 'supplier' || ledger.partyType === 'both';
                    case 'customers': return ledger.partyType === 'customer' || ledger.partyType === 'both';
                    case 'outside': return ledger.partyType === 'outside';
                    case 'fco': return ledger.partyType === 'fco';
                    case 'all': return true;
                    default: return false;
                }
            });

            setFilteredParties(parties);
            if (parties.length > 0) {
                if (!selectedParty || !parties.includes(selectedParty)) {
                  setSelectedParty(parties[0]);
                }
            } else {
                setSelectedParty(null);
            }
        };
        
        if (!isLoading) {
            filterAndSetParties();
        }
    }, [activeTab, allParties, ledgers, isLoading, selectedParty]);

    const selectedLedger = selectedParty ? ledgers[selectedParty] : null;

    const navigateToDoc = (type: TransactionType, docId: string) => {
        let path = '';
        if (type === 'Sale') path = `/invoice/${docId}`;
        else if (type === 'Purchase') path = `/purchase-bill/${docId}`;
        else if (type === 'Advance' || type === 'Repayment') path = '/advances';
        else if (type === 'Bikri') path = `/bikri-bill/${docId.replace('bikri-','')}`;
        
        if (path) router.push(path);
    };

    const getLedgerWithRunningBalance = (): LedgerEntryWithRunningBalance[] => {
        if (!selectedLedger) return [];
        let runningBalance = 0;
        return selectedLedger.transactions.map(tx => {
            const partyType = selectedLedger.partyType;
            let amount = tx.amount;

            if (partyType === 'supplier') {
                if (tx.type === 'Sale') runningBalance += amount;
                else if (['Purchase', 'Advance', 'Repayment'].includes(tx.type)) runningBalance -= amount;
            } else if (partyType === 'customer') {
                if (['Purchase', 'Advance'].includes(tx.type)) runningBalance += amount;
                else if (['Sale', 'Repayment'].includes(tx.type)) runningBalance -= amount;
            } else if (partyType === 'outside') {
                runningBalance += amount;
            } else if (partyType === 'fco') {
                if (tx.type === 'Purchase') runningBalance += amount;
            } else { // 'both'
                if (tx.type === 'Sale') runningBalance += amount; // We owe them (credit)
                else if (tx.type === 'Purchase' || tx.type === 'Advance') runningBalance -= amount; // They owe us (debit)
                else if (tx.type === 'Repayment') runningBalance += amount; // They paid us back, so what we are owed decreases. But this is confusing. Let's stick to their view. If they repay, their debt to us reduces.
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
            head: [['Date', 'Doc ID / Particulars', 'Type', 'Debit (Payable)', 'Credit (Receivable)', 'Balance']],
            body: ledgerForExport.map(tx => {
                const partyType = selectedLedger.partyType;
                let isCredit = false;
                 if (partyType === 'supplier') isCredit = tx.type === 'Sale';
                 else if (partyType === 'customer') isCredit = tx.type === 'Repayment' || tx.type === 'Sale';
                 else if (partyType === 'outside') isCredit = tx.amount >= 0;
                 else if (partyType === 'both') isCredit = tx.type === 'Sale' || tx.type === 'Repayment';
                 else isCredit = tx.type === 'Sale' || tx.type === 'Repayment';

                return [
                    new Date(tx.date).toLocaleDateString('en-GB'),
                    tx.notes || (tx.type === 'Sale' ? `Bill #${tx.docId}` : tx.type === 'Purchase' ? `Purchase #${tx.docId}` : tx.type),
                    tx.type,
                    !isCredit ? `₹${Math.abs(tx.amount).toFixed(2)}` : '-',
                    isCredit ? `₹${tx.amount.toFixed(2)}` : '-',
                    `₹${tx.runningBalance.toFixed(2)}`
                ]
            }),
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

        const worksheetData = ledgerForExport.map(tx => {
            const partyType = selectedLedger.partyType;
            let isCredit = false;
            if (partyType === 'supplier') isCredit = tx.type === 'Sale';
            else if (partyType === 'customer') isCredit = tx.type === 'Repayment' || tx.type === 'Sale';
            else if (partyType === 'outside') isCredit = tx.amount >= 0;
            else if (partyType === 'both') isCredit = tx.type === 'Sale' || tx.type === 'Repayment';
            else isCredit = tx.type === 'Sale' || tx.type === 'Repayment';

            return {
                Date: new Date(tx.date).toLocaleDateString('en-GB'),
                'Document ID': tx.docId,
                'Particulars (Original Name)': tx.party,
                Type: tx.type,
                'Debit (Payable)': !isCredit ? Math.abs(tx.amount) : '',
                'Credit (Receivable)': isCredit ? tx.amount : '',
                'Running Balance': tx.runningBalance,
                'Notes': tx.notes || '',
            }
        });
        
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
        if (type === 'outside') return <Globe className="h-4 w-4 mr-2 text-orange-500" />;
        if (type === 'fco') return <Building className="h-4 w-4 mr-2 text-gray-500" />;
        return <Users className="h-4 w-4 mr-2 text-purple-500" />;
    };
    
    const totals = React.useMemo(() => {
        if (!selectedLedger) return { debit: 0, credit: 0 };
        return selectedLedger.transactions.reduce((acc, tx) => {
            const partyType = selectedLedger.partyType;
            let isCredit = false;
            if (partyType === 'supplier') isCredit = tx.type === 'Sale';
            else if (partyType === 'customer') isCredit = tx.type === 'Repayment' || tx.type === 'Sale';
            else if (partyType === 'outside') isCredit = tx.amount >= 0;
            else if (partyType === 'both') isCredit = tx.type === 'Sale' || tx.type === 'Repayment';
            else isCredit = tx.type === 'Sale' || tx.type === 'Repayment';

             if (isCredit) {
                acc.credit += tx.amount;
            } else {
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
    
    const TransactionIcon = ({ type }: { type: TransactionType }) => {
        switch (type) {
            case 'Sale': return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'Purchase': return <ShoppingCart className="h-4 w-4 text-blue-500" />;
            case 'Advance': return <Banknote className="h-4 w-4 text-red-500" />;
            case 'Repayment': return <Banknote className="h-4 w-4 text-green-500" />;
            case 'Bikri': return <Globe className="h-4 w-4 text-orange-500" />;
            default: return <Users className="h-4 w-4" />;
        }
    }

    const FinalBalanceDisplay = () => {
        if (!selectedLedger) return null;

        const partyType = selectedLedger.partyType;
        let balanceText: string;
        let balanceColor: string;
        
        if (partyType === 'supplier') { // Grower
            balanceText = selectedLedger.balance >= 0 ? '(You Owe / Payable)' : '(Advance Paid)';
            balanceColor = selectedLedger.balance >= 0 ? 'text-red-500' : 'text-green-500';
        } else if (partyType === 'customer') { // Buyer
            balanceText = selectedLedger.balance >= 0 ? '(Receivable)' : '(Credit Balance)';
            balanceColor = selectedLedger.balance >= 0 ? 'text-green-500' : 'text-red-500';
        } else if (partyType === 'outside') {
             balanceText = selectedLedger.balance >= 0 ? '(Profit Receivable)' : '(Loss Payable)';
            balanceColor = selectedLedger.balance >= 0 ? 'text-green-500' : 'text-red-500';
        }
        else if (partyType === 'fco') {
            balanceText = '(Own Stock Value)';
            balanceColor = 'text-blue-500';
        }
        else { // both
             balanceText = selectedLedger.balance >= 0 ? '(Payable)' : '(Receivable)';
             balanceColor = selectedLedger.balance >= 0 ? 'text-red-500' : 'text-green-500';
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
                                <TableHead className="text-right">Debit (You Paid / They Owe)</TableHead>
                                <TableHead className="text-right">Credit (You Received / You Owe)</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {getLedgerWithRunningBalance().map((tx) => {
                                const partyType = selectedLedger.partyType;
                                let isCredit = false;
                                if (partyType === 'supplier') { // Grower
                                    isCredit = tx.type === 'Sale';
                                } else if (partyType === 'customer') { // Buyer
                                    isCredit = tx.type === 'Repayment' || tx.type === 'Sale';
                                } else if (partyType === 'outside') { // Bikri
                                    isCredit = tx.amount >= 0; // Profit is a credit
                                } else if (partyType === 'fco') {
                                    isCredit = tx.type === 'Purchase'; // Purchase for FCo is a credit to our stock value
                                } else { // Both
                                    isCredit = tx.type === 'Sale';
                                }
                                
                                return (
                                <TableRow key={tx.id}>
                                    <TableCell>{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                                    <TableCell>
                                        <Button variant="link" className="p-0 h-auto print-hidden" onClick={() => navigateToDoc(tx.type, tx.docId)}>
                                            {tx.notes || (tx.type === 'Sale' ? `Bill #${tx.docId}` : tx.type === 'Purchase' ? `Purchase #${tx.docId}` : tx.type)}
                                        </Button>
                                        <span className="hidden print:inline">{tx.notes || (tx.type === 'Sale' ? `Bill #${tx.docId}` : tx.type === 'Purchase' ? `Purchase #${tx.docId}` : tx.type)}</span>
                                        <p className="text-xs text-muted-foreground hidden print:block">({tx.party})</p>
                                    </TableCell>
                                    <TableCell>
                                    <Badge variant={getBadgeVariant(tx.type)} className="gap-1.5"><TransactionIcon type={tx.type} />{tx.type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-red-500">
                                        {!isCredit ? `₹${Math.abs(tx.amount).toFixed(2)}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-green-600">
                                        {isCredit ? `₹${Math.abs(tx.amount).toFixed(2)}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">₹{tx.runningBalance.toFixed(2)}</TableCell>
                                </TableRow>
                            )})}
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
                        <p>No transactions found for the selected category or party.</p>
                        <p className="text-sm">Start by creating sales or purchases, or select a different category.</p>
                    </div>
                )}
            </CardContent>
        </Card>
        <AddNewFab />
    </>
  );
}
