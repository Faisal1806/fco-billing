'use client';

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
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, User, Eye, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Lottie from 'lottie-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import PageHeader from '@/components/PageHeader';
import { getBusinessDocuments } from '@/lib/actions';
import { BUSINESS_YEAR, getDocumentDateYear, parseDocumentDate } from '@/lib/document-utils';
import { useToast } from '@/hooks/use-toast';

type TransactionType = 'Sale' | 'Purchase' | 'Advance' | 'Repayment' | 'Bikri' | 'Discount';

type Ledger = {
    [partyName: string]: {
        balance: number;
        lastActivity: string | null;
        partyType: 'supplier' | 'customer' | 'both' | 'outside' | 'fco';
    }
}

const getCanonicalName = (name: string): string => {
    if (!name) return '';
    return name.trim();
};

export default function KhataDirectoryPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [ledgers, setLedgers] = React.useState<Ledger>({});
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(true);
    const [loaderAnimation, setLoaderAnimation] = React.useState(null);

    React.useEffect(() => {
        async function fetchLedgerData() {
            if (typeof window === 'undefined') return;
            setIsLoading(true);
            
            fetch('/animations/forms/fco_loader.json')
                .then(async (res) => {
                    if (!res.ok) throw new Error(`Loader fetch failed: ${res.status}`);
                    return res.json();
                })
                .then(setLoaderAnimation)
                .catch(() => setLoaderAnimation(null));

            const allTransactions: any[] = [];
            const partyTypes = new Map<string, Set<TransactionType>>();
            const partyNames = new Set<string>();

            const result = await getBusinessDocuments([
                'party-', 'invoice-', 'purchase-', 'supplier-purchase-', 'own-purchase-',
                'advance-', 'advances/', 'bikri-',
            ]);
            if (!result.success || !Array.isArray(result.data)) {
                throw new Error(result.error || 'Could not load ledger transactions.');
            }

            for (const doc of result.data) {
                const key = String(doc.key || '');
                if (key.startsWith('party-')) {
                    if (doc.name) partyNames.add(String(doc.name));
                    continue;
                }
                if (getDocumentDateYear(doc.date) !== BUSINESS_YEAR) continue;

                const activity: TransactionType | null =
                    key.startsWith('invoice-') ? 'Sale' :
                    key.startsWith('purchase-') || key.startsWith('supplier-purchase-') || key.startsWith('own-purchase-') ? 'Purchase' :
                    key.startsWith('advance-') || key.startsWith('advances/')
                        ? doc.type === 'Advance Given' ? 'Advance' : doc.type === 'Discount' ? 'Discount' : 'Repayment'
                        : key.startsWith('bikri-') ? 'Bikri' : null;
                const partyName = doc.customerName || doc.growerName || doc.supplierName ||
                    doc.partyName || (doc.market && doc.bikriType !== 'growerForwarding' ? doc.market : '');
                if (partyName) {
                    partyNames.add(String(partyName));
                    if (activity) {
                        const canonical = getCanonicalName(String(partyName));
                        if (!partyTypes.has(canonical)) partyTypes.set(canonical, new Set());
                        partyTypes.get(canonical)!.add(activity);
                    }
                }
                if (activity) {
                    allTransactions.push({ ...doc, id: doc.id || key });
                }
            }

            allTransactions.sort((a,b) =>
                (parseDocumentDate(a.date)?.getTime() ?? 0) -
                (parseDocumentDate(b.date)?.getTime() ?? 0)
            );
            
            const calculatedLedgers: Ledger = {};
            
            partyNames.forEach((partyName) => {
                 const canonicalName = getCanonicalName(partyName);
                 const activities = partyTypes.get(canonicalName) || new Set();
                 let partyType: 'supplier' | 'customer' | 'both' | 'outside' | 'fco';
                 
                 const hasSales = activities.has('Sale');
                 const hasPurchases = activities.has('Purchase');
                 const hasBikri = activities.has('Bikri');

                 if (partyName === 'F.Co (Own Stock)') {
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

                 let balance = 0;
                 let lastActivity: string | null = null;
                 
                 const partyTransactions = allTransactions.filter(tx => {
                     let txPartyName;
                     if(tx.customerName) txPartyName = tx.customerName;
                     else if (tx.growerName) txPartyName = tx.growerName;
                     else if (tx.partyName) txPartyName = tx.partyName;
                     else if (tx.market && tx.bikriType !== 'growerForwarding') txPartyName = tx.market;
                     
                     return txPartyName && getCanonicalName(txPartyName) === canonicalName;
                 });
                 
                 if(partyTransactions.length > 0) {
                     lastActivity = partyTransactions[partyTransactions.length - 1].date;
                 }

                 partyTransactions.forEach(tx => {
                    if (tx.totals) {
                        if (tx.totals.netSale !== undefined) balance += tx.totals.netSale; // Sale
                        if (tx.totals.grandTotal !== undefined || tx.totals.totalAmount !== undefined) balance -= tx.totals.grandTotal ?? tx.totals.totalAmount; // Purchase
                    } else if (tx.amount) {
                         if (tx.type === 'Advance Given') balance -= tx.amount;
                         else balance += tx.amount; // Repayment or Discount
                    } else if (tx.calculation && tx.calculation.netSalePayableToGrower !== undefined) {
                        balance += tx.calculation.netSalePayableToGrower; // Bikri
                    }
                 });
                 
                 calculatedLedgers[partyName] = { balance, lastActivity, partyType };
            });
            
            setLedgers(calculatedLedgers);
            setIsLoading(false);
        }
        void fetchLedgerData().catch(error => {
            console.error('Khata ledger load failed:', error);
            setLedgers({});
            setIsLoading(false);
            toast({
                variant: 'destructive',
                title: 'Khata Ledger Failed',
                description: error instanceof Error ? error.message : 'Could not load the 2026 ledger.',
            });
        });
    }, [toast]);

    const filteredParties = React.useMemo(() => {
        const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase();
        const query = normalize(searchTerm);

        return Object.entries(ledgers)
            .filter(([name]) => normalize(name).includes(query))
            .filter(([name, data]) => data.partyType === 'supplier' || data.partyType === 'both') // Only show growers
            .sort(([nameA], [nameB]) => nameA.localeCompare(nameB));
    }, [ledgers, searchTerm]);

    const handleViewStatement = (partyName: string) => {
        router.push(`/statement`);
    };

    return (
        <div className="space-y-6">
             <PageHeader
                title="Grower Khata Directory"
                description="A list of all growers with their current account balance. Click 'View Statement' to open the manual statement generator."
                icon={<BookOpen className="h-8 w-8" />}
                imageUrl="/assets/3d/khata.png"
            />
            <Card>
                <CardHeader>
                    <div className="pt-2">
                        <Input
                            placeholder="Search for a grower..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64 print-hidden">
                            {loaderAnimation && <Lottie animationData={loaderAnimation} loop={true} style={{ width: 100, height: 100 }} />}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Grower Name</TableHead>
                                    <TableHead>Last Activity</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredParties.length > 0 ? filteredParties.map(([name, data]) => {
                                    const balanceText = data.balance >= 0 ? 'Payable' : 'Receivable';
                                    const balanceColor = data.balance >= 0 ? 'text-red-500' : 'text-green-500';
                                    return (
                                        <motion.tr 
                                            key={name}
                                            className="hover:shadow-lg transition-shadow duration-300"
                                            whileHover={{ y: -5, scale: 1.02 }}
                                        >
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" /> {name}
                                            </TableCell>
                                            <TableCell>
                                                {data.lastActivity ? new Date(data.lastActivity).toLocaleDateString('en-GB') : 'N/A'}
                                            </TableCell>
                                            <TableCell className={`text-right font-mono font-semibold ${balanceColor}`}>
                                                ₹{Math.abs(data.balance).toFixed(2)}
                                                <Badge variant="outline" className="ml-2">{balanceText}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button onClick={() => handleViewStatement(name)} size="sm" className="gap-2">
                                                    <Eye className="h-4 w-4" />
                                                    View Statement
                                                </Button>
                                            </TableCell>
                                        </motion.tr>
                                    );
                                }) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">
                                            No growers found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
