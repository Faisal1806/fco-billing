
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Loader2, PlusCircle, Trash2, FilePenLine, FilePlus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type PurchaseRow = {
  type: 'Patti' | 'Dabba';
  qty: number;
  variety: string;
  rate: number;
};

const emptyRow: PurchaseRow = { type: 'Patti', qty: 0, variety: '', rate: 0 };
const initialRows: PurchaseRow[] = Array.from({ length: 3 }, () => ({ ...emptyRow }));


export default function PurchasesPage() {
  const [billNo, setBillNo] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [date, setDate] = useState('');
  const [rows, setRows] = useState<PurchaseRow[]>(initialRows);

  const { toast } = useToast();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedPurchases, setSavedPurchases] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole'));
    }
  }, []);

  const fetchPurchases = () => {
    setIsLoading(true);
    const purchases = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('purchase-')) {
            const purchase = JSON.parse(localStorage.getItem(key)!);
            purchases.push(purchase);
        }
    }
    setSavedPurchases(purchases.sort((a,b) => (a.billNo > b.billNo) ? 1 : -1));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPurchases();
  }, []);


  const totals = useMemo(() => {
    const totalQty = rows.reduce((s, r) => s + (Number(r.qty) || 0), 0);
    const rowTotals = rows.map(r => (Number(r.qty) || 0) * (Number(r.rate) || 0));
    const grandTotal = rowTotals.reduce((s, v) => s + v, 0);

    return {
      totalQty,
      grandTotal,
      rowTotals,
    };
  }, [rows]);

  const updateRow = (i: number, patch: Partial<PurchaseRow>) => {
    setRows(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], ...patch };
      return copy;
    });
  };

  const addRow = () => setRows(prev => [...prev, { ...emptyRow }]);
  const removeRow = (i: number) =>
    setRows(prev => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

    const resetForm = () => {
        setBillNo('');
        setCompanyName('');
        setDate('');
        setRows(initialRows);
        setIsEditing(false);
    };


  const saveToLocalStorage = async () => {
     if (!billNo || !date || !companyName) {
        toast({
            variant: 'destructive',
            title: 'Missing Details',
            description: 'Please fill in Bill No, Date, and Company Name before saving.',
        });
        return;
    }

    setIsSubmitting(true);
    const purchaseId = billNo;
    const purchaseData = {
      billNo,
      date,
      growerName: companyName,
      entries: rows.filter(r => r.qty > 0 && r.rate > 0).map(r => ({...r, qty: Number(r.qty), rate: Number(r.rate), total: Number(r.qty) * Number(r.rate)})),
      totals: {
        totalQty: totals.totalQty,
        grandTotal: Number(totals.grandTotal.toFixed(2)),
      },
    };
    
    try {
        localStorage.setItem(`purchase-${purchaseId}`, JSON.stringify(purchaseData));
        fetchPurchases(); // Re-fetch to update list

        toast({
          title: isEditing ? 'Purchase Updated' : 'Purchase Saved',
          description: `The purchase bill has been successfully ${isEditing ? 'updated' : 'saved'}.`,
        });
        router.push(`/purchase-bill/${purchaseId}`);
    } catch (error) {
        console.error("Error saving purchase:", error);
        toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: 'Could not save the purchase bill.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const loadPurchaseForEdit = (purchase: any) => {
    setBillNo(purchase.billNo);
    setCompanyName(purchase.growerName);
    setDate(purchase.date);
    setRows(purchase.entries.length > 0 ? purchase.entries : initialRows);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

    const handleDeletePurchase = async (billId: string) => {
        if(userRole !== 'admin') {
            toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to delete purchases."});
            return;
        }
        if(!window.confirm(`Are you sure you want to delete Purchase Bill #${billId}? This action cannot be undone.`)) {
            return;
        }

        try {
            localStorage.removeItem(`purchase-${billId}`);
            fetchPurchases(); // Re-fetch to update list

            toast({
                title: "Purchase Deleted",
                description: `Purchase Bill #${billId} has been successfully deleted.`
            })
            if (billNo === billId) {
                resetForm();
            }
        } catch (error) {
            console.error("Error deleting purchase:", error);
            toast({
                variant: "destructive",
                title: "Delete Failed",
                description: "Could not delete the purchase bill."
            })
        }
    }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Record New Purchase</h2>
                    {isEditing && (
                        <Button variant="outline" size="sm" onClick={resetForm} className="gap-2">
                            <FilePlus className="h-4 w-4" />
                            New Purchase
                        </Button>
                    )}
                </div>
                <p className="text-muted-foreground">Enter details for apples purchased from growers at the mandi.</p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="billNo">Bill No</Label>
                        <Input id="billNo" value={billNo} onChange={e => setBillNo(e.target.value)} disabled={isEditing} />
                    </div>
                     <div>
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g., Ahmad Traders" />
                    </div>
                </div>

                <Separator />
                
                <div>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Variety</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Rate</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {rows.map((r, i) => (
                            <TableRow key={i}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell>
                                <Select value={r.type} onValueChange={(value: PurchaseRow['type']) => updateRow(i, { type: value })}>
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Patti">Patti</SelectItem>
                                    <SelectItem value="Dabba">Dabba</SelectItem>
                                </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Input
                                placeholder="e.g., American, Red Delicious"
                                value={r.variety}
                                onChange={e => updateRow(i, { variety: e.target.value })}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                type="number"
                                className="w-24 text-right"
                                placeholder="0"
                                value={r.qty || ''}
                                onChange={e => updateRow(i, { qty: Number(e.target.value) })}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                type="number"
                                className="w-24 text-right"
                                placeholder="0.00"
                                value={r.rate || ''}
                                onChange={e => updateRow(i, { rate: Number(e.target.value) })}
                                />
                            </TableCell>
                            <TableCell className="text-right font-medium">₹{(totals.rowTotals[i] || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => removeRow(i)}>
                                    <Trash2 className="text-red-600 h-4 w-4" />
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={7}>
                                     <Button onClick={addRow} variant="outline" size="sm" className="mt-2">
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Add Item
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
                 <Separator />
                <div className="flex justify-end items-center gap-6 p-4 bg-muted rounded-lg">
                    <div className="text-right">
                        <p className="text-muted-foreground">Total Quantity</p>
                        <p className="text-2xl font-bold">{totals.totalQty}</p>
                    </div>
                     <div className="text-right">
                        <p className="text-muted-foreground">Grand Total</p>
                        <p className="text-2xl font-bold">₹{totals.grandTotal.toFixed(2)}</p>
                    </div>
                </div>

            </CardContent>
            <CardFooter>
                <div className="flex w-full justify-center">
                    <Button onClick={saveToLocalStorage} size="lg" className="w-full max-w-xs" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isEditing ? 'Update Purchase Bill' : 'Save & View Bill'}
                    </Button>
                </div>
            </CardFooter>
        </Card>
        <Card className="lg:col-span-1 h-fit">
            <CardHeader>
                <h3 className="text-lg font-medium">Saved Purchases</h3>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <div className="space-y-2">
                        {isLoading ? (
                             <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                             </div>
                        ) : savedPurchases.length > 0 ? (
                            savedPurchases.map(purchase => (
                            <div key={purchase.billNo} className="flex justify-between items-center p-2 border rounded-md hover:bg-muted">
                                <div>
                                    <p className="font-medium">Bill #{purchase.billNo}</p>
                                    <p className="text-sm text-muted-foreground">{purchase.growerName}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(purchase.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center">
                                    <Button variant="ghost" size="icon" onClick={() => loadPurchaseForEdit(purchase)}>
                                        <FilePenLine className="h-4 w-4" />
                                    </Button>
                                    {userRole === 'admin' && (
                                     <Button variant="ghost" size="icon" onClick={() => handleDeletePurchase(purchase.billNo)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    )}
                                </div>
                            </div>
                            ))
                        ) : (
                           <p className="text-sm text-muted-foreground text-center p-4">No purchases saved yet.</p>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
}
