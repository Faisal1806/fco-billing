
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
import { PlusCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

  const [entries, setEntries] = React.useState<ItemEntry[]>([
    { particulars: '', qty: '', rate: 0 },
  ]);
  
  const [billDetails, setBillDetails] = React.useState({
    no: '',
    date: '',
    customerName: '',
  });

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
        entries: entries.map(entry => ({...entry, amount: (parseFloat(entry.qty) || 0) * entry.rate})),
        grandTotal,
    };
    
    localStorage.setItem(`pesticide-invoice-${billId}`, JSON.stringify(billData));

    toast({
      title: 'Pesticide Bill Saved',
      description: 'The bill has been successfully saved.',
    });
    router.push(`/pesticide-invoice/${billId}`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="text-center">
            <h2 className="text-2xl font-bold">F. Co Pesticides & Fertilizers</h2>
            <p className="text-sm text-muted-foreground">Deals in:- All kinds of Pesticides & Fertilizers</p>
            <p className="text-sm text-muted-foreground">NEAR JAMIA MASJID NADIHAL</p>
            <p className="text-sm text-muted-foreground">Cell: 9797002164, 7006136330</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label>No.</Label>
                <Input value={billDetails.no} onChange={e => handleDetailChange('no', e.target.value)} />
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
        <Button onClick={handleCreateBill} className="w-full max-w-sm">Save & View Bill</Button>
        <p className="text-xs text-muted-foreground">Goods once sold can not be taken back.</p>
      </CardFooter>
    </Card>
  );
}
