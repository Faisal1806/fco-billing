'use client';

import AutomaticRateList from "@/components/AutomaticRateList";
import LiveRateList from "@/components/LiveRateList";
import OutsideLiveRateList from "@/components/OutsideLiveRateList";
import DailyRateBoard from "@/components/DailyRateBoard";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, ClipboardList } from "lucide-react";

export default function RatesPage() {
  return (
      <div className="space-y-8">
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-3xl"><TrendingUp className="h-8 w-8 text-primary"/> National Fruit Market Rates</CardTitle>
                <CardDescription>View your local and outside market rates, automatically generated from your sales and bikri records, plus see today's official Sopore Mandi rates.</CardDescription>
            </CardHeader>
        </Card>

        <section>
            <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Manual Daily Rate Board</h2>
            </div>
            <DailyRateBoard />
        </section>

        <Separator className="my-8" />

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
      </div>
  );
}
