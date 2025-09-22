
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, FilePenLine, FilePlus, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ScrollArea } from './ui/scroll-area';
import type { ReceiptExtractOutput } from '@/ai/flows/extract-receipt-flow';
import { Badge } from '@/components/ui/badge';
import { PartySelector } from './party-selector';


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
  <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
    <Input
      placeholder="Khata"
      value={entry.khata}
      onChange={(e) => onUpdate('khata', e.target.value)}
      className="md:col-span-2"
    />
     <Input
      placeholder="Kind"
      value={entry.kind}
      onChange={(e) => onUpdate('kind', e.target.value)}
      className="md:col-span-1"
    />
    <Input
      type="number"
      placeholder="Peti"
      value={entry.peti || ''}
      onChange={(e) => onUpdate('peti', Number(e.target.value))}
      className="md:col-span-1"
    />
    <Input
      type="number"
      placeholder="Daba"
      value={entry.daba || ''}
      onChange={(e) => onUpdate('daba', Number(e.target.value))}
      className="md:col-span-1"
    />
    <Input
      placeholder="Freight"
      value={entry.freight}
      onChange={(e) => onUpdate('freight', e.target.value)}
      className="md:col-span-1"
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
    fetchReceipts();

    const scannedDataJSON = localStorage.getItem('scannedReceiptData');
    if(scannedDataJSON) {
        try {
            const scannedData: ReceiptExtractOutput = JSON.parse(scannedDataJSON);
            setReceiptDetails({
                no: scannedData.no,
                date: scannedData.date,
                customerName: scannedData.customerName,
                ro: scannedData.ro || '',
                freightPaid: scannedData.freightPaid || 0,
                wattakReadyOn: scannedData.wattakReadyOn || '',
            });
            setEntries(scannedData.entries.length > 0 ? scannedData.entries : initialEntries);
            toast({
                title: "Data Populated from Scan",
                description: "Review the extracted data and save the receipt."
            });
            setIsEditing(false); // Treat as new
        } catch(e) {
            console.error(e);
            toast({variant: 'destructive', title: "Error Parsing Scanned Data"});
        } finally {
            localStorage.removeItem('scannedReceiptData');
        }
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
    setSavedReceipts(receipts.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  
  const yearlyCount = React.useMemo(() => {
    if(!savedReceipts) return 0;
    const currentYear = new Date().getFullYear();
    return savedReceipts.filter(r => new Date(r.date).getFullYear() === currentYear).length;
  }, [savedReceipts]);

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

  const handleSaveReceipt = async () => {
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
    setIsEditing(true);

    toast({
      title: isEditing ? 'Payment Updated' : 'Payment Saved',
      description: 'The payment has been successfully saved to this device.',
    });
  };

  const handleViewReceipt = () => {
      if (!isEditing || !receiptDetails.no) {
          toast({ variant: 'destructive', title: 'Cannot View', description: 'Please save the payment first.'});
          return;
      }
      router.push(`/receipt/${receiptDetails.no}`);
  };

  const loadReceiptForEdit = (receipt: any) => {
    resetForm();
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
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to delete payments.' });
        return;
    }

    if(!window.confirm(`Are you sure you want to delete Payment #${receiptId}? This action cannot be undone.`)) {
        return;
    }
    
    localStorage.removeItem(`receipt-${receiptId}`);

    fetchReceipts();
    toast({
        title: "Payment Deleted",
        description: `Payment #${receiptId} has been successfully deleted.`
    });
    
    if (receiptDetails.no === receiptId) {
        resetForm();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="text-sm font-bold">🍎 F.Co</div>
                    <div className="text-center flex-1">
                        <h2 className="text-2xl font-bold">F.Co - FIRDOUS AHMAD & COMPANY</h2>
                        <p className="text-sm text-muted-foreground">Goods Payment</p>
                    </div>
                    <div className="text-sm font-bold">🍎 F.Co</div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>No.</Label>
                        <div className="flex items-center gap-2">
                        <Input value={receiptDetails.no} onChange={e => handleDetailChange('no', e.target.value)} disabled={isEditing} />
                         {isEditing && (
                            <Button variant="outline" size="icon" onClick={resetForm} title="Create a new payment">
                                <FilePlus className="h-4 w-4" />
                            </Button>
                        )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Dated</Label>
                        <Input type="date" value={receiptDetails.date} onChange={e => handleDetailChange('date', e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label>M/s (Grower)</Label>
                        <PartySelector value={receiptDetails.customerName} onChange={(val) => handleDetailChange('customerName', val)} filter="grower" />
                    </div>
                    <div className="space-y-2 col-span-2">
                        <Label>R/o</Label>
                        <Input placeholder="Residence of" value={receiptDetails.ro} onChange={e => handleDetailChange('ro', e.target.value)} />
                    </div>
                </div>
                
                <Separator />

                <div className="space-y-4">
                <div className="space-y-2">
                    <div className="hidden md:grid grid-cols-6 items-center gap-2 text-sm text-muted-foreground">
                        <Label className="md:col-span-2">KHATA</Label>
                        <Label className="md:col-span-1">KIND</Label>
                        <Label className="md:col-span-1">PETI</Label>
                        <Label className="md:col-span-1">DABA</Label>
                        <Label className="md:col-span-1">FREIGHT</Label>
                    </div>
                    {entries.map((entry, index) => (
                    <ReceiptEntryRow
                        key={index}
                        entry={entry}
                        onUpdate={(field, value) => handleEntryUpdate(index, field, value)}
                        onRemove={() => removeSlot(index)}
                    />
                    ))}
                    <Button variant="outline" size="sm" className="gap-1 mt-2" onClick={addSlot}>
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
                            <Label>Invoice Ready On:</Label>
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
            <CardFooter className="flex justify-center gap-4">
                <Button onClick={handleSaveReceipt} className="w-full max-w-xs">{isEditing ? 'Update Payment' : 'Save Payment'}</Button>
                <Button onClick={handleViewReceipt} variant="secondary" className="w-full max-w-xs gap-2" disabled={!isEditing}>
                    <FileText className="h-4 w-4" /> View Payment
                </Button>
            </CardFooter>
        </Card>
        <Card className="md:col-span-1 h-fit">
            <CardHeader>
                <h3 className="text-lg font-medium flex items-center gap-2">
                    Recent Payments
                    <Badge variant="secondary">{yearlyCount} This Year</Badge>
                </h3>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <div className="space-y-2">
                        {savedReceipts.map(receipt => (
                            <div key={receipt.no} className="flex justify-between items-center p-2 border rounded-md">
                                <div>
                                    <p className="font-medium">Payment #{receipt.no}</p>
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
                         {savedReceipts.length === 0 && <p className="text-sm text-muted-foreground text-center">No recent payments found.</p>}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
}

    

    
