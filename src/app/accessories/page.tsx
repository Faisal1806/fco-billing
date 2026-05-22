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
import { PlusCircle, Trash2, FileSignature, Printer, FileDown, Droplets } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Lottie from 'lottie-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import '../khata/print.css';
import { saveDocument, deleteDocument } from '@/lib/actions';
import PageHeader from '@/components/PageHeader';

const STORAGE_PREFIX = 'accessory-ledger-';

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

interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
}

const emptyFormState: Omit<LedgerEntry, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    customer: '',
    item: '',
    category: 'Packaging',
    qty: 0,
    rate: 0,
    paymentMode: 'Cash',
};

export default function SuppliesPage() {
    const { toast } = useToast();
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [formState, setFormState] = useState(emptyFormState);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loaderAnimation, setLoaderAnimation] = useState(null);

     useEffect(() => {
        if (typeof window !== 'undefined') {
            setUserRole(localStorage.getItem('userRole'));
        }
        fetch('/animations/forms/fco_loader.json').then(res => res.json()).then(setLoaderAnimation);
    }, []);

    const fetchEntries = () => {
        setIsLoading(true);
        if (typeof window !== 'undefined') {
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

        const id = `${STORAGE_PREFIX}${Date.now()}`;
        const newEntry = { ...formState, id };
        
        localStorage.setItem(id, JSON.stringify(newEntry));
        
        try {
            await saveDocument('accessory-ledger', id, newEntry);
            toast({
                title: 'Ledger Entry Saved',
                description: 'Your entry has been recorded locally and synced to the cloud.',
            });
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
        if (!window.confirm('Are you sure you want to delete this ledger entry?')) return;
        
        localStorage.removeItem(id);
        
        try {
            await deleteDocument('accessory-ledger', id);
            toast({ title: 'Entry Deleted', description: 'The entry has been removed.' });
        } catch (error) {
             toast({ variant: 'destructive', title: 'Cloud Delete Failed', description: 'Entry removed locally.'});
        }
        
        fetchEntries();
    };

    const dailyTotal = entries.filter(entry => entry.date === new Date().toISOString().split('T')[0]).reduce((acc, curr) => acc + (curr.qty * curr.rate), 0);
    const overallTotal = entries.reduce((acc, curr) => acc + (curr.qty * curr.rate), 0);
    
    const handlePrint = () => {
        window.print();
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Supplies Ledger", 14, 15);
        autoTable(doc, {
            head: [['Date', 'Customer', 'Category', 'Item', 'Qty', 'Rate', 'Payment', 'Amount']],
            body: entries.map(e => [
                new Date(e.date).toLocaleDateString('en-GB'),
                e.customer,
                e.category,
                e.item,
                e.qty,
                `₹${e.rate.toFixed(2)}`,
                e.paymentMode,
                `₹${(e.qty * e.rate).toFixed(2)}`
            ]),
            foot: [[{ content: 'Total', colSpan: 7, styles: { halign: 'right' } }, `₹${overallTotal.toFixed(2)}`]],
        });
        doc.save("supplies-ledger.pdf");
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(entries.map(e => ({
            Date: new Date(e.date).toLocaleDateString('en-GB'),
            Customer: e.customer,
            Category: e.category,
            Item: e.item,
            Quantity: e.qty,
            Rate: e.rate,
            'Payment Mode': e.paymentMode,
            Amount: e.qty * e.rate,
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Supplies");
        XLSX.writeFile(wb, "supplies-ledger.xlsx");
    };

  return (
    <div className="space-y-6 printable-area">
        <PageHeader
            title="Accessories & Cashbook"
            description="Log sales of fertilizers, packaging, and other farm inputs. This section acts as the daily cashbook."
            icon={<Droplets className="h-8 w-8" />}
            imageUrl="/assets/3d/expenses.png"
        />
        <Card className="print-hidden">
        <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-6">
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
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Ledger History</CardTitle>
                <CardDescription>A record of all supply and material sales.</CardDescription>
            </div>
            <div className="flex gap-2 print-hidden">
                <Button onClick={handlePrint} variant="outline" size="sm" className="gap-1"><Printer className="h-4 w-4"/>Print</Button>
                <Button onClick={exportToPDF} variant="outline" size="sm" className="gap-1"><FileDown className="h-4 w-4"/>PDF</Button>
                <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-1"><FileDown className="h-4 w-4"/>Excel</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
         {isLoading || !loaderAnimation ? (
            <div className="flex justify-center items-center h-48">
                <Lottie animationData={loaderAnimation} loop={true} style={{ width: 100, height: 100 }} />
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
                        {userRole === 'admin' && <TableHead className="text-right print-hidden">Actions</TableHead>}
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
                            {userRole === 'admin' && (
                                <TableCell className="text-right print-hidden">
                                    <Button variant="outline" size="sm" className="mr-2" disabled>
                                        <FileSignature className="h-3 w-3 mr-1" /> Bill
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteEntry(entry.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow className="font-bold text-lg">
                        <TableCell colSpan={userRole === 'admin' ? 8 : 7} className="text-right">Today's Total</TableCell>
                        <TableCell className="text-right font-mono">₹{dailyTotal.toFixed(2)}</TableCell>
                        {userRole === 'admin' && <TableCell className="print-hidden"></TableCell>}
                    </TableRow>
                     <TableRow className="font-bold text-xl bg-muted/50">
                        <TableCell colSpan={userRole === 'admin' ? 8 : 7} className="text-right">Overall Total</TableCell>
                        <TableCell className="text-right font-mono">₹{overallTotal.toFixed(2)}</TableCell>
                        {userRole === 'admin' && <TableCell className="print-hidden"></TableCell>}
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

