
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dailyRates, type DailyRates } from "@/lib/data";

export default function RateList() {
  const [rates, setRates] = useState<DailyRates>(dailyRates);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">
            📊 Daily Rate List
        </CardTitle>
        <CardDescription>
            Current market rates for different fruit varieties.
        </CardDescription>
      </CardHeader>
      <CardContent>
          {Object.keys(rates).length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(rates).map(([fruit, rate]) => (
                <Card
                    key={fruit}
                    className="shadow-lg rounded-2xl border hover:shadow-xl transition-shadow duration-300"
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-xl">{fruit}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor={`${fruit}-normal`}>Normal Rate</Label>
                            <Input
                                id={`${fruit}-normal`}
                                value={rate.normal || ''}
                                readOnly
                                className="border-none bg-transparent px-1 h-auto font-semibold"
                            />
                        </div>
                         <div>
                            <Label htmlFor={`${fruit}-extraordinary`}>Extraordinary Rate</Label>
                            <Input
                                id={`${fruit}-extraordinary`}
                                value={rate.extraordinary || ''}
                                readOnly
                                className="border-none bg-transparent px-1 h-auto font-semibold"
                            />
                        </div>
                    </CardContent>
                </Card>
                ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground mt-6 py-12 border-2 border-dashed rounded-lg">
                <p>No rates available for today.</p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
