
'use client';

import AutomaticRateList from "@/components/AutomaticRateList";
import EditableRateList from "@/components/EditableRateList";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function RatesPage() {
  return (
      <>
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Fruit Rates</CardTitle>
                <CardDescription>Automatically generated daily market rates for fruits based on your sales, with an option for manual entries.</CardDescription>
            </CardHeader>
        </Card>
        
        <AutomaticRateList 
            sourceType="fruit"
            title="Automatic Fruit Rate List (from Sales)"
        />

        <Separator className="my-8" />

        <EditableRateList 
          storageKeyPrefix="manual-fruit-rates-"
          title="Manual & Add-on Fruit Rates"
        />
      </>
  );
}
