
'use client'

import React, { useState, useEffect } from 'react';
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
  TableFooter,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, FileSignature, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveDocument, deleteDocument } from '@/lib/actions';

type LedgerEntry = {
    id: string;
    date: string;
    customer: string;
    item: string;
    category: 'Fertilizer/Pesticide' | 'Packaging' | 'Other';
    qty: number;
    rate: number;
    paymentMode: 'Cash' | 'Credit' | 'Khata';
};

const emptyFormState: Omit<LedgerEntry, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    customer: '',
    item: '',
    category: 'Packaging',
    qty: 0,
    rate: 0,
    paymentMode: 'Cash',
};

export default function AccessoriesLedgerPage() {
    const { toast } = useToast();
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [formState, setFormState] = useState(emptyFormState);
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);

     useEffect(() => {
        setIsClient(true);
        if (typeof window !== 'undefined') {
            setUserRole(localStorage.getItem('userRole'));
        }
    }, []);

    const fetchEntries = () => {
        if (typeof window === 'undefined') return;
        setIsLoading(true);
        const items: LedgerEntry[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('accessory-ledger-')) {
                try {
                    items.push(JSON.parse(localStorage.getItem(key)!));
                } catch (e) {
                    console.error("Failed to parse ledger entry", e);
                }
            }
        }
        setEntries(items.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setIsLoading(false);
    };

    useEffect(() => {
        if (isClient) {
            fetchEntries();
        }
    }, [isClient]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | string, name: keyof typeof formState) => {
         if (typeof e === 'string') {
            setFormState(prev => ({...prev, [name]: e}));
        } else {
            const { value, type } = e.target;
            setFormState(prev => ({...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value}));
        }
    }

    const handleSaveEntry = async () => {
        if (!formState.date || !formState.customer || !formState.item || formState.qty <= 0 || formState.rate <= 0) {
            toast({
                variant: 'destructive',
                title: 'Missing Fields',
                description: 'Please fill out all required fields before saving.',
            });
            return;
        }

        const id = `accessory-ledger-${Date.now()}`;
        const newEntry = { ...formState, id };
        
        localStorage.setItem(id, JSON.stringify(newEntry));

        try {
            await saveDocument('accessory-ledgers', id, newEntry);
            toast({
                title: 'Ledger Entry Saved',
                description: 'Your entry has been recorded.',
            });
        } catch (e) {
            toast({
                variant: 'destructive',
                title: 'Cloud Sync Failed',
                description: 'Entry is saved locally, but failed to sync to cloud.',
            });
        }
        
        fetchEntries();
        setFormState(emptyFormState); // Reset form
    };
    
    const handleDeleteEntry = async (id: string) => {
        if(userRole !== 'admin'){
            toast({variant: 'destructive', title: 'Permission Denied'});
            return;
        }
        if (!window.confirm('Are you sure you want to delete this ledger entry?')) return;
        
        localStorage.removeItem(id);
        
        try {
            await deleteDocument('accessory-ledgers', id);
            toast({ title: 'Entry Deleted' });
        } catch(e) {
             toast({
                variant: 'destructive',
                title: 'Cloud Delete Failed',
                description: 'Could not delete from cloud, but it was removed locally.',
            });
        }
        fetchEntries();
    };

    const dailyTotal = entries.filter(entry => entry.date === new Date().toISOString().split('T')[0]).reduce((acc, curr) => acc + (curr.qty * curr.rate), 0);

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add to Daily Accessories Ledger</CardTitle>
            <CardDescription>Log sales of fertilizers, packaging materials, and other farm inputs.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" value={formState.date} onChange={(e) => handleInputChange(e, 'date')} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="customer">Customer / Grower / Use</Label>
                <Input id="customer" name="customer" placeholder="e.g., John Doe, Self" value={formState.customer} onChange={(e) => handleInputChange(e, 'customer')} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formState.category} onValueChange={(val) => handleInputChange(val, 'category')}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Fertilizer/Pesticide">Fertilizer/Pesticide</SelectItem>
                        <SelectItem value="Packaging">Packaging Material</SelectItem>
                        <SelectItem value="Other">Other Farm Input</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="item">Item Name</Label>
                <Input id="item" name="item" placeholder="e.g., Urea, Tape Roll" value={formState.item} onChange={(e) => handleInputChange(e, 'item')} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="qty">Quantity</Label>
                <Input id="qty" name="qty" type="number" placeholder="0" value={formState.qty || ''} onChange={(e) => handleInputChange(e, 'qty')} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="rate">Rate</Label>
                <Input id="rate" name="rate" type="number" placeholder="0.00" value={formState.rate || ''} onChange={(e) => handleInputChange(e, 'rate')} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="paymentMode">Payment Mode</Label>
                <Select value={formState.paymentMode} onValueChange={(val) => handleInputChange(val, 'paymentMode')}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Credit">Credit</SelectItem>
                        <SelectItem value="Khata">Add to Khata</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
         <CardFooter>
            <Button onClick={handleSaveEntry} className="gap-2">
                <PlusCircle className="h-4 w-4" /> Add Ledger Entry
            </Button>
        </CardFooter>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Ledger History</CardTitle>
        <CardDescription>A record of all accessory and material sales.</CardDescription>
      </CardHeader>
      <CardContent>
         {isLoading ? (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
         ) : entries.length > 0 ? (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entries.map((entry) => (
                        <TableRow key={entry.id}>
                            <TableCell>{new Date(entry.date).toLocaleDateString('en-GB')}</TableCell>
                            <TableCell>{entry.customer}</TableCell>
                            <TableCell>{entry.category}</TableCell>
                            <TableCell className="font-medium">{entry.item}</TableCell>
                            <TableCell>{entry.qty}</TableCell>
                            <TableCell>₹{entry.rate.toFixed(2)}</TableCell>
                            <TableCell>{entry.paymentMode}</TableCell>
                            <TableCell className="text-right font-mono">₹{(entry.qty * entry.rate).toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" className="mr-2" disabled>
                                    <FileSignature className="h-3 w-3 mr-1" /> Bill
                                </Button>
                                {userRole === 'admin' && (
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteEntry(entry.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow className="font-bold text-lg">
                        <TableCell colSpan={7} className="text-right">Today's Total</TableCell>
                        <TableCell className="text-right font-mono">₹{dailyTotal.toFixed(2)}</TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
         ) : (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>No ledger entries recorded yet.</p>
                <p className="text-sm">Use the form above to add your first entry.</p>
            </div>
         )}
      </CardContent>
    </Card>
    </div>
  );
}
