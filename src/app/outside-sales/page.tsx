'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, FilePenLine, FilePlus, Globe, Percent, Minus, Package, ShoppingCart, Truck, FileText, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { saveDocument, deleteDocument } from '@/lib/actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PartySelector } from '@/components/party-selector';
import { EntryTable, emptyRow, type EntryRow } from '@/components/outside-sales-entry-table';


export default function OutsideSalesPage() {
    const { toast } = useToast();
    const router = useRouter();

    // Form State
    const [selectedChallanNo, setSelectedChallanNo] = useState('');
    const [bikriNo, setBikriNo] = useState('');
    const [date, setDate] = useState('');
    const [market, setMarket] = useState('');
    
    // Entries
    const [purchaseRows, setPurchaseRows] = useState<EntryRow[]>([emptyRow]);
    const [saleRows, setSaleRows] = useState<EntryRow[]>([emptyRow]);

    // Expenses
    const [expenses, setExpenses] = useState(0);
    const [commissionRate, setCommissionRate] = useState(0);
    const [freightPerPatti, setFreightPerPatti] = useState(0);


    // Data Management
    const [availableChallans, setAvailableChallans] = useState<any[]>([]);
    const [savedBikris, setSavedBikris] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setUserRole(localStorage.getItem('userRole'));
        }
    }, []);

    useEffect(() => {
        const fetchData = () => {
            setIsLoading(true);
            const allChallans = [];
            const allBikris = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('challan-')) {
                    allChallans.push(JSON.parse(localStorage.getItem(key)!));
                }
                if (key?.startsWith('bikri-')) {
                    allBikris.push(JSON.parse(localStorage.getItem(key)!));
                }
            }
            setAvailableChallans(allChallans.sort((a,b) => (a.challanNo > b.challanNo) ? 1 : -1));
            setSavedBikris(allBikris);
            setIsLoading(false);
        };
        fetchData();
    }, []);
    
    const selectedChallan = useMemo(() => {
        return availableChallans.find(c => c.challanNo === selectedChallanNo);
    }, [selectedChallanNo, availableChallans]);

     useEffect(() => {
        if (selectedChallan && !isEditing) {
            setMarket(selectedChallan.toMs);

            const newSaleRows: EntryRow[] = [];
            selectedChallan.entries.forEach((entry: any) => {
                if (entry.peti > 0) {
                    newSaleRows.push({ type: 'Patti', variety: entry.kind, qty: entry.peti, rate: 0 });
                }
                if (entry.daba > 0) {
                    newSaleRows.push({ type: 'Dabba', variety: entry.kind, qty: entry.daba, rate: 0 });
                }
            });

            if(newSaleRows.length > 0) {
                setSaleRows(newSaleRows);
            } else {
                setSaleRows([emptyRow]);
            }
        }
    }, [selectedChallan, isEditing]);

    const calculation = useMemo(() => {
        const totalPurchaseCost = purchaseRows.reduce((acc, row) => acc + (Number(row.qty) || 0) * (Number(row.rate) || 0), 0);
        const grossSale = saleRows.reduce((acc, row) => acc + (Number(row.qty) || 0) * (Number(row.rate) || 0), 0);
        const commissionAmount = grossSale * ((Number(commissionRate) || 0) / 100);

        const pattiQty = saleRows.filter(r => r.type === 'Patti').reduce((acc, r) => acc + (Number(r.qty) || 0), 0);
        const dabbaQty = saleRows.filter(r => r.type === 'Dabba').reduce((acc, r) => acc + (Number(r.qty) || 0), 0);
        const calculatedFreight = (pattiQty * (Number(freightPerPatti) || 0)) + (dabbaQty * ((Number(freightPerPatti) || 0) / 2));
        
        const totalExpenses = calculatedFreight + (Number(expenses) || 0) + commissionAmount;
        const netSale = grossSale - totalExpenses;
        const netProfitOrLoss = netSale - totalPurchaseCost;

        return { totalPurchaseCost, grossSale, commissionAmount, calculatedFreight, totalExpenses, netSale, netProfitOrLoss };
    }, [purchaseRows, saleRows, expenses, commissionRate, freightPerPatti]);


    const resetForm = () => {
        setSelectedChallanNo('');
        setBikriNo('');
        setDate('');
        setMarket('');
        setPurchaseRows([emptyRow]);
        setSaleRows([emptyRow]);
        setExpenses(0);
        setCommissionRate(0);
        setFreightPerPatti(0);
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!selectedChallanNo || !bikriNo || !date || !market) {
            toast({ variant: 'destructive', title: 'Missing Details', description: 'Please fill out all required header fields before saving.' });
            return;
        }
        setIsSubmitting(true);
        const id = `${selectedChallanNo}-${bikriNo}`;
        const data = {
            id,
            challanNo: selectedChallanNo,
            bikriNo,
            date,
            market,
            purchaseEntries: purchaseRows.filter(r => r.qty > 0 && r.rate > 0).map(r => ({...r, total: r.qty * r.rate})),
            saleEntries: saleRows.filter(r => r.qty > 0 && r.rate > 0).map(r => ({...r, total: r.qty * r.rate})),
            expenses: Number(expenses),
            commissionRate: Number(commissionRate),
            freightPerPatti: Number(freightPerPatti),
            calculation
        };
        localStorage.setItem(`bikri-${id}`, JSON.stringify(data));
        try {
            await saveDocument('bikris', id, data);
            toast({ title: isEditing ? 'Bikri Updated' : 'Bikri Saved', description: 'The outside sale has been recorded.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Sync Failed', description: 'Saved locally, but failed to sync to cloud.' });
        } finally {
            setSavedBikris(prev => {
                const existing = prev.findIndex(b => b.id === data.id);
                if (existing > -1) {
                    const copy = [...prev];
                    copy[existing] = data;
                    return copy;
                }
                return [...prev, data];
            });
            setIsEditing(true);
            setIsSubmitting(false);
        }
    };
    
     const loadBikriForEdit = (bikri: any) => {
        setSelectedChallanNo(bikri.challanNo);
        setBikriNo(bikri.bikriNo);
        setDate(bikri.date);
        setMarket(bikri.market);
        setPurchaseRows(bikri.purchaseEntries?.length > 0 ? bikri.purchaseEntries : [emptyRow]);
        setSaleRows(bikri.saleEntries?.length > 0 ? bikri.saleEntries : [emptyRow]);
        setExpenses(bikri.expenses);
        setCommissionRate(bikri.commissionRate || 0);
        setFreightPerPatti(bikri.freightPerPatti || 0);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const viewBikri = () => {
        if (!isEditing || !bikriNo) {
            toast({
                variant: 'destructive',
                title: 'Cannot View Bikri',
                description: 'Please save the Bikri record before viewing.',
            });
            return;
        }
        const id = `${selectedChallanNo}-${bikriNo}`;
        router.push(`/bikri-bill/${id}`);
    };
    
    const handleDelete = async (id: string) => {
        if(userRole !== 'admin') {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'You cannot delete this record.' });
            return;
        }
        if(!window.confirm('Are you sure you want to delete this Bikri record?')) return;
        
        localStorage.removeItem(`bikri-${id}`);
        try {
            await deleteDocument('bikris', id);
            toast({title: 'Record Deleted', description: 'The Bikri record has been removed.'});
        } catch (error) {
            toast({variant: 'destructive', title: 'Cloud Delete Failed', description: 'Record removed locally.'});
        }
        setSavedBikris(prev => prev.filter(b => b.id !== id));
         if (`${selectedChallanNo}-${bikriNo}` === id) {
            resetForm();
        }
    };

    const updatePurchaseRow = useCallback((i: number, patch: Partial<EntryRow>) => {
        setPurchaseRows(prev => {
          const copy = [...prev];
          copy[i] = { ...copy[i], ...patch };
          return copy;
        });
    }, []);
    const addPurchaseRow = useCallback(() => setPurchaseRows(prev => [...prev, { ...emptyRow }]), []);
    const removePurchaseRow = useCallback((i: number) => setPurchaseRows(prev => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)), []);

    const updateSaleRow = useCallback((i: number, patch: Partial<EntryRow>) => {
        setSaleRows(prev => {
          const copy = [...prev];
          copy[i] = { ...copy[i], ...patch };
          return copy;
        });
    }, []);
    const addSaleRow = useCallback(() => setSaleRows(prev => [...prev, { ...emptyRow }]), []);
    const removeSaleRow = useCallback((i: number) => setSaleRows(prev => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)), []);
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <div className='flex justify-between items-center'>
                        <CardTitle className="flex items-center gap-2"><Globe className="h-6 w-6" /> Outside Sales Register (Bikri)</CardTitle>
                        {isEditing && <Button variant="outline" size="sm" onClick={resetForm}><FilePlus className="h-4 w-4 mr-2" />Enter New Bikri</Button>}
                    </div>
                    <CardDescription>Enter the purchase cost and sales invoice (Bikri) received from outside markets to calculate your profit/loss.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Header */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <Label htmlFor="challanNo">Original Challan No.</Label>
                            <Select value={selectedChallanNo} onValueChange={setSelectedChallanNo} disabled={isEditing}>
                                <SelectTrigger id="challanNo"><SelectValue placeholder="Select Challan" /></SelectTrigger>
                                <SelectContent>
                                    {availableChallans.map(c => <SelectItem key={c.challanNo} value={c.challanNo}>{c.challanNo} - {c.toMs}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div>
                            <Label htmlFor="bikriNo">Bikri No.</Label>
                            <Input id="bikriNo" value={bikriNo} onChange={e => setBikriNo(e.target.value)} disabled={isEditing}/>
                        </div>
                        <div>
                            <Label htmlFor="bikriDate">Bikri Date</Label>
                            <Input id="bikriDate" type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="market">Market / Outside Party</Label>
                            <PartySelector value={market} onChange={setMarket} filter="outside" />
                        </div>
                    </div>
                    
                    {selectedChallan && (
                        <Card className="bg-muted/50 p-4">
                            <CardHeader className="p-2">
                                <CardTitle className="text-lg">Challan Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 grid grid-cols-2 gap-4 text-sm">
                                <p><strong>To:</strong> {selectedChallan.toMs}</p>
                                <p><strong>Items Sent:</strong> {selectedChallan.totalNugs}</p>
                            </CardContent>
                        </Card>
                    )}

                    <Separator />
                    
                    <div className="space-y-6">
                         <EntryTable 
                            title="Original Purchase Cost (in Sopore)" 
                            rows={purchaseRows} 
                            icon={<ShoppingCart className="h-5 w-5 text-blue-500" />}
                            onUpdate={updatePurchaseRow}
                            onAdd={addPurchaseRow}
                            onRemove={removePurchaseRow}
                        />
                         <EntryTable
                            title="Bikri Sale Entries" 
                            rows={saleRows} 
                            icon={<Package className="h-5 w-5 text-green-500" />}
                            onUpdate={updateSaleRow}
                            onAdd={addSaleRow}
                            onRemove={removeSaleRow}
                        />
                    </div>

                    <Separator />
                    
                    {/* Calculation */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="freightPerPatti">Freight Rate per Patti</Label>
                                <div className="relative">
                                    <Truck className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="freightPerPatti" type="number" className="pl-8" placeholder="e.g., 250" value={freightPerPatti || ''} onChange={e => setFreightPerPatti(Number(e.target.value))} />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Dabba freight is calculated as half of the Patti rate.</p>
                            </div>
                             <div>
                                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                                <div className="relative">
                                     <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                     <Input id="commissionRate" type="number" className="pl-8" placeholder="e.g., 8 for 8%" value={commissionRate || ''} onChange={e => setCommissionRate(Number(e.target.value))} />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="expenses">Other Expenses from Bikri (Labour, etc.)</Label>
                                 <div className="relative">
                                    <Minus className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="expenses" type="number" className="pl-8" value={expenses || ''} onChange={e => setExpenses(Number(e.target.value))} />
                                </div>
                            </div>
                        </div>
                        <Card className="p-4 bg-muted">
                            <h3 className="font-bold text-lg mb-2">Profit / Loss Calculation</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Gross Sale from Bikri:</span> <span className="font-medium">₹{calculation.grossSale.toFixed(2)}</span></div>
                                <div className="flex justify-between text-destructive"><span>(-) Total Purchase Cost:</span> <span className="font-medium">₹{calculation.totalPurchaseCost.toFixed(2)}</span></div>
                                <div className="flex justify-between text-destructive"><span>(-) Calculated Freight:</span> <span className="font-medium">₹{calculation.calculatedFreight.toFixed(2)}</span></div>
                                <div className="flex justify-between text-destructive"><span>(-) Commission:</span> <span className="font-medium">₹{calculation.commissionAmount.toFixed(2)}</span></div>
                                <div className="flex justify-between text-destructive"><span>(-) Other Expenses:</span> <span className="font-medium">₹{(Number(expenses) || 0).toFixed(2)}</span></div>
                                <Separator />
                                <div className={`flex justify-between font-bold text-lg ${calculation.netProfitOrLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    <span>Net Profit / Loss:</span>
                                    <span>₹{calculation.netProfitOrLoss.toFixed(2)}</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                </CardContent>
                <CardFooter>
                     <div className="flex w-full justify-center gap-4">
                        <Button onClick={handleSave} className="w-full max-w-xs" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {isEditing ? 'Update Bikri Record' : 'Save Bikri Record'}
                        </Button>
                        <Button onClick={viewBikri} variant="secondary" className="w-full max-w-xs gap-2" disabled={!isEditing}>
                            <FileText className="h-4 w-4" /> View Bikri
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            <Card className="lg:col-span-1 h-fit">
                <CardHeader><CardTitle>Saved Bikris</CardTitle></CardHeader>
                <CardContent>
                    <ScrollArea className="h-[500px]">
                        {isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> :
                         savedBikris.length > 0 ? (
                            <div className="space-y-2">
                                {savedBikris.map(bikri => (
                                    <Card key={bikri.id} className="p-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold">{bikri.market} Market</p>
                                                <p className="text-sm text-muted-foreground">Challan #{bikri.challanNo} &rarr; Bikri #{bikri.bikriNo}</p>
                                                 <p className={`text-lg font-bold ${bikri.calculation.netProfitOrLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    Profit: ₹{bikri.calculation.netProfitOrLoss.toFixed(2)}
                                                 </p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="flex">
                                                    <Button variant="ghost" size="icon" onClick={() => loadBikriForEdit(bikri)}><FilePenLine className="h-4 w-4"/></Button>
                                                    {userRole === 'admin' && <Button variant="ghost" size="icon" onClick={() => handleDelete(bikri.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}
                                                </div>
                                                 <p className="text-xs text-muted-foreground mt-2">{new Date(bikri.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                         ) : <p className="text-sm text-center text-muted-foreground">No outside sales records yet.</p>
                        }
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
