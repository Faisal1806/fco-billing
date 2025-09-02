
'use client';

import EditableRateList from "@/components/EditableRateList";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RatesPage() {
  return (
      <>
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Fruit Rates</CardTitle>
                <CardDescription>Manage and share your daily market rates for fruits.</CardDescription>
            </CardHeader>
        </Card>
        <EditableRateList storageKeyPrefix="daily-rate-list-" title="Fruit Rate List" />
      </>
  );
}
