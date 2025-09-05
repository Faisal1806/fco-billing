
'use client';

import AutomaticRateList from "@/components/AutomaticRateList";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RatesPage() {
  return (
      <>
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Fruit Rates</CardTitle>
                <CardDescription>Automatically generated daily market rates for fruits based on your sales.</CardDescription>
            </CardHeader>
        </Card>
        <AutomaticRateList 
            sourceType="fruit"
            title="Fruit Rate List"
        />
      </>
  );
}
