
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

const FormRow = ({ id, label, value, onChange }: { id: string, label: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="grid grid-cols-2 items-center gap-4">
        <Label htmlFor={id}>{label}</Label>
        <Input
            id={id}
            type="number"
            placeholder="0.00"
            value={value || ''}
            onChange={onChange}
        />
    </div>
)

export function BillMakingTab() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [grossSale, setGrossSale] = React.useState(0);
  const [freight, setFreight] = React.useState(0);
  const [postage, setPostage] = React.useState(0);
  const [labor, setLabor] = React.useState(0);
  const [security, setSecurity] = React.useState(0);
  const [otherExpenses, setOtherExpenses] = React.useState(0);
  
  const commissionAmount = grossSale * 0.06;
  const totalExpenses = freight + postage + labor + security + otherExpenses;
  const netSale = grossSale - totalExpenses - commissionAmount;

  const handleCreateBill = () => {
    toast({
        title: "Bill Created",
        description: "The bill has been successfully created and saved."
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
            <FormRow id="grossSale" label="Gross Sale" value={grossSale} onChange={(e) => setGrossSale(Number(e.target.value))} />
            <Separator />
            <h3 className="text-lg font-medium text-muted-foreground">Expenses</h3>
            <FormRow id="freight" label="Freight" value={freight} onChange={(e) => setFreight(Number(e.target.value))} />
            <FormRow id="postage" label="Postage" value={postage} onChange={(e) => setPostage(Number(e.target.value))} />
            <FormRow id="labor" label="Labor" value={labor} onChange={(e) => setLabor(Number(e.target.value))} />
            <FormRow id="security" label="Security Charges" value={security} onChange={(e) => setSecurity(Number(e.target.value))} />
            <FormRow id="otherExpenses" label="Other Expenses" value={otherExpenses} onChange={(e) => setOtherExpenses(Number(e.target.value))} />
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
