
'use client';

import AutomaticRateList from "@/components/AutomaticRateList";
import EditableRateList from "@/components/EditableRateList";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Default rates for pesticides to preserve the user's old data.
const defaultPesticideRates = [
    { id: '1', category: 'Fungicide', variety: 'Mancozeb', rate: '550-600' },
    { id: '2', category: 'Fungicide', variety: 'Captan', rate: '700' },
    { id: '3', category: 'Insecticide', variety: 'Chlorpyrifos', rate: '400-450' },
    { id: '4', category: 'Insecticide', variety: 'Imidacloprid', rate: '1200' },
    { id: '5', category: 'Fertilizer', variety: 'Urea', rate: '350' },
    { id: '6', category: 'Fertilizer', variety: 'DAP', rate: '1400' },
];

export default function FertilizerRatesPage() {
  return (
      <>
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Fertilizers & Pesticides Rates</CardTitle>
                <CardDescription>Automatically generated rates from sales, plus a section for manual add-ons and adjustments.</CardDescription>
            </CardHeader>
        </Card>
        
        <AutomaticRateList 
            sourceType="fertilizer"
            title="Automatic Fertilizer & Pesticide Rate List (from Sales)"
        />

        <Separator className="my-8" />

        <EditableRateList 
          storageKeyPrefix="manual-fertilizer-rates-"
          title="Manual & Add-on Fertilizer Rates"
          defaultRates={defaultPesticideRates}
        />
      </>
  );
}
