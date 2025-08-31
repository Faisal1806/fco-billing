
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, FilePenLine, FilePlus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ScrollArea } from './ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';

type ProductEntry = {
  peti: number;
  dabba: number;
  variety: string;
  noAndTeh: string;
  rate: number;
};

const ProductEntryRow = ({
  entry,
  onUpdate,
  onRemove,
}: {
  entry: ProductEntry;
  onUpdate: (field: keyof ProductEntry, value: string | number) => void;
  onRemove: () => void;
}) => (
  <div className="flex items-center gap-2">
    <Input
      type="number"
      placeholder="Peti"
      value={entry.peti || ''}
      onChange={(e) => onUpdate('peti', Number(e.target.value))}
      className="w-20"
    />
    <Input
      type="number"
      placeholder="Dabba"
      value={entry.dabba || ''}
      onChange={(e) => onUpdate('dabba', Number(e.target.value))}
      className="w-20"
    />
    <Input
      type="text"
      placeholder="Variety"
      value={entry.variety}
      onChange={(e) => onUpdate('variety', e.target.value)}
    />
    <Input
      type="text"
      placeholder="No. & Teh"
      value={entry.noAndTeh}
      onChange={(e) => onUpdate('noAndTeh', e.target.value)}
      className="w-28"
    />
    <Input
      type="number"
      placeholder="Rate"
      value={entry.rate || ''}
      onChange={(e) => onUpdate('rate', Number(e.target.value))}
      className="w-28"
    />
    <Button variant="ghost" size="icon" onClick={onRemove}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  </div>
);

export function BillMakingTab() {
  const { toast } = useToast();
  const router = useRouter();

  const initialBillDetails = {
    sNo: '',
    date: '',
    customerName: '',
    challanNo: '',
    onAcOf: '',
    watakNo: '',
    rokatNo: '',
  };

  const initialEntries: ProductEntry[] = [
    { peti: 0, dabba: 0, variety: '', noAndTeh: '', rate: 0 },
  ];

  const [entries, setEntries] = React.useState<ProductEntry[]>(initialEntries);
  
  const [billDetails, setBillDetails] = React.useState(initialBillDetails);

  const [freight, setFreight] = React.useState(0);
  const [labour, setLabour] = React.useState(0);
  const [security, setSecurity] = React.useState(0);
  const [otherExpenses, setOtherExpenses] = React.useState(0);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const [savedBills, setSavedBills] = React.useState<any[]>([]);

  React.useEffect(() => {
    const q = query(collection(db, "wataks"), orderBy("sNo", "desc"));
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

  const handleEntryUpdate = (
    index: number,
    field: keyof ProductEntry,
    value: string | number
  ) => {
    setEntries((prevEntries) => {
      const newEntries = [...prevEntries];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return newEntries;
    });
  };

  const handleBillDetailChange = (field: keyof typeof billDetails, value: string) => {
    setBillDetails(prev => ({...prev, [field]: value}));
  }

  const addSlot = () => {
    setEntries((prev) => [...prev, { peti: 0, dabba: 0, variety: '', noAndTeh: '', rate: 0 }]);
  };

  const removeSlot = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };


  const calculateGrossSale = () => {
    return entries.reduce(
      (total, entry) => total + (entry.peti + entry.dabba) * entry.rate,
      0
    );
  };
  
  const grossSale = calculateGrossSale();
  const commissionAmount = grossSale * 0.12; // 12% commission
  const totalExpenses = freight + labour + security + otherExpenses + commissionAmount;
  const netSale = grossSale - totalExpenses;

  const resetForm = () => {
    setBillDetails(initialBillDetails);
    setEntries(initialEntries);
    setFreight(0);
    setLabour(0);
    setSecurity(0);
    setOtherExpenses(0);
    setIsEditing(false);
  }

  const handleCreateBill = async () => {
    if (!billDetails.sNo || !billDetails.date || !billDetails.customerName) {
        toast({
            variant: 'destructive',
            title: 'Missing Details',
            description: 'Please fill in S.No, Date, and Customer Name before saving.',
        });
        return;
    }
    
    setIsSubmitting(true);
    const billId = billDetails.sNo;
    const billData = {
        ...billDetails,
        entries,
        grossSale,
        commissionAmount,
        freight,
        labour,
        security,
        otherExpenses,
        totalExpenses,
        netSale,
    };
    
    try {
        await setDoc(doc(db, "wataks", billId), billData);
        
        // Save to localStorage for printable page
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
    setBillDetails({
        sNo: bill.sNo,
        date: bill.date,
        customerName: bill.customerName,
        challanNo: bill.challanNo,
        onAcOf: bill.onAcOf,
        watakNo: bill.watakNo || '',
        rokatNo: bill.rokatNo || '',
    });
    setEntries(bill.entries);
    setFreight(bill.freight);
    setLabour(bill.labour);
    setSecurity(bill.security);
    setOtherExpenses(bill.otherExpenses);
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


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="text-center flex-1">
                        <h2 className="text-2xl font-bold">FIRDOUS AHMAD & COMPANY</h2>
                        <p className="text-sm text-muted-foreground">Fruit Merchants & Commission Agents</p>
                        <p className="text-sm text-muted-foreground">SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.</p>
                        <p className="text-sm text-muted-foreground">Cell: 7006136330, 9797002164</p>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>S.No</Label>
                        <Input value={billDetails.sNo} onChange={e => handleBillDetailChange('sNo', e.target.value)} disabled={isEditing} />
                    </div>
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={billDetails.date} onChange={e => handleBillDetailChange('date', e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label>Watak No.</Label>
                        <Input value={billDetails.watakNo} onChange={e => handleBillDetailChange('watakNo', e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label>Rokat No.</Label>
                        <Input value={billDetails.rokatNo} onChange={e => handleBillDetailChange('rokatNo', e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2">
                        <Label>M/s</Label>
                        <Input placeholder="Customer Name" value={billDetails.customerName} onChange={e => handleBillDetailChange('customerName', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Challan No.</Label>
                        <Input value={billDetails.challanNo} onChange={e => handleBillDetailChange('challanNo', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>On A/c of</Label>
                        <Input value={billDetails.onAcOf} onChange={e => handleBillDetailChange('onAcOf', e.target.value)} />
                    </div>
                </div>
                
                <Separator />

                <div className="space-y-4">
                <h3 className="text-lg font-medium">Product Details</h3>
                <div className="space-y-2">
                    <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                        <Label className="w-20">Peti</Label>
                        <Label className="w-20">Dabba</Label>
                        <Label className="flex-1">Variety</Label>
                        <Label className="w-28">No. & Teh</Label>
                        <Label className="w-28">Rate</Label>
                        <div className="w-10"></div>
                    </div>
                    {entries.map((entry, index) => (
                    <ProductEntryRow
                        key={index}
                        entry={entry}
                        onUpdate={(field, value) => handleEntryUpdate(index, field, value)}
                        onRemove={() => removeSlot(index)}
                    />
                    ))}
                    <Button variant="outline" size="sm" className="gap-1" onClick={addSlot}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    Add Item
                    </Button>
                </div>
                </div>

                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    <div className="space-y-2">
                        <h3 className="text-lg font-medium">Expenditure</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Label>Freight</Label>
                            <Input className="text-right" type="number" value={freight || ''} onChange={(e) => setFreight(Number(e.target.value))} />
                            <Label>Labour</Label>
                            <Input className="text-right" type="number" value={labour || ''} onChange={(e) => setLabour(Number(e.target.value))} />
                            <Label>Security</Label>
                            <Input className="text-right" type="number" value={security || ''} onChange={(e) => setSecurity(Number(e.target.value))} />
                            <Label>Other</Label>
                            <Input className="text-right" type="number" value={otherExpenses || ''} onChange={(e) => setOtherExpenses(Number(e.target.value))} />
                        </div>
                    </div>

                    <div className="space-y-2 text-sm">
                        <h3 className="text-lg font-medium">Summary</h3>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Gross Sale</span>
                            <span className="font-medium">₹{grossSale.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Commission (12%)</span>
                            <span className="font-medium">₹{commissionAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Expenses</span>
                            <span className="font-medium">₹{totalExpenses.toFixed(2)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Net Sale</span>
                            <span>₹{netSale.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-center gap-2">
                <Button onClick={handleCreateBill} className="w-full max-w-sm" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isEditing ? 'Update & View Bill' : 'Save & View Bill'}
                </Button>
                <p className="text-xs text-muted-foreground">"Your Satisfaction is Our Success"</p>
                <p className="text-xs text-muted-foreground">Subject to Sopore Jurisdiction Only</p>
            </CardFooter>
        </Card>
        <Card className="md:col-span-1 h-fit">
            <CardHeader>
                <h3 className="text-lg font-medium">Recent Bills (from Firestore)</h3>
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
