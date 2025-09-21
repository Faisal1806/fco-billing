
'use client';

import AutomaticRateList from "@/components/AutomaticRateList";
import LiveRateList from "@/components/LiveRateList";
import OutsideLiveRateList from "@/components/OutsideLiveRateList";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function RatesPage() {
  return (
      <>
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>National Fruit Market Rates</CardTitle>
                <CardDescription>View your local and outside market rates, automatically generated from your sales and bikri records, plus see today's official Sopore Mandi rates.</CardDescription>
            </CardHeader>
        </Card>

        <LiveRateList />

        <Separator className="my-8" />
        
        <OutsideLiveRateList />

        <Separator className="my-8" />
        
        <AutomaticRateList 
            sourceType="fruit"
            title="Sopore Mandi Rates (from Your Local Invoices)"
        />

        <Separator className="my-8" />

        <AutomaticRateList 
            sourceType="outside"
            title="Outside Market Rates (from Your Bikri Records)"
        />
      </>
  );
}
