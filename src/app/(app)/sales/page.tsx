'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/language-context';
import { BillMakingTab } from '@/components/bill-making-tab';
import { ReceiptMakingTab } from '@/components/receipt-making-tab';
import { PesticideBillTab } from '@/components/pesticide-bill-tab';
import { ChallanMakingTab } from '@/components/challan-making-tab';

export default function SalesPage() {
  const { t } = useLanguage();
  const [outerTab, setOuterTab] = React.useState("bill-making");
  const [innerTab, setInnerTab] = React.useState("wataks");

  return (
    <Tabs value={outerTab} onValueChange={setOuterTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="bill-making">Invoice & Note Creation</TabsTrigger>
        <TabsTrigger value="receipt-making">Payment Creation</TabsTrigger>
      </TabsList>
      <TabsContent value="bill-making">
        <Tabs value={innerTab} onValueChange={setInnerTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="wataks">Sales Invoices</TabsTrigger>
                <TabsTrigger value="challan">Delivery Notes</TabsTrigger>
                <TabsTrigger value="pesticide-bill">Pesticide Bill</TabsTrigger>
            </TabsList>
            <TabsContent value="wataks">
                <BillMakingTab />
            </TabsContent>
            <TabsContent value="challan">
                <ChallanMakingTab />
            </TabsContent>
            <TabsContent value="pesticide-bill">
                <PesticideBillTab />
            </TabsContent>
        </Tabs>
      </TabsContent>
      <TabsContent value="receipt-making">
        <Tabs defaultValue="manual-receipt" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="manual-receipt">Manual Goods Receipt</TabsTrigger>
            </TabsList>
            <TabsContent value="manual-receipt">
                <ReceiptMakingTab />
            </TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
  );
}
