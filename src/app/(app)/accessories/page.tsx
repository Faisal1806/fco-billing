
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
import { PlusCircle, Trash2, FileSignature, Loader2, Printer, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveDocument, deleteDocument } from '@/lib/actions';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './../khata/print.css';

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

        // --- Inventory Deduction Logic ---
        let productToUpdate: Product | null = null;
        let productKey: string | null = null;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('product-')) {
                try {
                    const product: Product = JSON.parse(localStorage.getItem(key)!);
                    if (product.name.toLowerCase() === formState.item.toLowerCase()) {
                        productToUpdate = product;
                        productKey = key;
                        break;
                    }
                } catch(e) {
                    console.error("Failed to parse product for stock update", e);
                }
            }
        }

        if (productToUpdate && productKey) {
             if (productToUpdate.stock < formState.qty) {
                if (!window.confirm(`Warning: Stock for ${productToUpdate.name} is low (${productToUpdate.stock} available). Continue with sale?`)) {
                    return; // Stop if user cancels
                }
            }
            productToUpdate.stock -= formState.qty;
            localStorage.setItem(productKey, JSON.stringify(productToUpdate));
        } else {
             if (!window.confirm(`Warning: "${formState.item}" is not found in your inventory. Stock will not be deducted. Continue anyway?`)) {
                return; // Stop if user cancels
            }
        }
        // --- End of Inventory Deduction Logic ---


        const id = `accessory-ledger-${Date.now()}`;
        const newEntry = { ...formState, id };
        
        localStorage.setItem(id, JSON.stringify(newEntry));

        try {
            await saveDocument('accessory-ledgers', id, newEntry);
            toast({
                title: 'Ledger Entry Saved',
                description: 'Your entry has been recorded and stock updated.',
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
        if (!window.confirm('Are you sure you want to delete this ledger entry? Note: This will not automatically add stock back.')) return;
        
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
    const overallTotal = entries.reduce((acc, curr) => acc + (curr.qty * curr.rate), 0);
    
    const handlePrint = () => {
        window.print();
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Accessories Ledger", 14, 15);
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
        doc.save("accessories-ledger.pdf");
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
        XLSX.utils.book_append_sheet(wb, ws, "Accessories");
        XLSX.writeFile(wb, "accessories-ledger.xlsx");
    };

  return (
    <div className="space-y-6 printable-area">
        <Card className="print-hidden">
          <CardHeader>
            <CardTitle>Add to Daily Accessories Ledger</CardTitle>
            <CardDescription>Log sales of fertilizers, packaging materials, and other farm inputs. Inventory stock will be deducted automatically.</CardDescription>
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
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Ledger History</CardTitle>
                <CardDescription>A record of all accessory and material sales.</CardDescription>
            </div>
            <div className="flex gap-2 print-hidden">
                <Button onClick={handlePrint} variant="outline" size="sm" className="gap-1"><Printer className="h-4 w-4"/>Print</Button>
                <Button onClick={exportToPDF} variant="outline" size="sm" className="gap-1"><FileDown className="h-4 w-4"/>PDF</Button>
                <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-1"><FileDown className="h-4 w-4"/>Excel</Button>
            </div>
        </div>
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
                        <TableHead className="text-right print-hidden">Actions</TableHead>
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
                            <TableCell className="text-right print-hidden">
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
                        <TableCell className="print-hidden"></TableCell>
                    </TableRow>
                     <TableRow className="font-bold text-xl bg-muted">
                        <TableCell colSpan={7} className="text-right">Overall Total</TableCell>
                        <TableCell className="text-right font-mono">₹{overallTotal.toFixed(2)}</TableCell>
                        <TableCell className="print-hidden"></TableCell>
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

    