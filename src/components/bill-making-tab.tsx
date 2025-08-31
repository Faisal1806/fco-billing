
'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, setDoc, getDoc, onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Separator } from './ui/separator';
import { Loader2, PlusCircle, Trash2, FilePenLine, FilePlus } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

type Row = {
  type: 'Patti' | 'Dabba';
  qty: number;
  variety: string;
  rate: number;
};

const emptyRow: Row = { type: 'Patti', qty: 0, variety: '', rate: 0 };
const initialRows: Row[] = Array.from({ length: 5 }, () => ({ ...emptyRow }));


export function BillMakingTab() {
  const [sNo, setSNo] = useState('');
  const [ms, setMs] = useState('');                 // M/S (customer)
  const [khata, setKhata] = useState('');           // Khata No
  const [challanNo, setChallanNo] = useState('');   // Challan / Rokat / Watak No (free text)
  const [date, setDate] = useState('');
  const [freight, setFreight] = useState<number>(0);
  const [rows, setRows] = useState<Row[]>(initialRows);

  const { toast } = useToast();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedBills, setSavedBills] = useState<any[]>([]);


  useEffect(() => {
    const q = query(collection(db, "wataks"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const bills = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSavedBills(bills);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching bills:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch recent bills from Firestore."
        });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);


  // --- Calculations (ALL from your spec) ---
  const totals = useMemo(() => {
    const totalQty = rows.reduce((s, r) => s + (Number(r.qty) || 0), 0);
    const pattiQty = rows
      .filter(r => r.type === 'Patti')
      .reduce((s, r) => s + (Number(r.qty) || 0), 0);
    const dabbaQty = rows
      .filter(r => r.type === 'Dabba')
      .reduce((s, r) => s + (Number(r.qty) || 0), 0);

    const rowGross = rows.map(r => (Number(r.qty) || 0) * (Number(r.rate) || 0));
    const totalGrossSale = rowGross.reduce((s, v) => s + v, 0);

    // Expenses by formula
    const labour = totalQty * 3;
    const association = totalQty * 0.1;
    const security = totalQty * 0.9;
    const commission = totalGrossSale * 0.12;

    const totalExp = commission + labour + association + security + (Number(freight) || 0);
    const netSale = totalGrossSale - totalExp;

    return {
      pattiQty,
      dabbaQty,
      totalQty,
      totalGrossSale,
      commission,
      labour,
      association,
      security,
      totalExp,
      netSale,
      rowGross,
    };
  }, [rows, freight]);

  const updateRow = (i: number, patch: Partial<Row>) => {
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
        setSNo('');
        setMs('');
        setKhata('');
        setChallanNo('');
        setDate('');
        setFreight(0);
        setRows(initialRows);
        setIsEditing(false);
    };


  const saveToFirestore = async () => {
     if (!sNo || !date || !ms) {
        toast({
            variant: 'destructive',
            title: 'Missing Details',
            description: 'Please fill in Bill No, Date, and Customer Name before saving.',
        });
        return;
    }

    setIsSubmitting(true);
    const billId = sNo;
    const billData = {
      sNo,
      date,
      customerName: ms,
      khata,
      challanNo,
      freight: Number(freight) || 0,
      entries: rows.map(r => ({...r, total: r.qty * r.rate})),
      totals: {
        pattiQty: totals.pattiQty,
        dabbaQty: totals.dabbaQty,
        totalQty: totals.totalQty,
        grossSale: Number(totals.totalGrossSale.toFixed(2)),
        commissionAmount: Number(totals.commission.toFixed(2)),
        labour: Number(totals.labour.toFixed(2)),
        association: Number(totals.association.toFixed(2)),
        security: Number(totals.security.toFixed(2)),
        totalExpenses: Number(totals.totalExp.toFixed(2)),
        netSale: Number(totals.netSale.toFixed(2)),
      },
      createdAt: serverTimestamp(),
    };
    
    try {
        await setDoc(doc(db, "wataks", billId), billData, { merge: true });
        
        localStorage.setItem(`invoice-${billId}`, JSON.stringify(billData));

        toast({
          title: isEditing ? 'Bill Updated' : 'Bill Saved',
          description: `The bill has been successfully ${isEditing ? 'updated' : 'saved'} to Firestore.`,
        });
        router.push(`/invoice/${billId}`);
    } catch (error) {
        console.error("Error saving bill:", error);
        toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: 'Could not save the bill to Firestore.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const loadBillForEdit = (bill: any) => {
    setSNo(bill.sNo);
    setMs(bill.customerName);
    setKhata(bill.khata || '');
    setChallanNo(bill.challanNo || '');
    setDate(bill.date);
    setFreight(bill.freight || 0);
    setRows(bill.entries || initialRows);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

    const handleDeleteBill = async (billId: string) => {
        if(!window.confirm(`Are you sure you want to delete Bill #${billId}? This action cannot be undone.`)) {
            return;
        }

        try {
            await deleteDoc(doc(db, "wataks", billId));
            localStorage.removeItem(`invoice-${billId}`);
            toast({
                title: "Bill Deleted",
                description: `Bill #${billId} has been successfully deleted.`
            })
        } catch (error) {
            console.error("Error deleting bill:", error);
            toast({
                variant: "destructive",
                title: "Delete Failed",
                description: "Could not delete the bill from Firestore."
            })
        }
    }

  const printNow = () => {
    if (!sNo) {
        toast({ variant: 'destructive', title: 'Cannot Print', description: 'Please save the bill first to generate a printable version.'});
        return;
    }
    router.push(`/invoice/${sNo}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="text-center flex-1">
                        <h2 className="text-2xl font-bold">FIRDOUS AHMAD & COMPANY</h2>
                        <p className="text-sm text-muted-foreground">Fruit Merchants & Commission Agents</p>
                        <p className="text-xs text-muted-foreground">SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.</p>
                        <p className="text-xs text-muted-foreground">Prop: Firdous Ahmad Lone (Nadihal) | Cell: 7006136330, 9797002164</p>
                    </div>
                    {isEditing && (
                        <Button variant="outline" size="sm" onClick={resetForm} className="gap-2">
                            <FilePlus className="h-4 w-4" />
                            New Bill
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                 {/* Header fields */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div>
                        <Label>Bill No</Label>
                        <Input value={sNo} onChange={e => setSNo(e.target.value)} disabled={isEditing} />
                    </div>
                     <div>
                        <Label>Date</Label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                        <Label>M/S (Customer)</Label>
                        <Input value={ms} onChange={e => setMs(e.target.value)} />
                    </div>
                    <div>
                        <Label>Khata No</Label>
                        <Input value={khata} onChange={e => setKhata(e.target.value)} />
                    </div>
                    <div>
                        <Label>Challan / Watak No</Label>
                        <Input value={challanNo} onChange={e => setChallanNo(e.target.value)} />
                    </div>
                </div>

                <Separator />
                
                {/* Table */}
                <div ref={printRef}>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Variety</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Rate</TableHead>
                            <TableHead className="text-right">Gross</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {rows.map((r, i) => (
                            <TableRow key={i}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell>
                                <Select value={r.type} onValueChange={(value: Row['type']) => updateRow(i, { type: value })}>
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
                                placeholder="Variety (e.g., A2/5)"
                                value={r.variety}
                                onChange={e => updateRow(i, { variety: e.target.value })}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                type="number"
                                className="w-24 text-right"
                                value={r.qty || ''}
                                onChange={e => updateRow(i, { qty: Number(e.target.value) })}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                type="number"
                                className="w-24 text-right"
                                value={r.rate || ''}
                                onChange={e => updateRow(i, { rate: Number(e.target.value) })}
                                />
                            </TableCell>
                            <TableCell className="text-right">{(totals.rowGross[i] || 0).toFixed(2)}</TableCell>
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
                                        Add Row
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>

                 <Separator />

                {/* Totals & Expenses */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                    <div className="space-y-1">
                        <h3 className="font-bold mb-2">Quantity</h3>
                        <div>🧺 Total Patti: <b>{totals.pattiQty}</b></div>
                        <div>🍱 Total Dabba: <b>{totals.dabbaQty}</b></div>
                        <div className="font-bold">📦 Total Quantity: <b>{totals.totalQty}</b></div>
                    </div>

                    <div className="space-y-2">
                         <h3 className="font-bold mb-2">Expenses</h3>
                        <div>Labour (Qty×3): <b>{totals.labour.toFixed(2)}</b></div>
                        <div>Association (Qty×0.1): <b>{totals.association.toFixed(2)}</b></div>
                        <div>Security (Qty×0.9): <b>{totals.security.toFixed(2)}</b></div>
                        <div className="flex items-center gap-2">
                        <Label>Freight:</Label>
                        <Input
                            type="number"
                            className="w-28 text-right"
                            value={freight || ''}
                            onChange={e => setFreight(Number(e.target.value))}
                        />
                        </div>
                    </div>

                    <div className="space-y-1 bg-muted p-3 rounded-md">
                        <h3 className="font-bold mb-2">Financial Summary</h3>
                        <div>💰 Gross Sale: <b>{totals.totalGrossSale.toFixed(2)}</b></div>
                        <div>Commission (12%): <b>{totals.commission.toFixed(2)}</b></div>
                        <div className="font-bold">📉 Total Exp: <b>{totals.totalExp.toFixed(2)}</b></div>
                        <div className="text-lg font-bold mt-2 border-t pt-2">🔻 Net Sale: <b>{totals.netSale.toFixed(2)}</b></div>
                    </div>
                </div>

            </CardContent>
            <CardFooter>
                <div className="flex w-full justify-center gap-3">
                    <Button onClick={saveToFirestore} className="w-full max-w-xs" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isEditing ? 'Update Watak' : 'Save Watak'}
                    </Button>
                    <Button onClick={printNow} variant="secondary" className="w-full max-w-xs">
                        Print / PDF
                    </Button>
                </div>
            </CardFooter>
        </Card>
        <Card className="md:col-span-1 h-fit">
            <CardHeader>
                <h3 className="text-lg font-medium">Recent Bills</h3>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <div className="space-y-2">
                        {isLoading ? (
                             <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                             </div>
                        ) : savedBills.length > 0 ? (
                            savedBills.map(bill => (
                            <div key={bill.id} className="flex justify-between items-center p-2 border rounded-md">
                                <div>
                                    <p className="font-medium">Bill #{bill.sNo}</p>
                                    <p className="text-sm text-muted-foreground">{bill.customerName}</p>
                                    <p className="text-sm text-muted-foreground">{new Date(bill.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center">
                                    <Button variant="ghost" size="icon" onClick={() => loadBillForEdit(bill)}>
                                        <FilePenLine className="h-4 w-4" />
                                    </Button>
                                     <Button variant="ghost" size="icon" onClick={() => handleDeleteBill(bill.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                            ))
                        ) : (
                           <p className="text-sm text-muted-foreground text-center">No recent bills found.</p>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
}
