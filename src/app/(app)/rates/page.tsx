
'use client';

import AutomaticRateList from "@/components/AutomaticRateList";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function RatesPage() {
  return (
      <>
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>National Fruit Market Rates</CardTitle>
                <CardDescription>View your local and outside market rates, automatically generated from your sales and bikri records.</CardDescription>
            </CardHeader>
        </Card>
        
        <AutomaticRateList 
            sourceType="fruit"
            title="Sopore Mandi Rates (from Local Invoices)"
        />

        <Separator className="my-8" />

        <AutomaticRateList 
            sourceType="outside"
            title="Outside Market Rates (from Bikri Records)"
        />
      </>
  );
}
