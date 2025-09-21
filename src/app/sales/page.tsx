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
  const [activeTab, setActiveTab] = React.useState("wataks");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="wataks">Sales Invoices (Watak)</TabsTrigger>
            <TabsTrigger value="receipts">Goods Receipts</TabsTrigger>
            <TabsTrigger value="challan">Delivery Notes</TabsTrigger>
            <TabsTrigger value="pesticide-bill">Pesticide Bill</TabsTrigger>
        </TabsList>
        <TabsContent value="wataks">
            <BillMakingTab />
        </TabsContent>
        <TabsContent value="receipts">
            <ReceiptMakingTab />
        </TabsContent>
        <TabsContent value="challan">
            <ChallanMakingTab />
        </TabsContent>
        <TabsContent value="pesticide-bill">
            <PesticideBillTab />
        </TabsContent>
    </Tabs>
  );
}
