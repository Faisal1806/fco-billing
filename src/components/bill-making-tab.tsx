
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2 } from 'lucide-react';

type ProductEntry = {
  quantity: number;
  variety: string;
  rate: number;
};

const ProductEntryRow = ({
  entry,
  onUpdate,
  onRemove,
  type,
}: {
  entry: ProductEntry;
  onUpdate: (field: keyof ProductEntry, value: string | number) => void;
  onRemove: () => void;
  type: 'Dabba' | 'Patti';
}) => (
  <div className="flex items-center gap-2">
    <Input
      type="number"
      placeholder={`${type} Qty`}
      value={entry.quantity || ''}
      onChange={(e) => onUpdate('quantity', Number(e.target.value))}
      className="w-24"
    />
    <Input
      type="text"
      placeholder="Variety"
      value={entry.variety}
      onChange={(e) => onUpdate('variety', e.target.value)}
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
  const { t } = useLanguage();
  const { toast } = useToast();

  const [dabbaEntries, setDabbaEntries] = React.useState<ProductEntry[]>([
    { quantity: 0, variety: '', rate: 0 },
  ]);
  const [pattiEntries, setPattiEntries] = React.useState<ProductEntry[]>([
    { quantity: 0, variety: '', rate: 0 },
  ]);

  const [freight, setFreight] = React.useState(0);
  const [postage, setPostage] = React.useState(0);
  const [labor, setLabor] = React.useState(0);
  const [security, setSecurity] = React.useState(0);
  const [otherExpenses, setOtherExpenses] = React.useState(0);

  const handleEntryUpdate = <T extends ProductEntry>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    index: number,
    field: keyof T,
    value: string | number
  ) => {
    setter((prevEntries) => {
      const newEntries = [...prevEntries];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return newEntries;
    });
  };

  const addSlot = <T extends ProductEntry>(
    setter: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    setter((prev) => [...prev, { quantity: 0, variety: '', rate: 0 } as T]);
  };

  const removeSlot = <T extends ProductEntry>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    index: number
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };


  const calculateGrossSale = () => {
    const dabbaSale = dabbaEntries.reduce(
      (total, entry) => total + entry.quantity * entry.rate,
      0
    );
    const pattiSale = pattiEntries.reduce(
      (total, entry) => total + entry.quantity * entry.rate,
      0
    );
    return dabbaSale + pattiSale;
  };
  
  const grossSale = calculateGrossSale();
  const commissionAmount = grossSale * 0.06;
  const totalExpenses = freight + postage + labor + security + otherExpenses;
  const netSale = grossSale - totalExpenses - commissionAmount;

  const handleCreateBill = () => {
    toast({
      title: 'Bill Created',
      description: 'The bill has been successfully created and saved.',
    });
    // Here you could also save the bill to a database
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Bill</CardTitle>
        <CardDescription>Enter the details below to calculate the final bill.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-muted-foreground">Product Information</h3>
          
          <div className="space-y-2">
            <Label>Dabba Entries</Label>
            {dabbaEntries.map((entry, index) => (
              <ProductEntryRow
                key={index}
                entry={entry}
                onUpdate={(field, value) => handleEntryUpdate(setDabbaEntries, index, field, value)}
                onRemove={() => removeSlot(setDabbaEntries, index)}
                type="Dabba"
              />
            ))}
            <Button variant="outline" size="sm" className="gap-1" onClick={() => addSlot(setDabbaEntries)}>
              <PlusCircle className="h-3.5 w-3.5" />
              Add Dabba
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Patti Entries</Label>
            {pattiEntries.map((entry, index) => (
              <ProductEntryRow
                key={index}
                entry={entry}
                onUpdate={(field, value) => handleEntryUpdate(setPattiEntries, index, field, value)}
                onRemove={() => removeSlot(setPattiEntries, index)}
                type="Patti"
              />
            ))}
            <Button variant="outline" size="sm" className="gap-1" onClick={() => addSlot(setPattiEntries)}>
              <PlusCircle className="h-3.5 w-3.5" />
              Add Patti
            </Button>
          </div>
        </div>

        <Separator />

        <div>
            <Label className="text-lg font-medium text-muted-foreground">Gross Sale</Label>
            <Input value={`₹${grossSale.toFixed(2)}`} disabled />
        </div>

        <Separator />
        
        <h3 className="text-lg font-medium text-muted-foreground">Expenses</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="freight">Freight</Label>
            <Input id="freight" type="number" value={freight || ''} onChange={(e) => setFreight(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postage">Postage</Label>
            <Input id="postage" type="number" value={postage || ''} onChange={(e) => setPostage(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="labor">Labor</Label>
            <Input id="labor" type="number" value={labor || ''} onChange={(e) => setLabor(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="security">Security Charges</Label>
            <Input id="security" type="number" value={security || ''} onChange={(e) => setSecurity(Number(e.target.value))} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="otherExpenses">Other Expenses</Label>
            <Input id="otherExpenses" type="number" value={otherExpenses || ''} onChange={(e) => setOtherExpenses(Number(e.target.value))} />
          </div>
        </div>
        <Separator />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Commission (6%)</span>
            <span>₹{commissionAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Expenses</span>
            <span>₹{totalExpenses.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Net Sale</span>
            <span>₹{netSale.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleCreateBill} className="w-full">Create Bill</Button>
      </CardFooter>
    </Card>
  );
}
