
'use client'

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { dailyRates, DailyRates } from '@/lib/data';
import { Separator } from '@/components/ui/separator';

const RateCard = ({ variety, rates }: { variety: string; rates: { normal: string; extraordinary?: string } }) => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
            <CardTitle className="text-xl">{variety}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
            <div>
                <p className="text-sm text-muted-foreground">Normal</p>
                <p className="text-lg font-semibold">₹{rates.normal}</p>
            </div>
            {rates.extraordinary && (
                <>
                <Separator />
                <div>
                    <p className="text-sm text-muted-foreground">Extraordinary</p>
                    <p className="text-lg font-semibold">₹{rates.extraordinary}</p>
                </div>
                </>
            )}
        </CardContent>
    </Card>
);

export default function RatesPage() {

  return (
    <div>
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Today's Market Rates</CardTitle>
                <CardDescription>
                    Live rates for different fruit varieties from the market.
                </CardDescription>
            </CardHeader>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Object.entries(dailyRates).map(([variety, rates]) => (
          <RateCard key={variety} variety={variety} rates={rates} />
        ))}
        </div>
    </div>
  );
}
