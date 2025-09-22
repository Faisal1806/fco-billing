
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
import { PlusCircle, Edit, Trash2, Users, Search, FileDown, Loader2, Leaf, ShoppingCart, Handshake } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const PARTY_STORAGE_PREFIX = 'party-';

interface Party {
  id: string; // Unique ID, can be derived from name for existing, or new for added
  name: string;
  type: 'Grower' | 'Customer' | 'Both' | 'Outside Party';
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

// Re-using the normalization logic from khata page
const normalizeName = (name: string): string => {
    if (!name) return '';
    return name.toUpperCase()
        .replace(/\b(MOHAMMAD|MOHD|MD)\b/g, 'MOHAMMAD')
        .replace(/\b(AHMAD|AH)\b/g, 'AHMAD')
        .replace(/\./g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

export default function PartiesPage() {
  const { toast } = useToast();
  const [parties, setParties] = useState<Party[]>([]);
  const [balances, setBalances] = useState<{[key: string]: number}>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState<Party | Omit<Party, 'id'>>(emptyFormState);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setUserRole(localStorage.getItem('userRole'));
        fetchPartiesAndTransactions();
    }
  }, []);

  const fetchPartiesAndTransactions = () => {
    setIsLoading(true);
    const loadedParties: {[key: string]: Party} = {};
    const transactionCounts: {[key: string]: {sales: number, purchases: number, expenses: number}} = {};
    const localBalances: {[key: string]: number} = {};

    // 1. Load explicitly saved parties
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PARTY_STORAGE_PREFIX)) {
        const party = JSON.parse(localStorage.getItem(key)!);
        const normalized = normalizeName(party.name);
        loadedParties[normalized] = party;
      }
    }

    // 2. Infer parties and calculate balances from transactions
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        let partyName: string | undefined;
        let isSale = false;
        let isPurchase = false;
        let isExpense = false;
        let amount = 0;

        if (key.startsWith('invoice-')) {
            const doc = JSON.parse(localStorage.getItem(key)!);
            partyName = doc.customerName;
            isSale = true;
            amount = doc.totals.netSale;
        } else if (key.startsWith('purchase-')) {
            const doc = JSON.parse(localStorage.getItem(key)!);
            partyName = doc.growerName;
            isPurchase = true;
            amount = -doc.totals.grandTotal; // Receivable
        } else if (key.startsWith('advance-')) {
            const doc = JSON.parse(localStorage.getItem(key)!);
            partyName = doc.partyName;
            if(doc.type === 'Advance Given') {
                isPurchase = true; // Treat as receivable
                amount = -doc.amount;
            } else { // Repayment
                isSale = true; // Treat as payable received
                amount = doc.amount;
            }
        } else if (key.startsWith('expense-')) {
            const doc = JSON.parse(localStorage.getItem(key)!);
            if(doc.partyName){
                partyName = doc.partyName;
                isExpense = true;
                // Expenses are money you pay out, so they are a payable that you clear.
                // Or you can think of them as a negative balance from your side.
                // For simplicity, we can treat them as a "cost" and not directly impact party balance in this view,
                // as that's handled in expense ledgers. We'll just use it for type inference.
            }
        }
        
        if(partyName) {
            const normalized = normalizeName(partyName);
            if (!transactionCounts[normalized]) {
                transactionCounts[normalized] = { sales: 0, purchases: 0, expenses: 0 };
            }
            if (!localBalances[normalized]) {
                localBalances[normalized] = 0;
            }

            if(isSale) transactionCounts[normalized].sales++;
            if(isPurchase) transactionCounts[normalized].purchases++;
            if(isExpense) transactionCounts[normalized].expenses++;

            if(isSale || isPurchase) localBalances[normalized] += amount;

            if (!loadedParties[normalized]) {
                 loadedParties[normalized] = {
                    id: `${PARTY_STORAGE_PREFIX}${normalized}`,
                    name: partyName, // Use original name for display
                    type: 'Grower' // Default, will be updated below
                };
            }
        }
    }
    
    // 3. Determine party type
    Object.keys(loadedParties).forEach(normalized => {
        const counts = transactionCounts[normalized];
        const party = loadedParties[normalized];

        if (counts) {
            const hasSales = counts.sales > 0;
            const hasPurchases = counts.purchases > 0;
            const hasExpenses = counts.expenses > 0;

            if (hasSales && hasPurchases) party.type = 'Both';
            else if (hasSales) party.type = 'Grower';
            else if (hasPurchases) party.type = 'Customer';
            else if (hasExpenses) party.type = 'Outside Party';
        }
        // If 'type' was manually set, it will be preserved if no transactions exist.
        // If a party has multiple transaction types, the most specific one is prioritized.
        // e.g., a grower who is also an expense party will be shown as 'Grower'.
    });
    
    setParties(Object.values(loadedParties).sort((a,b) => a.name.localeCompare(b.name)));
    setBalances(localBalances);
    setIsLoading(false);
  };

  const filteredParties = useMemo(() => {
    return parties
        .filter(p => {
            if (typeFilter === 'all') return true;
            return p.type.toLowerCase().replace(' ', '') === typeFilter;
        })
        .filter(p => {
            const lowerCaseSearch = searchTerm.toLowerCase();
            return p.name.toLowerCase().includes(lowerCaseSearch) || (p.phone && p.phone.includes(lowerCaseSearch));
        });
  }, [parties, searchTerm, typeFilter]);

  const resetForm = () => {
    setFormState(emptyFormState);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({...prev, [name]: value}));
  };
  
  const handleSelectChange = (name: keyof Omit<Party, 'id'>, value: string) => {
    setFormState(prev => ({...prev, [name]: value}));
  }

  const handleSaveParty = () => {
    if (!formState.name) {
      toast({ variant: 'destructive', title: 'Missing Name' });
      return;
    }

    const id = 'id' in formState ? formState.id : `${PARTY_STORAGE_PREFIX}${normalizeName(formState.name)}`;
    const newParty: Party = { id, ...(formState as Omit<Party, 'id'>) };

    localStorage.setItem(id, JSON.stringify(newParty));
    toast({ title: 'id' in formState ? 'Party Updated' : 'Party Added' });
    
    fetchPartiesAndTransactions();
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEditClick = (party: Party) => {
    setFormState(party);
    setIsDialogOpen(true);
  }
  
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
        head: [['Name', 'Type', 'Phone', 'Address', 'Balance']],
        body: filteredParties.map(p => [
            p.name,
            p.type,
            p.phone || '',
            p.address || '',
            (balances[normalizeName(p.name)] || 0).toFixed(2)
        ]),
    });
    doc.save("parties-directory.pdf");
  };

  const exportToExcel = () => {
      const ws = XLSX.utils.json_to_sheet(filteredParties.map(p => ({
          'Name': p.name,
          'Type': p.type,
          'Phone': p.phone,
          'Address': p.address,
          'Email': p.email,
          'Notes': p.notes,
          'Balance': balances[normalizeName(p.name)] || 0,
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Parties");
      XLSX.writeFile(wb, "parties-directory.xlsx");
  };

  const PartyTypeBadge = ({type}: {type: Party['type']}) => {
    switch (type) {
        case 'Grower': return <Badge variant="default" className="bg-green-600">Grower</Badge>;
        case 'Customer': return <Badge variant="secondary">Customer</Badge>;
        case 'Both': return <Badge variant="outline">Both</Badge>;
        case 'Outside Party': return <Badge variant="destructive">Outside Party</Badge>;
        default: return <Badge>{type}</Badge>;
    }
  }

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4">Loading Parties...</p>
        </div>
    )
  }

  return (
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
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="outsideparty">Outside Parties</SelectItem>
                </SelectContent>
            </Select>
            <Button onClick={exportToPDF} variant="outline" size="sm" className="gap-1"><FileDown className="h-4 w-4"/>PDF</Button>
            <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-1"><FileDown className="h-4 w-4"/>Excel</Button>
            <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
                setIsDialogOpen(isOpen);
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
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParties.map((party) => {
                const balance = balances[normalizeName(party.name)] || 0;
                return (
                <TableRow key={party.id}>
                  <TableCell className="font-medium">{party.name}</TableCell>
                  <TableCell><PartyTypeBadge type={party.type} /></TableCell>
                  <TableCell>{party.phone}</TableCell>
                  <TableCell>{party.address}</TableCell>
                  <TableCell className={`text-right font-mono ${balance > 0 ? 'text-green-600' : (balance < 0 ? 'text-red-500' : '')}`}>
                    {balance >= 0 ? '₹' : '-₹'}{Math.abs(balance).toFixed(2)}
                    <p className="text-xs text-muted-foreground">{balance > 0 ? 'Payable' : (balance < 0 ? 'Receivable' : 'Settled')}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(party)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {userRole === 'admin' && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteParty(party.id)}>
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
  );
}

    