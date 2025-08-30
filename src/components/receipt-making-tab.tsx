'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';

export function ReceiptMakingTab() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [receiptData, setReceiptData] = React.useState({
    receiptNumber: '',
    totalAmount: 0,
    paymentMethod: '',
  });

  const handleGenerateReceipt = () => {
    console.log('Receipt generated:', receiptData);
    toast({
        title: 'Receipt Generated',
        description: `Receipt #${receiptData.receiptNumber} has been generated.`,
    })
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipt Generation</CardTitle>
        <CardDescription>
          Create a receipt for a payment or proof of purchase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="receiptNumber">Receipt Number</Label>
          <Input
            id="receiptNumber"
            type="text"
            placeholder="e.g., RC123456"
            value={receiptData.receiptNumber}
            onChange={(e) =>
              setReceiptData({ ...receiptData, receiptNumber: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="totalAmount">Total Amount</Label>
          <Input
            id="totalAmount"
            type="number"
            placeholder="e.g., 53.00"
            value={receiptData.totalAmount}
            onChange={(e) =>
              setReceiptData({ ...receiptData, totalAmount: +e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Input
            id="paymentMethod"
            type="text"
            placeholder="e.g., Cash, Card, UPI"
            value={receiptData.paymentMethod}
            onChange={(e) =>
              setReceiptData({ ...receiptData, paymentMethod: e.target.value })
            }
          />
        </div>
        <Button onClick={handleGenerateReceipt} className="w-full">Generate Receipt</Button>
      </CardContent>
    </Card>
  );
}
