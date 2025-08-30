
'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/language-context';
import { BillMakingTab } from '@/components/bill-making-tab';
import { ReceiptMakingTab } from '@/components/receipt-making-tab';
import { PesticideBillTab } from '@/components/pesticide-bill-tab';

export default function SalesPage() {
  const { t } = useLanguage();

  return (
    <Tabs defaultValue="bill-making" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="bill-making">Bill Making</TabsTrigger>
        <TabsTrigger value="receipt-making">Receipt Making</TabsTrigger>
        <TabsTrigger value="pesticide-bill">Pesticide Bill</TabsTrigger>
      </TabsList>
      <TabsContent value="bill-making">
        <BillMakingTab />
      </TabsContent>
      <TabsContent value="receipt-making">
        <ReceiptMakingTab />
      </TabsContent>
      <TabsContent value="pesticide-bill">
        <PesticideBillTab />
      </TabsContent>
    </Tabs>
  );
}
