'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/language-context';
import { BillMakingTab } from '@/components/bill-making-tab';
import { ReceiptMakingTab } from '@/components/receipt-making-tab';

export default function SalesPage() {
  const { t } = useLanguage();

  return (
    <Tabs defaultValue="bill-making" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="bill-making">Bill Making</TabsTrigger>
        <TabsTrigger value="receipt-making">Receipt Making</TabsTrigger>
      </TabsList>
      <TabsContent value="bill-making">
        <BillMakingTab />
      </TabsContent>
      <TabsContent value="receipt-making">
        <ReceiptMakingTab />
      </TabsContent>
    </Tabs>
  );
}
