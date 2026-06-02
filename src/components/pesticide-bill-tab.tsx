
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
import { PlusCircle, Trash2, FilePenLine, FilePlus, FlaskConical, FileText, Search } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { ScrollArea } from './ui/scroll-area';
import { PartySelector } from './party-selector';

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
  const [searchTerm, setSearchTerm] = React.useState('');


  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole'));
    }
    fetchBills();
  }, []);

  const fetchBills = () => {
    let maxNo = 0;
    const bills = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('pesticide-invoice-')) {
            const bill = JSON.parse(localStorage.getItem(key)!);
            bills.push(bill);
            const currentNo = parseInt(bill.no, 10);
            if (!isNaN(currentNo) && currentNo > maxNo) {
                maxNo = currentNo;
            }
        }
    }
    setSavedBills(bills.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    if (!isEditing) {
        setBillDetails(prev => ({...prev, no: (maxNo + 1).toString()}));
    }
  };
  
  const filteredBills = React.useMemo(() => {
    if (!searchTerm) return savedBills;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return savedBills.filter(bill => 
      bill.no?.toLowerCase().includes(lowerCaseSearch) ||
      bill.customerName?.toLowerCase().includes(lowerCaseSearch)
    );
  }, [savedBills, searchTerm]);

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
    const qty = parseFloat(entry.qty) || 1; // Default to 1 if qty is not a valid number or empty, to handle items without explicit quantity
    return acc + qty * entry.rate;
  }, 0);
  

  const resetForm = () => {
    setBillDetails(initialBillDetails);
    setEntries(initialEntries);
    setIsEditing(false);
    fetchBills();
  };

  const handleSaveBill = () => {
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
        entries: entries.map(entry => ({...entry, amount: (parseFloat(entry.qty) || 1) * entry.rate})).filter(e => e.particulars && e.rate > 0),
        grandTotal,
    };
    
    localStorage.setItem(`pesticide-invoice-${billId}`, JSON.stringify(billData));
    fetchBills(); // Re-fetch to update list


    toast({
      title: isEditing ? 'Pesticide Bill Updated' : 'Pesticide Bill Saved',
      description: 'The bill has been successfully saved.',
      isSuccess: true,
    });
    setIsEditing(true);
  };

  const handleViewBill = () => {
    if (!isEditing || !billDetails.no) {
        toast({ variant: 'destructive', title: 'Cannot View', description: 'Please save the bill first.'});
        return;
    }
    router.push(`/pesticide-invoice/${billDetails.no}`);
  };

  const handleWhatsAppShare = () => {
    if (!billDetails.customerName || !billDetails.no) return;
    
    const pageUrl = `${window.location.origin}/pesticide-invoice/${billDetails.no}`;

    let msg = `*F.Co Billing System*\n`;
    msg += `Pesticide Bill No: ${billDetails.no}\n`;
    msg += `Customer: ${billDetails.customerName}\n`;
    msg += `Grand Total: *₹${grandTotal.toLocaleString()}*\n\n`;
    msg += `View Full Bill: ${pageUrl}\n\n`;
    msg += `Thank you for your business\n`;
    msg += `*Firdous Ahmad & Company*`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

   const loadBillForEdit = (bill: any) => {
    setBillDetails({
        no: bill.no,
        date: bill.date,
        customerName: bill.customerName,
    });
    setEntries(bill.entries && bill.entries.length > 0 ? bill.entries : initialEntries);
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
                    <div className="text-sm font-bold flex items-center gap-1"><FlaskConical className="h-4 w-4" /> F.Co</div>
                    <div className="text-center flex-1">
                        <h2 className="text-2xl font-bold">F. Co Pesticides & Fertilizers</h2>
                        <p className="text-sm text-muted-foreground">Deals in:- All kinds of Pesticides & Fertilizers</p>
                        <p className="text-xs text-muted-foreground">NEAR JAMIA MASJID NADIHAL</p>
                    </div>
                    <div className="text-sm font-bold flex items-center gap-1"><FlaskConical className="h-4 w-4" /> F.Co</div>
                 </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>No.</Label>
                         <div className="flex items-center gap-2">
                            <Input value={billDetails.no} onChange={e => handleDetailChange('no', e.target.value)} disabled={isEditing} />
                             {isEditing && (
                                <Button variant="outline" size="icon" onClick={resetForm} title="Create a new bill">
                                    <FilePlus className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Dated</Label>
                        <Input type="date" value={billDetails.date} onChange={e => handleDetailChange('date', e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label>M/s</Label>
                        <PartySelector value={billDetails.customerName} onChange={(val) => handleDetailChange('customerName', val)} filter="all" />
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
                 <div className="flex justify-center gap-4 w-full">
                    <Button onClick={handleSaveBill} className="flex-1 max-w-xs">{isEditing ? 'Update Bill' : 'Save Bill'}</Button>
                    <Button onClick={handleViewBill} variant="secondary" className="flex-1 max-w-xs gap-2" disabled={!isEditing}>
                        <FileText className="h-4 w-4" /> View Bill
                    </Button>
                    <Button onClick={handleWhatsAppShare} variant="outline" className="flex-1 max-w-xs gap-2 bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20" disabled={!isEditing}>
                        <FaWhatsapp className="h-4 w-4" /> WhatsApp Share
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">Goods once sold can not be taken back.</p>
            </CardFooter>
        </Card>
         <Card className="md:col-span-1 h-fit">
            <CardHeader>
                 <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-medium">Recent Pesticide Bills</h3>
                    <div className="relative w-full max-w-[150px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search bills..." 
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <div className="space-y-2">
                        {filteredBills.map(bill => (
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


