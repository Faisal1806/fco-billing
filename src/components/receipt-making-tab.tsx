
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

type ReceiptEntry = {
  khata: string;
  kind: string;
  peti: number;
  daba: number;
  freight: string;
};

const ReceiptEntryRow = ({
  entry,
  onUpdate,
  onRemove,
}: {
  entry: ReceiptEntry;
  onUpdate: (field: keyof ReceiptEntry, value: string | number) => void;
  onRemove: () => void;
}) => (
  <div className="flex items-center gap-2">
    <Input
      placeholder="Khata"
      value={entry.khata}
      onChange={(e) => onUpdate('khata', e.target.value)}
      className="flex-1"
    />
     <Input
      placeholder="Kind"
      value={entry.kind}
      onChange={(e) => onUpdate('kind', e.target.value)}
      className="flex-1"
    />
    <Input
      type="number"
      placeholder="Peti"
      value={entry.peti || ''}
      onChange={(e) => onUpdate('peti', Number(e.target.value))}
      className="w-20"
    />
    <Input
      type="number"
      placeholder="Daba"
      value={entry.daba || ''}
      onChange={(e) => onUpdate('daba', Number(e.target.value))}
      className="w-20"
    />
    <Input
      placeholder="Freight"
      value={entry.freight}
      onChange={(e) => onUpdate('freight', e.target.value)}
      className="w-28"
    />
    <Button variant="ghost" size="icon" onClick={onRemove}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  </div>
);

export function ReceiptMakingTab() {
  const { toast } = useToast();
  const router = useRouter();

  const initialReceiptDetails = {
    no: '',
    date: '',
    customerName: '',
    ro: '', // Residence of
    freightPaid: 0,
    wattakReadyOn: '',
  };
  const initialEntries: ReceiptEntry[] = [
    { khata: '', kind: '', peti: 0, daba: 0, freight: '' },
  ];

  const [entries, setEntries] = React.useState<ReceiptEntry[]>(initialEntries);
  const [receiptDetails, setReceiptDetails] = React.useState(initialReceiptDetails);
  const [isEditing, setIsEditing] = React.useState(false);
  const [savedReceipts, setSavedReceipts] = React.useState<any[]>([]);
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
        setUserRole(localStorage.getItem('userRole'));
    }
  }, []);

  const fetchReceipts = () => {
    const receipts = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('receipt-')) {
            const receipt = JSON.parse(localStorage.getItem(key)!);
            receipts.push(receipt);
        }
    }
    setSavedReceipts(receipts.sort((a,b) => (a.no > b.no) ? 1 : -1));
  };
  
  React.useEffect(() => {
    fetchReceipts();
  }, []);

  const handleEntryUpdate = (
    index: number,
    field: keyof ReceiptEntry,
    value: string | number
  ) => {
    setEntries((prevEntries) => {
      const newEntries = [...prevEntries];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return newEntries;
    });
  };

  const handleDetailChange = (field: keyof typeof receiptDetails, value: string | number) => {
    setReceiptDetails(prev => ({...prev, [field]: value}));
  }

  const addSlot = () => {
    setEntries((prev) => [...prev, { khata: '', kind: '', peti: 0, daba: 0, freight: '' }]);
  };

  const removeSlot = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const totalNugs = entries.reduce((acc, entry) => acc + (Number(entry.peti) || 0) + (Number(entry.daba) || 0), 0);

  const resetForm = () => {
    setReceiptDetails(initialReceiptDetails);
    setEntries(initialEntries);
    setIsEditing(false);
  };

  const handleCreateReceipt = () => {
    if (!receiptDetails.no || !receiptDetails.date || !receiptDetails.customerName) {
        toast({
            variant: 'destructive',
            title: 'Missing Details',
            description: 'Please fill in No., Date, and Customer Name before saving.',
        });
        return;
    }
    const receiptId = receiptDetails.no;
    const receiptData = {
        ...receiptDetails,
        entries: entries.filter(e => e.khata || e.peti > 0 || e.daba > 0),
        totalNugs,
    };
    
    localStorage.setItem(`receipt-${receiptId}`, JSON.stringify(receiptData));
    fetchReceipts(); // Re-fetch to update list

    toast({
      title: isEditing ? 'Receipt Updated' : 'Receipt Saved',
      description: 'The receipt has been successfully saved.',
    });
    router.push(`/receipt/${receiptId}`);
  };

  const loadReceiptForEdit = (receipt: any) => {
    setReceiptDetails({
      no: receipt.no,
      date: receipt.date,
      customerName: receipt.customerName,
      ro: receipt.ro,
      freightPaid: receipt.freightPaid,
      wattakReadyOn: receipt.wattakReadyOn,
    });
    setEntries(receipt.entries.length > 0 ? receipt.entries : initialEntries);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    if(userRole !== 'admin') {
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to delete receipts.' });
        return;
    }

    if(!window.confirm(`Are you sure you want to delete Receipt #${receiptId}? This action cannot be undone.`)) {
        return;
    }
    try {
        localStorage.removeItem(`receipt-${receiptId}`);
        fetchReceipts(); // Re-fetch to update list
        toast({
            title: "Receipt Deleted",
            description: `Receipt #${receiptId} has been successfully deleted.`
        });
        if (receiptDetails.no === receiptId) {
            resetForm();
        }
    } catch (error) {
        console.error("Error deleting receipt:", error);
        toast({
            variant: "destructive",
            title: "Delete Failed",
            description: "Could not delete the receipt."
        });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="text-center flex-1">
                        <h2 className="text-2xl font-bold">F.Co - FIRDOUS AHMAD & COMPANY</h2>
                        <p className="text-sm text-muted-foreground">Goods Receipt</p>
                    </div>
                     {isEditing && (
                        <Button variant="outline" size="sm" onClick={resetForm} className="gap-2">
                            <FilePlus className="h-4 w-4" />
                            New Receipt
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>No.</Label>
                        <Input value={receiptDetails.no} onChange={e => handleDetailChange('no', e.target.value)} disabled={isEditing} />
                    </div>
                    <div className="space-y-2">
                        <Label>Dated</Label>
                        <Input type="date" value={receiptDetails.date} onChange={e => handleDetailChange('date', e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label>M/s</Label>
                        <Input placeholder="Customer Name" value={receiptDetails.customerName} onChange={e => handleDetailChange('customerName', e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2">
                        <Label>R/o</Label>
                        <Input placeholder="Residence of" value={receiptDetails.ro} onChange={e => handleDetailChange('ro', e.target.value)} />
                    </div>
                </div>
                
                <Separator />

                <div className="space-y-4">
                <div className="space-y-2">
                    <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                        <Label className="w-10">S.No.</Label>
                        <Label className="flex-1">KHATA</Label>
                        <Label className="flex-1">KIND</Label>
                        <Label className="w-20">PETI</Label>
                        <Label className="w-20">DABA</Label>
                        <Label className="w-28">FREIGHT</Label>
                        <div className="w-10"></div>
                    </div>
                    {entries.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span className="w-10 text-center">{index + 1}</span>
                        <ReceiptEntryRow
                            entry={entry}
                            onUpdate={(field, value) => handleEntryUpdate(index, field, value)}
                            onRemove={() => removeSlot(index)}
                        />
                    </div>
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
                        <div className="flex items-center gap-4">
                            <Label>Freight Paid Rs:</Label>
                            <Input className="text-right" type="number" value={receiptDetails.freightPaid || ''} onChange={(e) => handleDetailChange('freightPaid', Number(e.target.value))} />
                        </div>
                        <div className="flex items-center gap-4">
                            <Label>Wattak Ready On:</Label>
                            <Input value={receiptDetails.wattakReadyOn} onChange={(e) => handleDetailChange('wattakReadyOn', e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2 text-sm text-right">
                        <div className="flex justify-end gap-4 items-center">
                            <span className="font-medium">Total Nugs:</span>
                            <span className="font-bold text-lg">{totalNugs}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Button onClick={handleCreateReceipt} className="w-full max-w-sm">{isEditing ? 'Update & View Receipt' : 'Save & View Receipt'}</Button>
            </CardFooter>
        </Card>
        <Card className="md:col-span-1 h-fit">
            <CardHeader>
                <h3 className="text-lg font-medium">Recent Receipts</h3>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <div className="space-y-2">
                        {savedReceipts.map(receipt => (
                            <div key={receipt.no} className="flex justify-between items-center p-2 border rounded-md">
                                <div>
                                    <p className="font-medium">Receipt #{receipt.no}</p>
                                    <p className="text-sm text-muted-foreground">{receipt.customerName}</p>
                                    <p className="text-sm text-muted-foreground">{new Date(receipt.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center">
                                    <Button variant="ghost" size="icon" onClick={() => loadReceiptForEdit(receipt)}>
                                        <FilePenLine className="h-4 w-4" />
                                    </Button>
                                    {userRole === 'admin' && (
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteReceipt(receipt.no)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                         {savedReceipts.length === 0 && <p className="text-sm text-muted-foreground text-center">No recent receipts found.</p>}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
}
