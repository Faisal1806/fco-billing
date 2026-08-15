

'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Loader2, PlusCircle, Trash2, FilePenLine, FilePlus, FileText, Search, ShoppingBasket } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { saveDocument, deleteDocument } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import { PartySelector } from '@/components/party-selector';
import PageHeader from '@/components/PageHeader';
import { getDocuments } from '@/lib/actions';

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
  const [growerName, setGrowerName] = useState('');
  const [date, setDate] = useState('');
  const [rows, setRows] = useState<PurchaseRow[]>(initialRows);
  const [purchaseFor, setPurchaseFor] = useState<'Customer' | 'Own Stock (F.Co)'>('Customer');


  const { toast } = useToast();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedPurchases, setSavedPurchases] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [purchaseSection, setPurchaseSection] = useState<
  'customer' | 'own'
>('customer');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole'));
    }
  }, []);

  const fetchPurchases = useCallback(async () => {
  setIsLoading(true);

  try {
    const res = await fetch(
      '/api/documents?collection=purchases',
      {
        cache: 'no-store',
      }
    );

    const result = await res.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to load purchases');
    }

    const loadedPurchases = result.data || [];

    setSavedPurchases(
      loadedPurchases.sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
    );
  } catch (error) {
    console.error('Failed to load purchases:', error);

    toast({
      variant: 'destructive',
      title: 'Failed to load purchases',
      description: 'Could not connect to the cloud database.',
    });
  } finally {
    setIsLoading(false);
  }
}, [toast]);


  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);
  
  const yearlyCount = useMemo(() => {
    if(!savedPurchases) return 0;
    const currentYear = new Date().getFullYear();
    return savedPurchases.filter(p => new Date(p.date).getFullYear() === currentYear).length;
  }, [savedPurchases]);

  const yearlyNugs = useMemo(() => {
    if(!savedPurchases) return 0;
    const currentYear = new Date().getFullYear();
    return savedPurchases
      .filter(p => new Date(p.date).getFullYear() === currentYear)
      .reduce((acc, p) => acc + (p.totals?.totalQty || 0), 0);
  }, [savedPurchases]);

  const filteredPurchases = useMemo(() => {
    if (!searchTerm) return savedPurchases;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return savedPurchases.filter(purchase => 
      purchase.billNo?.toLowerCase().includes(lowerCaseSearch) ||
      purchase.growerName?.toLowerCase().includes(lowerCaseSearch)
    );
  }, [savedPurchases, searchTerm]);


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
        setGrowerName('');
        setDate('');
        setPurchaseFor('Customer');
        setRows(initialRows);
        setIsEditing(false);
    };


  const savePurchase = async () => {
     if (!billNo || !date || (purchaseFor === 'Customer' && !growerName)) {
        toast({
            variant: 'destructive',
            title: 'Missing Details',
            description: 'Please fill in Bill No, Date, and Customer Name before saving.',
        });
        return;
    }

    setIsSubmitting(true);
    const purchaseId = `purchase-${billNo}`;
    const finalGrowerName = purchaseFor === 'Own Stock (F.Co)' ? 'F.Co (Own Stock)' : growerName;
    const purchaseData = {
      id: purchaseId, // Add id field for consistency
      billNo,
      date,
      growerName: finalGrowerName,
      purchaseFor,
      entries: rows.filter(r => r.qty > 0 && r.rate > 0).map(r => ({...r, qty: Number(r.qty), rate: Number(r.rate), total: Number(r.qty) * Number(r.rate)})),
      totals: {
        totalQty: totals.totalQty,
        grandTotal: Number(totals.grandTotal.toFixed(2)),
      },
    };
    
    // Save to local storage first for immediate access
    const result = await saveDocument(
      'purchases',
      purchaseId,
      purchaseData
    );

    if (!result.success) {
      throw new Error(result.error || 'Cloud save failed');
    }

    try {
        await saveDocument(purchaseId, purchaseData);
    } catch (error) {
        console.error("Cloud sync failed:", error)
    }

    toast({
        title: isEditing ? 'Purchase Updated' : 'Purchase Saved',
        description: `The purchase bill has been successfully saved.`,
    });
    fetchPurchases();
    setIsEditing(true); 
    setIsSubmitting(false);
  };

  const viewPurchase = () => {
    if (!isEditing || !billNo) {
        toast({
            variant: 'destructive',
            title: 'Cannot View Bill',
            description: 'Please save the purchase before viewing.',
        });
        return;
    }
    router.push(`/purchase-bill/${billNo}`);
  };

  const loadPurchaseForEdit = (purchase: any) => {
    setBillNo(purchase.billNo);
    setGrowerName(purchase.growerName === 'F.Co (Own Stock)' ? '' : purchase.growerName);
    setDate(purchase.date);
    setPurchaseFor(purchase.purchaseFor || (purchase.growerName === 'F.Co (Own Stock)' ? 'Own Stock (F.Co)' : 'Customer'));
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
        
        const docId = `purchase-${billId}`;
        localStorage.removeItem(docId);
        fetchPurchases();
        toast({
            title: "Purchase Deleted",
            description: `Purchase Bill #${billId} has been successfully deleted.`
        });
        
        if (billNo === billId) {
            resetForm();
        }

        // Attempt to delete from cloud but don't block UI
        try {
          await deleteDocument(docId);
        } catch (error) {
            console.error("Cloud delete failed:", error);
        }
    }
return (
  <div className="space-y-6">
    <PageHeader
      title={
        purchaseSection === 'customer'
          ? 'Record Customer Purchase'
          : 'Record F.Co Purchase'
      }
      description={
        purchaseSection === 'customer'
          ? 'Enter details for apples purchased from growers at the mandi.'
          : 'Record apples and other stock purchased by F.Co from suppliers.'
      }
      icon={<ShoppingBasket className="h-8 w-8" />}
      imageUrl="/assets/3d/purchases.png"
    />

    {/* PURCHASE SECTION SWITCH */}
    <div className="flex justify-center">
      <div className="inline-flex rounded-xl border bg-muted p-1 shadow-sm">
        <Button
          type="button"
          variant={
            purchaseSection === 'customer'
              ? 'default'
              : 'ghost'
          }
          className="gap-2 rounded-lg"
          onClick={() => setPurchaseSection('customer')}
        >
          <ArrowDownToLine className="h-4 w-4" />
          Customer Purchases
        </Button>

        <Button
          type="button"
          variant={
            purchaseSection === 'own'
              ? 'default'
              : 'ghost'
          }
          className="gap-2 rounded-lg"
          onClick={() => setPurchaseSection('own')}
        >
          <Store className="h-4 w-4" />
          F.Co Purchases
        </Button>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"></div>
            description="Enter details for apples purchased from growers at the mandi."
            icon={<ShoppingBasket className="h-8 w-8" />}
            imageUrl="/assets/3d/purchases.png"
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="billNo">Bill No</Label>
                            <Input id="billNo" value={billNo} onChange={e => setBillNo(e.target.value)} disabled={isEditing} />
                        </div>
                        <div>
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="purchaseFor">Purchase For</Label>
                            <Select value={purchaseFor} onValueChange={(value: 'Customer' | 'Own Stock (F.Co)') => setPurchaseFor(value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Customer">Customer</SelectItem>
                                    <SelectItem value="Own Stock (F.Co)">Own Stock (F.Co)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="growerName">
                                {purchaseFor === 'Customer' ? 'Customer Name' : 'Company Name'}
                            </Label>
                            {purchaseFor === 'Customer' ? (
                                <PartySelector value={growerName} onChange={setGrowerName} filter="customer" />
                            ) : (
                                <Input 
                                    id="growerName" 
                                    value="F.Co (Own Stock)"
                                    disabled
                                />
                            )}
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
                                    onChange={e => updateRow(i, { qty: Number(e.target.value) || 0 })}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                    type="number"
                                    className="w-24 text-right"
                                    placeholder="0.00"
                                    value={r.rate || ''}
                                    onChange={e => updateRow(i, { rate: Number(e.target.value) || 0 })}
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
                    <div className="flex w-full justify-center gap-4">
                        <Button onClick={savePurchase} className="w-full max-w-xs" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isEditing ? 'Update Purchase' : 'Save Purchase'}
                        </Button>
                        <Button onClick={viewPurchase} variant="secondary" className="w-full max-w-xs gap-2" disabled={!isEditing}>
                            <FileText className="h-4 w-4" /> View Bill
                        </Button>
                    </div>
                </CardFooter>
            </Card>
            <Card className="lg:col-span-1 h-fit">
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">Recent Purchases</h3>
                        {!isLoading && <Badge variant="secondary">{yearlyCount} This Year</Badge>}
                        </div>
                        <div className="relative w-full max-w-[150px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search..." 
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                        Total Nugs Purchased This Year: <span className="font-bold text-foreground">{yearlyNugs.toLocaleString()}</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-96">
                        <div className="space-y-2">
                            {isLoading ? (
                                <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : filteredPurchases.length > 0 ? (
                                filteredPurchases.map(purchase => (
                                <div key={purchase.id} className="flex justify-between items-center p-2 border rounded-md hover:bg-muted">
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
    </div>
  );
}
