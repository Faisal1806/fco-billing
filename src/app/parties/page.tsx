
'use client'

import React, { useState, useEffect, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { PlusCircle, Edit, Trash2, Users, Search, FileDown, Loader2, Leaf, ShoppingCart, Handshake, Award, Star, TrendingUp, CalendarDays, Gift, ListChecks } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveDocument, deleteDocument } from '@/lib/actions';


const PARTY_STORAGE_PREFIX = 'party-';

interface Party {
  id: string; // Unique ID, can be derived from name for existing, or new for added
  name: string;
  type: 'Grower' | 'Customer' | 'Both' | 'Outside Party' | 'Both (Outside & Customer)';
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

const emptyFormState: Omit<Party, 'id'> = {
    name: '',
    type: 'Grower',
    address: '',
    phone: '',
    email: '',
    notes: '',
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

const getCanonicalName = (name: string): string => {
    if (!name) return '';
    return name.trim();
};


export default function PartiesPage() {
  const { toast } = useToast();
  const [parties, setParties] = useState<Party[]>([]);
  const [partyStats, setPartyStats] = useState<{[key: string]: any}>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [formState, setFormState] = useState<Party | Omit<Party, 'id'>>(emptyFormState);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

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
        }
    };

    defaultGrowers.forEach(g => addOrUpdateParty(g.name, { address: g.address, type: 'Grower' }));

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(PARTY_STORAGE_PREFIX)) {
            try {
                const party: Party = JSON.parse(localStorage.getItem(key)!);
                const canonical = getCanonicalName(party.name);
                partiesMap.set(canonical, party);
            } catch (e) { console.error("Error parsing party:", e); }
        }
    }
    
    const allTransactions: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if(key?.startsWith('invoice-') || key?.startsWith('purchase-') || key?.startsWith('advance-') || key?.startsWith('bikri-')) {
             try {
                const tx = JSON.parse(localStorage.getItem(key)!);
                 if (tx.id) { // Ensure transaction has an ID
                    allTransactions.push(tx);
                 }
             } catch(e) { console.error("Failed to parse transaction:", key, e)}
        }
    }

    partiesMap.forEach((party, canonical) => {
        const stats = { balance: 0, netSales: 0, lastActivityDate: null, transactionCount: 0, loyaltyPoints: 0 };
        const partyTransactions = allTransactions
            .filter(t => {
                const partyName = t.customerName || t.growerName || t.partyName || t.market;
                return partyName && getCanonicalName(partyName) === canonical;
            });
        
        partyTransactions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (partyTransactions.length > 0) {
            stats.lastActivityDate = partyTransactions[partyTransactions.length - 1].date;
        }
        stats.transactionCount = partyTransactions.length;

        partyTransactions.forEach(tx => {
            if (!tx.id) return;
            let netSale = 0;
            if (tx.id.startsWith('invoice-')) { // Sale to a grower
                stats.balance += tx.totals.netSale;
                netSale = tx.totals.netSale;
            } else if (tx.id.startsWith('purchase-')) { // Purchase from a customer
                stats.balance -= tx.totals.grandTotal;
                netSale = tx.totals.grandTotal;
            } else if (tx.id.startsWith('advance-')) { // Advance or Repayment
                if (tx.type === 'Advance Given') {
                    stats.balance -= tx.amount;
                } else { // Repayment or Discount
                    stats.balance += tx.amount;
                }
            } else if (tx.id.startsWith('bikri-')) { // Outside Sale
                if (tx.bikriType === 'growerForwarding') {
                    stats.balance += tx.calculation.netSalePayableToGrower;
                    netSale = tx.calculation.netSalePayableToGrower;
                } else {
                    stats.balance += tx.calculation.netProfitOrLoss; // If it's for an outside market
                }
            }
            stats.netSales += netSale;
        });

        stats.loyaltyPoints = Math.floor(stats.netSales / 1000);
        localPartyStats.set(canonical, stats);
    });

    const statsObject: { [key: string]: any } = {};
    localPartyStats.forEach((value, key) => { statsObject[key] = value; });

    setParties(Array.from(partiesMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    setPartyStats(statsObject);
    setIsLoading(false);
  };
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        setUserRole(localStorage.getItem('userRole'));
        fetchPartiesAndTransactions();
    }
  }, []);

  const filteredParties = useMemo(() => {
    return parties
        .filter(p => {
            if (typeFilter === 'all') return true;
            if (typeFilter === 'grower') return p.type === 'Grower' || p.type === 'Both';
            if (typeFilter === 'customer') return p.type === 'Customer' || p.type === 'Both' || p.type === 'Both (Outside & Customer)';
            if (typeFilter === 'outsideparty') return p.type === 'Outside Party' || p.type === 'Both (Outside & Customer)';
            return p.type.toLowerCase().replace(/\s/g, '') === typeFilter;
        })
        .filter(p => {
            const lowerCaseSearch = searchTerm.toLowerCase();
            return p.name.toLowerCase().includes(lowerCaseSearch) || (p.phone && p.phone.includes(lowerCaseSearch));
        });
  }, [parties, searchTerm, typeFilter]);

  const resetForm = () => setFormState(emptyFormState);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({...prev, [name]: value}));
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

  const handleEditClick = (party: Party) => {
    setFormState(party);
    setIsFormDialogOpen(true);
  }

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

  const PartyTypeBadge = ({type}: {type: Party['type']}) => {
    switch (type) {
        case 'Grower': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Grower</Badge>;
        case 'Customer': return <Badge variant="secondary">Customer</Badge>;
        case 'Both': return <Badge variant="outline">Both (Grower & Customer)</Badge>;
        case 'Outside Party': return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">Outside Party</Badge>;
        case 'Both (Outside & Customer)': return <Badge variant="outline" className="bg-purple-500 text-white hover:bg-purple-600">Both (Outside & Customer)</Badge>;
        default: return <Badge>{type}</Badge>;
    }
  }
  
  const StatCard = ({ icon: Icon, title, value, color }: { icon: React.ElementType, title: string, value: string, color?: string }) => (
    <div className="flex items-center gap-4 bg-muted p-4 rounded-lg">
        <div className={`p-3 rounded-full bg-background`}>
            <Icon className={`h-6 w-6 ${color || 'text-primary'}`} />
        </div>
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xl font-bold">{value}</p>
        </div>
    </div>
  );

  const PartyProfileDialog = () => {
    const [redemptionAmount, setRedemptionAmount] = useState(0);

    if (!selectedParty) return null;
    const stats = partyStats[getCanonicalName(selectedParty.name)];
    const loyaltyPoints = stats?.loyaltyPoints || 0;
    const balance = stats?.balance || 0;
    
    let balanceText, balanceColor;
    if (selectedParty.type === 'Grower' || selectedParty.type === 'Both') {
        balanceText = balance >= 0 ? 'Payable to Grower' : 'Advance to Grower';
        balanceColor = balance >= 0 ? 'text-red-500' : 'text-green-500';
    } else {
        balanceText = balance >= 0 ? 'Receivable from Customer' : 'Customer Credit';
        balanceColor = balance >= 0 ? 'text-green-500' : 'text-red-500';
    }

    const handleRedeem = async () => {
        if (redemptionAmount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a positive amount to redeem.' });
            return;
        }
        if (redemptionAmount > loyaltyPoints) {
            toast({ variant: 'destructive', title: 'Not Enough Points', description: `You cannot redeem more than the available ${loyaltyPoints} points.` });
            return;
        }

        const discountTransaction = {
            id: `advance-discount-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            partyName: selectedParty.name,
            type: 'Discount',
            amount: redemptionAmount,
            notes: `Redeemed ${redemptionAmount} loyalty points as discount.`
        };

        try {
            await saveDocument('advances', discountTransaction.id, discountTransaction);
            localStorage.setItem(discountTransaction.id, JSON.stringify(discountTransaction));
            toast({ title: 'Points Redeemed!', description: `${redemptionAmount} points have been applied as a discount.` });
            fetchPartiesAndTransactions(); // Re-fetch to update stats
            setIsProfileDialogOpen(false); // Close dialog on success
        } catch (error) {
            toast({ variant: 'destructive', title: 'Redemption Failed', description: 'Could not save the discount transaction.' });
        }
    };


    return (
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{selectedParty.name}</DialogTitle>
                    <p className="text-muted-foreground">{selectedParty.address} &bull; {selectedParty.phone}</p>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <StatCard icon={TrendingUp} title="Total Business (Net)" value={`₹${(stats?.netSales || 0).toLocaleString('en-IN')}`} />
                    <StatCard icon={CalendarDays} title="Last Activity" value={stats?.lastActivityDate ? new Date(stats.lastActivityDate).toLocaleDateString('en-GB') : 'N/A'} />

                    <div className="md:col-span-2">
                       <StatCard icon={Users} title="Current Dues" value={`₹${Math.abs(balance).toLocaleString('en-IN')}`} color={balanceColor.replace('text-', '')} />
                       <p className={`text-center mt-1 text-sm font-semibold ${balanceColor}`}>{balanceText}</p>
                    </div>

                    <div className="md:col-span-2 space-y-4 rounded-lg border p-4">
                        <h4 className="font-semibold text-lg flex items-center gap-2"><Award className="h-5 w-5 text-yellow-500" /> F.Co Loyalty Program</h4>
                        <div className="flex justify-between items-center">
                            <StatCard icon={Award} title="Available Loyalty Points" value={`${loyaltyPoints} Points`} color="text-yellow-500" />
                            <div className="flex items-center gap-2">
                                <Input type="number" className="w-24" placeholder="Points" value={redemptionAmount || ''} onChange={e => setRedemptionAmount(Number(e.target.value))} max={loyaltyPoints} />
                                <Button onClick={handleRedeem} disabled={redemptionAmount <= 0}>Redeem</Button>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">1 Point = ₹1 Discount. Redeeming points will create a "Discount" transaction in the Khata, reducing the party's dues.</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
  };


  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4">Consolidating Parties...</p>
        </div>
    )
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6" /> Parties Master Directory</CardTitle>
            <CardDescription>A unified directory for all your Growers, Customers, and Outside Parties.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
             <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by name or phone..."
                    className="pl-8 sm:w-[200px] lg:w-[250px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="grower">Growers</SelectItem>
                    <SelectItem value="customer">Customers</SelectItem>
                    <SelectItem value="both">Both (Grower & Customer)</SelectItem>
                    <SelectItem value="outsideparty">Outside Parties</SelectItem>
                    <SelectItem value="both(outside&customer)">Both (Outside & Customer)</SelectItem>
                </SelectContent>
            </Select>
            <Button onClick={exportToPDF} variant="outline" size="sm" className="gap-1"><FileDown className="h-4 w-4"/>PDF</Button>
            <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-1"><FileDown className="h-4 w-4"/>Excel</Button>
            <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => {
                setIsFormDialogOpen(isOpen);
                if (!isOpen) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
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
                                <SelectItem value="Grower">Grower (Sells to you)</SelectItem>
                                <SelectItem value="Customer">Customer (Buys from you)</SelectItem>
                                <SelectItem value="Both">Both (Grower & Customer)</SelectItem>
                                <SelectItem value="Outside Party">Outside Party (e.g., Labour, Transport)</SelectItem>
                                <SelectItem value="Both (Outside & Customer)">Both (Outside & Customer)</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="phone">Phone / WhatsApp</Label>
                          <Input id="phone" name="phone" value={formState.phone || ''} onChange={handleInputChange} />
                      </div>
                       <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="address">Address</Label>
                          <Input id="address" name="address" value={formState.address || ''} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="email">Email (Optional)</Label>
                          <Input id="email" name="email" type="email" value={formState.email || ''} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="notes">Notes / Extra Info</Label>
                          <Textarea id="notes" name="notes" value={formState.notes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleSaveParty}>Save Party</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
         {parties.length > 0 ? (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">S.No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Net Sales</TableHead>
                <TableHead className="text-right">Loyalty Points</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParties.map((party, index) => {
                const stats = partyStats[getCanonicalName(party.name)];
                const balance = stats?.balance || 0;
                const netSales = stats?.netSales || 0;
                const loyaltyPoints = stats?.loyaltyPoints || 0;
                const transactionCount = stats?.transactionCount || 0;

                let balanceText, balanceColor;
                if (party.type === 'Grower' || party.type === 'Both') {
                    balanceText = balance >= 0 ? 'Payable' : 'Advance';
                    balanceColor = balance >= 0 ? 'text-red-500' : 'text-green-500';
                } else {
                    balanceText = balance >= 0 ? 'Receivable' : 'Credit';
                    balanceColor = balance >= 0 ? 'text-green-500' : 'text-red-500';
                }

                return (
                <TableRow key={party.id} className="cursor-pointer" onClick={() => handleRowClick(party)}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{party.name}</TableCell>
                  <TableCell><PartyTypeBadge type={party.type} /></TableCell>
                  <TableCell className="text-right font-mono">
                    <div className="flex items-center justify-end gap-1">
                        <ListChecks className="h-4 w-4 text-muted-foreground" /> {transactionCount}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ₹{netSales.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </TableCell>
                   <TableCell className="text-right font-mono text-yellow-500">
                    <div className="flex items-center justify-end gap-1">
                       <Star className="h-4 w-4" /> {loyaltyPoints}
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-mono ${balanceColor}`}>
                    {balance >= 0 ? '₹' : '-₹'}{Math.abs(balance).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    <p className="text-xs">{balanceText}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEditClick(party); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {userRole === 'admin' && (
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteParty(party.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
         ) : (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <Users className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">No parties found.</h3>
            <p className="mt-1 text-sm">Get started by adding your first grower or customer.</p>
          </div>
        )}
      </CardContent>
    </Card>
    <PartyProfileDialog />
    </>
  );
}
