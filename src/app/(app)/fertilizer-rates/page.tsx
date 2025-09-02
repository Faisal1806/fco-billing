
'use client';

import EditableRateList from "@/components/EditableRateList";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const defaultFertilizerRates = [
    { id: '1', category: 'Pesticide', variety: 'Z-80', rate: '650' },
    { id: '2', category: 'Pesticide', variety: 'Coraban', rate: '500' },
    { id: '3', category: 'Pesticide', variety: 'Quinalphos', rate: '750' },
    { id: '4', category: 'Pesticide', variety: 'Levent', rate: '700' },
    { id: '5', category: 'Pesticide', variety: 'HIT list', rate: '2200' },
    { id: '6', category: 'Pesticide', variety: 'Shine Star', rate: '2000' },
    { id: '7', category: 'Pesticide', variety: 'Cyclone', rate: '950' },
    { id: '8', category: 'Fungicide', variety: 'Cabriotop', rate: '2500' },
    { id: '9', category: 'Fungicide', variety: 'CB+', rate: '520' },
    { id: '10', category: 'Fungicide', variety: 'Colore', rate: '850' },
    { id: '11', category: 'Fungicide', variety: 'Captain', rate: '500' },
    { id: '12', category: 'Pesticide', variety: 'Achook', rate: '1100' },
];

export default function FertilizerRatesPage() {
  return (
      <>
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Fertilizers & Pesticides Rates</CardTitle>
                <CardDescription>Manage and share your daily market rates for fertilizers and pesticides.</CardDescription>
            </CardHeader>
        </Card>
        <EditableRateList 
            storageKeyPrefix="fertilizer-rate-list-" 
            title="Fertilizer & Pesticide Rate List"
            defaultRates={defaultFertilizerRates}
        />
      </>
  );
}
