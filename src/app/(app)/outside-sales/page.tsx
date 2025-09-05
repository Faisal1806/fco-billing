
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Loader2, PlusCircle, Trash2, FilePenLine, FilePlus, Globe, ArrowRight, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { saveDocument, deleteDocument } from '@/lib/actions';
import { ScrollArea } from '@/components/ui/scroll-area';

type BikriEntry = {
    type: 'Patti' | 'Dabba';
    qty: number;
    variety: string;
    rate: number;
};

const emptyRow: BikriEntry = { type: 'Patti', qty: 0, variety: '', rate: 0 };

export default function OutsideSalesPage() {
    const { toast } = useToast();
    const router = useRouter();

    // State for the form
    const [selectedChallanNo, setSelectedChallanNo] = useState('');
    const [bikriNo, setBikriNo] = useState('');
    const [date, setDate] = useState('');
    const [market, setMarket] = useState('');
    const [rows, setRows] = useState<BikriEntry[]>([emptyRow]);
    const [expenses, setExpenses] = useState(0);
    const [commissionRate, setCommissionRate] = useState(0);

    // State for data management
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

    const calculation = useMemo(() => {
        const grossSale = rows.reduce((acc, row) => acc + (Number(row.qty) || 0) * (Number(row.rate) || 0), 0);
        const commissionAmount = grossSale * ((Number(commissionRate) || 0) / 100);
        const freightCost = selectedChallan?.payOnlyFreight || 0;
        const totalExpenses = freightCost + (Number(expenses) || 0) + commissionAmount;
        const netSale = grossSale - totalExpenses;

        return { grossSale, commissionAmount, freightCost, totalExpenses, netSale };
    }, [rows, expenses, commissionRate, selectedChallan]);


    const resetForm = () => {
        setSelectedChallanNo('');
        setBikriNo('');
        setDate('');
        setMarket('');
        setRows([emptyRow]);
        setExpenses(0);
        setCommissionRate(0);
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!selectedChallanNo || !bikriNo || !date || !market) {
            toast({ variant: 'destructive', title: 'Missing Details', description: 'Please fill out all fields before saving.' });
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
            entries: rows.filter(r => r.qty > 0 && r.rate > 0),
            expenses: Number(expenses),
            commissionRate: Number(commissionRate),
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
            setIsSubmitting(false);
        }
    };
    
     const loadBikriForEdit = (bikri: any) => {
        setSelectedChallanNo(bikri.challanNo);
        setBikriNo(bikri.bikriNo);
        setDate(bikri.date);
        setMarket(bikri.market);
        setRows(bikri.entries.length > 0 ? bikri.entries : [emptyRow]);
        setExpenses(bikri.expenses);
        setCommissionRate(bikri.commissionRate || 0);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
    };


    const updateRow = (i: number, patch: Partial<BikriEntry>) => {
        setRows(prev => {
          const copy = [...prev];
          copy[i] = { ...copy[i], ...patch };
          return copy;
        });
    };

    const addRow = () => setRows(prev => [...prev, { ...emptyRow }]);
    const removeRow = (i: number) => setRows(prev => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <div className='flex justify-between items-center'>
                        <CardTitle className="flex items-center gap-2"><Globe className="h-6 w-6" /> Outside Sales Register (Bikri)</CardTitle>
                        {isEditing && <Button variant="outline" size="sm" onClick={resetForm}><FilePlus className="h-4 w-4 mr-2" />Enter New Bikri</Button>}
                    </div>
                    <CardDescription>Enter the sales invoice (Bikri) received from outside markets to calculate your profit/loss.</CardDescription>
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
                            <Label htmlFor="date">Bikri Date</Label>
                            <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="market">Market</Label>
                            <Input id="market" placeholder="e.g., Delhi, Kolkata" value={market} onChange={e => setMarket(e.target.value)} />
                        </div>
                    </div>
                    
                    {selectedChallan && (
                        <Card className="bg-muted/50 p-4">
                            <CardHeader className="p-2">
                                <CardTitle className="text-lg">Challan Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 grid grid-cols-3 gap-4 text-sm">
                                <p><strong>To:</strong> {selectedChallan.toMs}</p>
                                <p><strong>Items Sent:</strong> {selectedChallan.totalNugs}</p>
                                <p><strong>Freight Cost:</strong> ₹{selectedChallan.payOnlyFreight?.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                    )}

                    <Separator />
                    
                    {/* Entries */}
                     <div>
                        <Label className="text-base font-semibold">Bikri Sale Entries</Label>
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Variety</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Rate</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((r, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <Select value={r.type} onValueChange={(v: BikriEntry['type']) => updateRow(i, { type: v })}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Patti">Patti</SelectItem>
                                                    <SelectItem value="Dabba">Dabba</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell><Input placeholder="Variety" value={r.variety} onChange={e => updateRow(i, { variety: e.target.value })}/></TableCell>
                                        <TableCell><Input type="number" className="text-right" value={r.qty || ''} onChange={e => updateRow(i, { qty: Number(e.target.value) })} /></TableCell>
                                        <TableCell><Input type="number" className="text-right" value={r.rate || ''} onChange={e => updateRow(i, { rate: Number(e.target.value) })}/></TableCell>
                                        <TableCell className="text-right font-medium">₹{((r.qty || 0) * (r.rate || 0)).toFixed(2)}</TableCell>
                                        <TableCell><Button variant="ghost" size="icon" onClick={() => removeRow(i)}><Trash2 className="text-red-500 h-4 w-4"/></Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Button onClick={addRow} variant="outline" size="sm" className="mt-2 gap-2"><PlusCircle className="h-4 w-4" /> Add Row</Button>
                    </div>

                    <Separator />
                    
                    {/* Calculation */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                             <div>
                                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                                <div className="relative">
                                     <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                     <Input id="commissionRate" type="number" className="pl-8" placeholder="e.g., 8 for 8%" value={commissionRate || ''} onChange={e => setCommissionRate(Number(e.target.value))} />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="expenses">Other Expenses from Bikri (Labour, etc.)</Label>
                                <Input id="expenses" type="number" value={expenses || ''} onChange={e => setExpenses(Number(e.target.value))} />
                            </div>
                        </div>
                        <Card className="p-4 bg-muted">
                            <h3 className="font-bold text-lg mb-2">Profit / Loss Calculation</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Gross Sale from Bikri:</span> <span className="font-medium">₹{calculation.grossSale.toFixed(2)}</span></div>
                                <div className="flex justify-between text-red-500"><span>(-) Commission:</span> <span className="font-medium">₹{calculation.commissionAmount.toFixed(2)}</span></div>
                                <div className="flex justify-between text-red-500"><span>(-) Freight from Challan:</span> <span className="font-medium">₹{calculation.freightCost.toFixed(2)}</span></div>
                                <div className="flex justify-between text-red-500"><span>(-) Other Expenses:</span> <span className="font-medium">₹{(Number(expenses) || 0).toFixed(2)}</span></div>
                                <Separator />
                                <div className={`flex justify-between font-bold text-lg ${calculation.netSale >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    <span>Net Profit / Loss:</span>
                                    <span>₹{calculation.netSale.toFixed(2)}</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                </CardContent>
                <CardFooter>
                    <Button onClick={handleSave} disabled={isSubmitting} className="w-full max-w-xs mx-auto">
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {isEditing ? 'Update Bikri Record' : 'Save Bikri Record'}
                    </Button>
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
                                                <p className="text-sm text-muted-foreground">Challan #{bikri.challanNo} <ArrowRight className="h-3 w-3 inline"/> Bikri #{bikri.bikriNo}</p>
                                                 <p className={`text-lg font-bold ${bikri.calculation.netSale >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    Profit: ₹{bikri.calculation.netSale.toFixed(2)}
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

    