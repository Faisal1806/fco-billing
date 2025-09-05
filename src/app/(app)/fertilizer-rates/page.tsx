
'use client';

import AutomaticRateList from "@/components/AutomaticRateList";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function FertilizerRatesPage() {
  return (
      <>
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Fertilizers & Pesticides Rates</CardTitle>
                <CardDescription>Automatically generated daily market rates for fertilizers and pesticides based on your sales.</CardDescription>
            </CardHeader>
        </Card>
        <AutomaticRateList 
            sourceType="fertilizer"
            title="Fertilizer & Pesticide Rate List"
        />
      </>
  );
}
