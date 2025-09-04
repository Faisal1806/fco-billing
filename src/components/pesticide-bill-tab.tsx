
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
import { PlusCircle, Trash2, FilePenLine, FilePlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ScrollArea } from './ui/scroll-area';

type ItemEntry = {
  particulars: string;
  qty: string;
  rate: number;
};

const ItemEntryRow = ({
  entry,
  onUpdate,
  onRemove,
  index,
}: {
  entry: ItemEntry;
  onUpdate: (field: keyof ItemEntry, value: string | number) => void;
  onRemove: () => void;
  index: number;
}) => (
  <div className="flex items-center gap-2">
    <span className="w-8 text-center">{index + 1}.</span>
    <Input
      placeholder="Particulars"
      value={entry.particulars}
      onChange={(e) => onUpdate('particulars', e.target.value)}
      className="flex-1"
    />
    <Input
      placeholder="Qty"
      value={entry.qty}
      onChange={(e) => onUpdate('qty', e.target.value)}
      className="w-24"
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

export function PesticideBillTab() {
  const { toast } = useToast();
  const router = useRouter();

  const initialBillDetails = {
    no: '',
    date: '',
    customerName: '',
  };

  const initialEntries: ItemEntry[] = [
    { particulars: '', qty: '', rate: 0 },
  ];

  const [entries, setEntries] = React.useState<ItemEntry[]>(initialEntries);
  const [billDetails, setBillDetails] = React.useState(initialBillDetails);
  const [isEditing, setIsEditing] = React.useState(false);
  const [savedBills, setSavedBills] = React.useState<any[]>([]);
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole'));
    }
  }, []);

  const fetchBills = () => {
    const bills = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('pesticide-invoice-')) {
            const bill = JSON.parse(localStorage.getItem(key)!);
            bills.push(bill);
        }
    }
    setSavedBills(bills.sort((a,b) => (a.no > b.no) ? 1 : -1));
  };
  
  React.useEffect(() => {
    fetchBills();
  }, []);

  const handleEntryUpdate = (
    index: number,
    field: keyof ItemEntry,
    value: string | number
  ) => {
    setEntries((prevEntries) => {
      const newEntries = [...prevEntries];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return newEntries;
    });
  };

  const handleDetailChange = (field: keyof typeof billDetails, value: string | number) => {
    setBillDetails(prev => ({...prev, [field]: value}));
  }

  const addSlot = () => {
    setEntries((prev) => [...prev, { particulars: '', qty: '', rate: 0 }]);
  };

  const removeSlot = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };
  
  const grandTotal = entries.reduce((acc, entry) => {
    const qty = parseFloat(entry.qty) || 0;
    return acc + qty * entry.rate;
  }, 0);

  const resetForm = () => {
    setBillDetails(initialBillDetails);
    setEntries(initialEntries);
    setIsEditing(false);
  };

  const handleCreateBill = () => {
    if (!billDetails.no || !billDetails.date || !billDetails.customerName) {
        toast({
            variant: 'destructive',
            title: 'Missing Details',
            description: 'Please fill in No., Date, and Customer Name before saving.',
        });
        return;
    }
    const billId = billDetails.no;
    const billData = {
        ...billDetails,
        entries: entries.map(entry => ({...entry, amount: (parseFloat(entry.qty) || 0) * entry.rate})).filter(e => e.particulars && e.qty),
        grandTotal,
    };
    
    localStorage.setItem(`pesticide-invoice-${billId}`, JSON.stringify(billData));
    fetchBills(); // Re-fetch to update list


    toast({
      title: isEditing ? 'Pesticide Bill Updated' : 'Pesticide Bill Saved',
      description: 'The bill has been successfully saved.',
    });
    router.push(`/pesticide-invoice/${billId}`);
  };

   const loadBillForEdit = (bill: any) => {
    setBillDetails({
        no: bill.no,
        date: bill.date,
        customerName: bill.customerName,
    });
    setEntries(bill.entries.length > 0 ? bill.entries : initialEntries);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBill = async (billId: string) => {
    if(userRole !== 'admin') {
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to delete bills.' });
        return;
    }
    if(!window.confirm(`Are you sure you want to delete Pesticide Bill #${billId}? This action cannot be undone.`)) {
        return;
    }
    try {
        localStorage.removeItem(`pesticide-invoice-${billId}`);
        fetchBills(); // Re-fetch to update list
        toast({
            title: "Pesticide Bill Deleted",
            description: `Bill #${billId} has been successfully deleted.`
        });
        if (billDetails.no === billId) {
            resetForm();
        }
    } catch (error) {
        console.error("Error deleting bill:", error);
        toast({
            variant: "destructive",
            title: "Delete Failed",
            description: "Could not delete the pesticide bill."
        });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
            <CardHeader>
                 <div className="flex justify-between items-center">
                    <div className="text-sm font-bold">🍎 F.Co</div>
                    <div className="text-center flex-1">
                        <h2 className="text-2xl font-bold">F. Co Pesticides & Fertilizers</h2>
                        <p className="text-sm text-muted-foreground">Deals in:- All kinds of Pesticides & Fertilizers</p>
                        <p className="text-xs text-muted-foreground">NEAR JAMIA MASJID NADIHAL</p>
                    </div>
                    <div className="text-sm font-bold">🍎 F.Co</div>
                     {isEditing && (
                        <Button variant="outline" size="sm" onClick={resetForm} className="gap-2 ml-4">
                            <FilePlus className="h-4 w-4" />
                            New Bill
                        </Button>
                    )}
                 </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>No.</Label>
                        <Input value={billDetails.no} onChange={e => handleDetailChange('no', e.target.value)} disabled={isEditing} />
                    </div>
                    <div className="space-y-2">
                        <Label>Dated</Label>
                        <Input type="date" value={billDetails.date} onChange={e => handleDetailChange('date', e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label>M/s</Label>
                        <Input placeholder="Customer Name" value={billDetails.customerName} onChange={e => handleDetailChange('customerName', e.target.value)} />
                    </div>
                </div>
                
                <Separator />

                <div className="space-y-4">
                <div className="space-y-2">
                    <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                        <Label className="w-8">S.No.</Label>
                        <Label className="flex-1">PARTICULARS</Label>
                        <Label className="w-24">QTY</Label>
                        <Label className="w-28">RATE</Label>
                        <div className="w-10"></div>
                    </div>
                    {entries.map((entry, index) => (
                    <ItemEntryRow
                        key={index}
                        index={index}
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
                
                <div className="flex justify-end">
                    <div className="w-full max-w-xs space-y-2">
                        <div className="flex justify-between font-bold text-lg">
                            <span>G. Total</span>
                            <span>₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-center gap-2">
                <Button onClick={handleCreateBill} className="w-full max-w-sm">{isEditing ? 'Update & View Bill' : 'Save & View Bill'}</Button>
                <p className="text-xs text-muted-foreground">Goods once sold can not be taken back.</p>
            </CardFooter>
        </Card>
         <Card className="md:col-span-1 h-fit">
            <CardHeader>
                <h3 className="text-lg font-medium">Recent Pesticide Bills</h3>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <div className="space-y-2">
                        {savedBills.map(bill => (
                            <div key={bill.no} className="flex justify-between items-center p-2 border rounded-md">
                                <div>
                                    <p className="font-medium">Bill #{bill.no}</p>
                                    <p className="text-sm text-muted-foreground">{bill.customerName}</p>
                                    <p className="text-sm text-muted-foreground">{new Date(bill.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center">
                                    <Button variant="ghost" size="icon" onClick={() => loadBillForEdit(bill)}>
                                        <FilePenLine className="h-4 w-4" />
                                    </Button>
                                    {userRole === 'admin' && (
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteBill(bill.no)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                         {savedBills.length === 0 && <p className="text-sm text-muted-foreground text-center">No recent bills found.</p>}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
}
