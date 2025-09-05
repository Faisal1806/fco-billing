
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
                <CardTitle>National Fruit Market Rates</CardTitle>
                <CardDescription>View your local automatic rates alongside manually entered rates from markets outside Kashmir.</CardDescription>
            </CardHeader>
        </Card>
        
        <AutomaticRateList 
            sourceType="fruit"
            title="Sopore Mandi Rates (from Local Sales)"
        />

        <Separator className="my-8" />

        <EditableRateList 
          storageKeyPrefix="manual-outside-rates-"
          title="Outside Market Rates (Manual Entry)"
          categoryLabel="State / Market"
          categoryPlaceholder="e.g., Delhi, Guwahati, Kolkata"
          varietyPlaceholder="e.g., American, Red Delicious"
        />
      </>
  );
}
