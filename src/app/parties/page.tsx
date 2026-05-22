
'use client'

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlusCircle, Edit, Trash2, Users, Search, FileDown, Loader2, Leaf, ShoppingCart, Handshake, Award, Star, TrendingUp, CalendarDays, Gift, ListChecks, Info, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveDocument, deleteDocument } from '@/lib/actions';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/PageHeader';


const PARTY_STORAGE_PREFIX = 'party-';

interface Party {
  id: string; 
  name: string;
  type: 'Grower' | 'Customer' | 'Outside Party' | 'Both' | 'Both (Outside & Customer)';
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  creditLimit?: number;
}

const emptyFormState: Omit<Party, 'id'> = {
    name: '',
    type: 'Grower',
    address: '',
    phone: '',
    email: '',
    notes: '',
    creditLimit: 0,
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
    { name: 'Mohd. Akbar Lone (Lama)', address: 'R/o Nadihal Bla.' },
    { name: 'Jaana ® B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Rayees Rajab ®', address: 'R/o Nadihal Bla.' },
    { name: 'Hilal Ahmad Wani', address: 'R/o Nadihal Bla.' },
    { name: 'Javid Ahmad Sheikh', address: 'R/o Shanoo, Mawer Handwara' },
    { name: 'Manzoor Ah. Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Ashraf wani', address: 'R/o Nadihal Bla.' },
    { name: 'Bashir Ah. Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Yousuf Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Farooq Ahmad Lone (Lama)', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohiuddin Lone (H)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd Yousuf Lone (Waza)', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Nabi Lone', address: 'R/o Nadihal Bla.' },
    { name: 'Farooq Ahmad Bhat', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Nabi Wani', address: 'R/o Nadihal Bla.' }
];

const getCanonicalName = (name: string): string => {
    if (!name) return '';
    return name.trim();
};

const PartyTypeIcon = ({ type }: { type: Party['type'] }) => {
    if (type === 'Grower') return <Leaf className="h-8 w-8 text-green-400" />;
    if (type === 'Customer') return <ShoppingCart className="h-8 w-8 text-blue-400" />;
    if (type === 'Outside Party') return <Handshake className="h-8 w-8 text-orange-400" />;
    if (type === 'Both (Outside & Customer)') return <Users className="h-8 w-8 text-cyan-400" />;
    return <Users className="h-8 w-8 text-purple-400" />;
};


export default function PartiesPage() {
  const { toast } = useToast();
  const [parties, setParties] = useState<Party[]>([]);
  const [partyStats, setPartyStats] = useState<{[key: string]: any}>({});
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [formState, setFormState] = useState<Party | Omit<Party, 'id'>>(emptyFormState);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchPartiesAndTransactions = () => {
    setIsLoading(true);
    const partiesMap = new Map<string, Party>();
    const localPartyStats = new Map<string, any>();

    const addOrUpdateParty = (name: string, details: Partial<Party> = {}) => {
        if (!name) return;
        const canonical = getCanonicalName(name);
        if (!partiesMap.has(canonical)) {
            partiesMap.set(canonical, {
                id: `${PARTY_STORAGE_PREFIX}${canonical}`,
                name: name,
                type: 'Grower',
                ...details,
            } as Party);
        } else {
             const existingParty = partiesMap.get(canonical)!;
             partiesMap.set(canonical, { ...existingParty, ...details });
        }
    };

    defaultGrowers.forEach(g => addOrUpdateParty(g.name, { address: g.address, type: 'Grower' }));

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(PARTY_STORAGE_PREFIX)) {
            try {
                const party: Party = JSON.parse(localStorage.getItem(key)!);
                addOrUpdateParty(party.name, party);
            } catch (e) { console.error("Error parsing party:", e); }
        }
    }
    
    const allTransactions: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        const prefixes = ['invoice-', 'purchase-', 'advance-', 'bikri-'];
        const matchingPrefix = prefixes.find(p => key.startsWith(p));

        if (matchingPrefix) {
             try {
                const tx = JSON.parse(localStorage.getItem(key)!);
                if (!tx.id) tx.id = key;
                allTransactions.push(tx);
             } catch(e) { console.error("Failed to parse transaction:", key, e)}
        }
    }
    
    allTransactions.forEach(tx => {
        if(!tx.id && !tx.billNo && !tx.sNo) return;
        let partyName;
        if (tx.customerName) partyName = tx.customerName;
        else if (tx.growerName) partyName = tx.growerName;
        else if (tx.partyName) partyName = tx.partyName;
        else if (tx.market && tx.bikriType !== 'growerForwarding') partyName = tx.market;

        if (partyName) {
            addOrUpdateParty(partyName);
        }
    });

    partiesMap.forEach((party, canonical) => {
        const stats = { balance: 0, netSales: 0, lastActivityDate: null, transactionCount: 0, loyaltyPoints: 0, tier: 'Bronze', lastRedemptionDate: null, creditUsed: 0 };
        const partyTransactions = allTransactions
            .filter(t => {
                if(!t.id && !t.billNo && !t.sNo) return false;
                let partyName;
                if (t.customerName) partyName = t.customerName;
                else if (t.growerName) partyName = t.growerName;
                else if (t.partyName) partyName = t.partyName;
                else if (t.market && t.bikriType !== 'growerForwarding') partyName = t.market;
                
                return partyName && getCanonicalName(partyName) === canonical;
            });
        
        partyTransactions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (partyTransactions.length > 0) {
            stats.lastActivityDate = partyTransactions[partyTransactions.length - 1].date;
        }
        stats.transactionCount = partyTransactions.length;

        partyTransactions.forEach(tx => {
            let saleAmount = 0;
            const txId = tx.id || tx.billNo || tx.sNo;
            if (txId.startsWith('invoice-')) { 
                const sale = tx.totals?.netSale || 0;
                stats.balance += sale;
                saleAmount = sale;
            } else if (txId.startsWith('purchase-')) {
                stats.balance -= tx.totals?.grandTotal || 0;
            } else if (txId.startsWith('advance-')) {
                if (tx.type === 'Advance Given') {
                    stats.balance -= tx.amount || 0;
                } else { // Repayment or Discount
                    stats.balance += tx.amount || 0;
                }
                 if (tx.type === 'Discount') {
                    stats.lastRedemptionDate = tx.date; 
                }
            } else if (txId.startsWith('bikri-')) {
                if (tx.bikriType === 'growerForwarding' && tx.growerName && getCanonicalName(tx.growerName) === canonical) {
                    const payable = tx.calculation?.netSalePayableToGrower || 0;
                    stats.balance += payable;
                    saleAmount = payable;
                } else if (party.type === 'Outside Party' && tx.bikriType === 'fcoStock'){ 
                    stats.balance += tx.calculation?.netProfitOrLoss || 0;
                }
            }
            stats.netSales += saleAmount;
        });

        if (stats.netSales > 150000) {
            stats.tier = 'Gold';
            stats.loyaltyPoints = Math.floor(stats.netSales * 0.02);
        } else if (stats.netSales > 50000) {
            stats.tier = 'Silver';
            stats.loyaltyPoints = Math.floor(stats.netSales * 0.015);
        } else {
            stats.tier = 'Bronze';
            stats.loyaltyPoints = Math.floor(stats.netSales * 0.01);
        }

        if (stats.balance > 0) {
            stats.creditUsed = stats.balance;
        }
        
        localPartyStats.set(canonical, stats);
    });

    const statsObject: { [key: string]: any } = {};
    localPartyStats.forEach((value, key) => { statsObject[key] = value; });

    setParties(Array.from(partiesMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    setPartyStats(statsObject);
    setIsLoading(false);
  };
  
  useEffect(() => {
    if (isMounted) {
        setUserRole(localStorage.getItem('userRole'));
        fetchPartiesAndTransactions();
    }
  }, [isMounted]);

  const filteredParties = useMemo(() => {
    return parties
        .filter(p => {
            if (activeTab === 'all') return true;
            if (activeTab === 'growers') return p.type === 'Grower' || p.type === 'Both';
            if (activeTab === 'customers') return p.type === 'Customer' || p.type === 'Both' || p.type === 'Both (Outside & Customer)';
            if (activeTab === 'outside') return p.type === 'Outside Party' || p.type === 'Both (Outside & Customer)';
            return true;
        })
        .filter(p => {
            const lowerCaseSearch = searchTerm.toLowerCase();
            return p.name.toLowerCase().includes(lowerCaseSearch) || (p.phone && p.phone.includes(lowerCaseSearch));
        });
  }, [parties, searchTerm, activeTab]);

  const resetForm = () => setFormState(emptyFormState);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? Number(value) : value;
    setFormState(prev => ({...prev, [name]: val}));
  };
  
  const handleSelectChange = (name: keyof Omit<Party, 'id'>, value: string) => {
    setFormState(prev => ({...prev, [name]: value as Party['type']}));
  }

  const handleSaveParty = () => {
    if (!formState.name) {
      toast({ variant: 'destructive', title: 'Missing Name' });
      return;
    }

    const id = 'id' in formState ? formState.id : `${PARTY_STORAGE_PREFIX}${getCanonicalName(formState.name)}`;
    const newParty: Party = { id, ...(formState as Omit<Party, 'id'>) };

    localStorage.setItem(id, JSON.stringify(newParty));
    toast({ title: 'id' in formState ? 'Party Updated' : 'Party Added' });
    
    fetchPartiesAndTransactions();
    resetForm();
    setIsFormDialogOpen(false);
  };
  
  const handleRowClick = (party: Party) => {
    setSelectedParty(party);
    setIsProfileDialogOpen(true);
  };
  
  const handleDeleteParty = (id: string) => {
    if(userRole !== 'admin') {
      toast({ variant: 'destructive', title: 'Permission Denied' });
      return;
    }
    if (!window.confirm('Are you sure you want to delete this party? Associated transactions will NOT be deleted.')) return;
    localStorage.removeItem(id);
    toast({ title: 'Party Deleted' });
    fetchPartiesAndTransactions();
  }
  
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Parties Master Directory", 14, 15);
    autoTable(doc, {
        head: [['S.No.', 'Name', 'Type', 'Phone', 'Address', 'Balance', 'Net Sales']],
        body: filteredParties.map((p, index) => [
            index + 1,
            p.name,
            p.type,
            p.phone || '',
            p.address || '',
            (partyStats[getCanonicalName(p.name)]?.balance || 0).toFixed(2),
            (partyStats[getCanonicalName(p.name)]?.netSales || 0).toFixed(2),
        ]),
    });
    doc.save("parties-directory.pdf");
  };

  const exportToExcel = () => {
      const ws = XLSX.utils.json_to_sheet(filteredParties.map((p, index) => ({
          'S.No.': index + 1,
          'Name': p.name,
          'Type': p.type,
          'Phone': p.phone,
          'Address': p.address,
          'Email': p.email,
          'Notes': p.notes,
          'Balance': partyStats[getCanonicalName(p.name)]?.balance || 0,
          'Net Sales': partyStats[getCanonicalName(p.name)]?.netSales || 0,
          'Loyalty Points': partyStats[getCanonicalName(p.name)]?.loyaltyPoints || 0,
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Parties");
      XLSX.writeFile(wb, "parties-directory.xlsx");
  };

  const PartyCard = ({ party }: { party: Party }) => {
    const stats = partyStats[getCanonicalName(party.name)];
    if (!stats) return null;

    const [isFlipped, setIsFlipped] = useState(false);

    const balance = stats.balance || 0;
    const netSales = stats.netSales || 0;

    let balanceText, balanceColor;
    if (party.type === 'Grower' || party.type === 'Both') {
        balanceText = balance >= 0 ? 'Payable' : 'Advance';
        balanceColor = balance >= 0 ? 'text-red-400' : 'text-green-400';
    } else {
        balanceText = balance >= 0 ? 'Receivable' : 'Credit';
        balanceColor = balance >= 0 ? 'text-green-400' : 'text-red-400';
    }
    
    const tier = stats?.tier || 'Bronze';
    const tierIcon = tier === 'Gold' ? '🥇' : tier === 'Silver' ? '🥈' : '🥉';

    return (
        <div
            className="w-full h-48 [perspective:1000px]"
            onMouseEnter={() => setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
            onClick={() => handleRowClick(party)}
        >
            <motion.div
                className="relative w-full h-full [transform-style:preserve-3d] cursor-pointer"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
                <div className="absolute w-full h-full [backface-visibility:hidden] bg-card/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                    <div>
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-lg leading-tight text-primary-foreground">{party.name}</h3>
                            <PartyTypeIcon type={party.type} />
                        </div>
                        <p className="text-xs text-muted-foreground">{party.address}</p>
                    </div>
                     <div className="flex justify-between items-end">
                        <p className="text-sm font-semibold">{party.phone}</p>
                        <p className="text-2xl font-bold" title={`${tier} Tier`}>{tierIcon}</p>
                    </div>
                </div>

                <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-card/80 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-xl">
                    <h4 className="font-bold text-lg text-primary-foreground">Financials</h4>
                    <Separator className="my-2 bg-white/10" />
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{balanceText}</p>
                        <p className={`text-2xl font-bold font-mono ${balanceColor}`}>
                            {balance >= 0 ? '₹' : '-₹'}{Math.abs(balance).toLocaleString('en-IN', {maximumFractionDigits: 0})}
                        </p>
                    </div>
                     <div className="mt-2 space-y-1">
                        <p className="text-xs text-muted-foreground">YTD Net Sales</p>
                        <p className="font-semibold font-mono text-primary-foreground">₹{netSales.toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
  };
  
  if (!isMounted) return null;

  return (
    <div className="space-y-6">
        <PageHeader
            title="Parties Master Directory"
            description="Manage your Growers, Customers, and Outside Parties from a single intelligence center."
            icon={<Users className="h-8 w-8" />}
            imageUrl="/assets/3d/users.png"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
                <TabsList className="bg-card/60 backdrop-blur-sm border-white/10">
                    <TabsTrigger value="all">All Parties</TabsTrigger>
                    <TabsTrigger value="growers">Growers</TabsTrigger>
                    <TabsTrigger value="customers">Customers</TabsTrigger>
                    <TabsTrigger value="outside">Outside Parties</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search names or phone..."
                            className="pl-8 sm:w-[200px] lg:w-[250px] bg-card/60 border-white/10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={exportToPDF} variant="outline" size="sm" className="gap-1"><FileDown className="h-4 w-4"/>PDF</Button>
                    <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-1"><FileDown className="h-4 w-4"/>Excel</Button>
                    <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => {
                        setIsFormDialogOpen(isOpen);
                        if (!isOpen) resetForm();
                    }}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-1 bg-primary">
                        <PlusCircle className="h-3.5 w-3.5" />
                        Add Party
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                        <DialogTitle>{'id' in formState ? 'Edit Party' : 'Add New Party'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="name">Name (M/s)</Label>
                                <Input id="name" name="name" value={formState.name} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select name="type" value={formState.type} onValueChange={(v: Party['type']) => handleSelectChange('type', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Grower">Grower (Supplier)</SelectItem>
                                        <SelectItem value="Customer">Customer (Buyer)</SelectItem>
                                        <SelectItem value="Outside Party">Outside Party (Labour/Transport)</SelectItem>
                                        <SelectItem value="Both">Both (Grower & Customer)</SelectItem>
                                        <SelectItem value="Both (Outside & Customer)">Both (Outside & Customer)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone / WhatsApp</Label>
                                <Input id="phone" name="phone" value={p.phone || ''} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" name="address" value={formState.address || ''} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="notes">Notes / Details</Label>
                                <Textarea id="notes" name="notes" value={formState.notes || ''} onChange={handleInputChange} />
                            </div>
                            </div>
                        </div>
                        <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleSaveParty}>Save Party Record</Button>
                        </DialogFooter>
                    </DialogContent>
                    </Dialog>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab + searchTerm}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {filteredParties.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredParties.map(party => (
                            <PartyCard key={party.id} party={party} />
                        ))}
                        </div>
                    ) : (
                    <div className="text-center py-24 text-muted-foreground border-2 border-dashed rounded-xl bg-card/40 border-white/10">
                        <Users className="mx-auto h-16 w-16 opacity-20" />
                        <h3 className="mt-4 text-xl font-semibold">No parties found in this category.</h3>
                        <p className="mt-1">Try adjusting your search or adding a new record.</p>
                    </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </Tabs>

        {/* Profile Dialog */}
        {selectedParty && (
            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                <DialogContent className="max-w-2xl bg-card/90 backdrop-blur-md border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-3xl flex items-center gap-3">
                            {selectedParty.name} 
                            <Badge variant="outline" className="bg-primary/10">{selectedParty.type}</Badge>
                        </DialogTitle>
                        <p className="text-muted-foreground">{selectedParty.address} &bull; {selectedParty.phone}</p>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="md:col-span-2 bg-black/20 border-white/5">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2 text-primary">
                                        <Info className="h-5 w-5" /> Account Statistics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Total Life-time Sales</span>
                                        <span className="text-xl font-bold font-mono">₹{partyStats[getCanonicalName(selectedParty.name)]?.netSales?.toLocaleString()}</span>
                                    </div>
                                    <Separator className="bg-white/5" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Current Outstanding</span>
                                        <span className={`text-2xl font-black font-mono ${partyStats[getCanonicalName(selectedParty.name)]?.balance >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                                            ₹{Math.abs(partyStats[getCanonicalName(selectedParty.name)]?.balance || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-right uppercase tracking-widest text-muted-foreground opacity-50">
                                        Last Activity: {partyStats[getCanonicalName(selectedParty.name)]?.lastActivityDate ? new Date(partyStats[getCanonicalName(selectedParty.name)].lastActivityDate).toLocaleDateString() : 'N/A'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-black/20 border-white/5">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2 text-yellow-400">
                                        <Award className="h-5 w-5" /> Loyalty
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center space-y-2">
                                    <p className="text-3xl font-black">{partyStats[getCanonicalName(selectedParty.name)]?.loyaltyPoints?.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-tighter">Season Points</p>
                                    <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-500/50">{partyStats[getCanonicalName(selectedParty.name)]?.tier} Tier</Badge>
                                </CardContent>
                            </Card>
                        </div>
                        
                        {selectedParty.notes && (
                            <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                                <p className="text-sm font-semibold mb-1 opacity-70">Internal Notes:</p>
                                <p className="text-sm text-muted-foreground italic">"{selectedParty.notes}"</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => { setFormState(selectedParty); setIsFormDialogOpen(true); setIsProfileDialogOpen(false); }}>
                            <Edit className="h-4 w-4 mr-2" /> Edit Details
                        </Button>
                        {userRole === 'admin' && (
                            <Button variant="destructive" onClick={() => { handleDeleteParty(selectedParty.id); setIsProfileDialogOpen(false); }}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Record
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
    </div>
  );
}

