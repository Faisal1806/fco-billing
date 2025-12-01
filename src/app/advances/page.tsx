'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  TableFooter
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Banknote, Loader2, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { PartySelector } from '@/components/party-selector';
import { saveDocument, deleteDocument, sendPushNotification, getDocuments } from '@/lib/actions';

const STORAGE_PREFIX = 'advance-';

type AdvanceEntry = {
    id: string;
    date: string;
    partyName: string;
    type: 'Advance Given' | 'Repayment Received' | 'Discount';
    amount: number;
    notes?: string;
};

const emptyFormState: Omit<AdvanceEntry, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    partyName: '',
    type: 'Advance Given',
    amount: 0,
    notes: '',
};

export default function AdvancesPage() {
    const { toast } = useToast();
    const [entries, setEntries] = useState<AdvanceEntry[]>([]);
    const [formState, setFormState] = useState(emptyFormState);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [fcmTokens, setFcmTokens] = useState<string[]>([]);

     useEffect(() => {
        if (typeof window !== 'undefined') {
            setUserRole(localStorage.getItem('userRole'));
        }
        const fetchTokens = async () => {
            const { success, data } = await getDocuments('fcm-tokens');
            if (success && data) {
                setFcmTokens(data.map(t => t.token));
            }
        };
        fetchTokens();
    }, []);

    const fetchEntries = () => {
        setIsLoading(true);
        if(typeof window !== 'undefined') {
            const items = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(STORAGE_PREFIX)) {
                    items.push(JSON.parse(localStorage.getItem(key)!));
                }
            }
             setEntries(items.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string, name: keyof typeof formState) => {
         if (typeof e === 'string') {
            setFormState(prev => ({...prev, [name]: e}));
        } else {
            const { value, type } = e.target;
            setFormState(prev => ({...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value}));
        }
    }
    
    const handlePartyChange = (value: string) => {
        setFormState(prev => ({...prev, partyName: value}));
    }

    const handleSaveEntry = async () => {
        if (!formState.date || !formState.partyName || formState.amount <= 0) {
            toast({
                variant: 'destructive',
                title: 'Missing Fields',
                description: 'Please fill out Date, Party Name, and Amount.',
            });
            return;
        }

        const id = `${STORAGE_PREFIX}${Date.now()}`;
        const newEntry = { ...formState, id };
        
        localStorage.setItem(id, JSON.stringify(newEntry));
        
        try {
            await saveDocument('advances', id, newEntry);
            toast({
                title: 'Transaction Saved',
                description: 'The transaction has been recorded locally and synced to the cloud.',
            });

            if (newEntry.type === 'Repayment Received' && fcmTokens.length > 0) {
                await sendPushNotification({
                    title: 'Payment Received',
                    body: `₹${newEntry.amount.toLocaleString()} received from ${newEntry.partyName} – Thank You!`,
                    tokens: fcmTokens,
                });
            }

        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Sync Failed',
                description: 'Saved locally, but failed to sync to cloud.',
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
        if (!window.confirm('Are you sure you want to delete this transaction?')) return;
        
        localStorage.removeItem(id);

        try {
            await deleteDocument('advances', id);
            toast({ title: 'Entry Deleted', description: 'The entry has been removed.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Cloud Delete Failed', description: 'Entry removed locally.'});
        }
        
        fetchEntries();
    };

    const totalAdvance = useMemo(() => {
        return entries.reduce((acc, curr) => {
            if (curr.type === 'Advance Given') {
                return acc + curr.amount;
            } else if (curr.type === 'Repayment Received' || curr.type === 'Discount') {
                return acc - curr.amount;
            }
            return acc;
        }, 0);
    }, [entries]);
    
    const getBadgeVariant = (type: AdvanceEntry['type']) => {
        switch (type) {
            case 'Advance Given': return 'destructive';
            case 'Repayment Received': return 'default';
            case 'Discount': return 'secondary';
            default: return 'outline';
        }
    }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Banknote className="h-6 w-6 text-primary"/> Add New Advance or Repayment</CardTitle>
                <CardDescription>Record money given to growers/farmers as an advance or log any repayments received from them.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={formState.date} onChange={(e) => handleInputChange(e, 'date')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="partyName">Party Name (Grower/Customer)</Label>
                    <PartySelector value={formState.partyName} onChange={handlePartyChange} filter="all" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="type">Transaction Type</Label>
                    <Select value={formState.type} onValueChange={(val: 'Advance Given' | 'Repayment Received' | 'Discount') => handleInputChange(val, 'type')}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Advance Given">Advance Given (Debit)</SelectItem>
                            <SelectItem value="Repayment Received">Repayment Received (Credit)</SelectItem>
                            <SelectItem value="Discount">Loyalty Discount (Credit)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" type="number" placeholder="0.00" value={formState.amount || ''} onChange={(e) => handleInputChange(e, 'amount')} />
                </div>
                 <div className="space-y-2 md:col-span-2 lg:col-span-4">
                    <Label htmlFor="notes">Notes / Remarks</Label>
                    <Input id="notes" placeholder="e.g., For fertilizer purchase" value={formState.notes || ''} onChange={(e) => handleInputChange(e, 'notes')} />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSaveEntry} className="gap-2">
                    <PlusCircle className="h-4 w-4" /> Add Transaction
                </Button>
            </CardFooter>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Advance & Loan History</CardTitle>
        <CardDescription>A complete record of all advances given and repayments received.</CardDescription>
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
                        <TableHead>Party Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        {userRole === 'admin' && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entries.map((entry) => (
                        <TableRow key={entry.id}>
                            <TableCell>{new Date(entry.date).toLocaleDateString('en-GB')}</TableCell>
                            <TableCell className="font-medium">{entry.partyName}</TableCell>
                            <TableCell>
                                <Badge variant={getBadgeVariant(entry.type)}>
                                    {entry.type === 'Discount' ? <Gift className="h-3 w-3 mr-1" /> : null}
                                    {entry.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{entry.notes}</TableCell>
                            <TableCell className={`text-right font-mono font-semibold ${entry.type === 'Advance Given' ? 'text-red-500' : 'text-green-500'}`}>
                                {entry.type === 'Advance Given' ? '-' : '+'} ₹{entry.amount.toFixed(2)}
                            </TableCell>
                            {userRole === 'admin' && (
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteEntry(entry.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow className="font-bold text-lg bg-muted/50">
                        <TableCell colSpan={userRole === 'admin' ? 5 : 4} className="text-right">Net Outstanding Advance</TableCell>
                        <TableCell className="text-right font-mono">₹{totalAdvance.toFixed(2)}</TableCell>
                        {userRole === 'admin' && <TableCell></TableCell>}
                    </TableRow>
                </TableFooter>
            </Table>
         ) : (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>No advance or loan entries recorded yet.</p>
                <p className="text-sm">Use the form above to add your first transaction.</p>
            </div>
         )}
      </CardContent>
    </Card>
    </div>
  );
}
