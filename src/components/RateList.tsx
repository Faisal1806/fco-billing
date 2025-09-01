
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WatakEntry } from "@/app/(app)/watak-register/page";
import { Loader2 } from "lucide-react";

interface DailyRate {
    variety: string;
    rates: number[];
}

export default function RateList() {
  const [dailyRates, setDailyRates] = useState<DailyRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndProcessWataks = () => {
        setIsLoading(true);
        const today = new Date().toDateString();
        const todaysRates: { [key: string]: Set<number> } = {};

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('invoice-')) {
                try {
                    const watak: WatakEntry = JSON.parse(localStorage.getItem(key)!);
                    if (new Date(watak.date).toDateString() === today) {
                        watak.entries.forEach(entry => {
                            if (entry.variety && entry.rate > 0) {
                                if (!todaysRates[entry.variety]) {
                                    todaysRates[entry.variety] = new Set();
                                }
                                todaysRates[entry.variety].add(entry.rate);
                            }
                        });
                    }
                } catch (e) {
                    console.error("Could not parse watak from local storage", e);
                }
            }
        }

        const processedRates: DailyRate[] = Object.entries(todaysRates).map(([variety, ratesSet]) => ({
            variety,
            rates: Array.from(ratesSet).sort((a, b) => a - b)
        }));

        setDailyRates(processedRates);
        setIsLoading(false);
    };

    fetchAndProcessWataks();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">
            📊 Daily Rate List
        </CardTitle>
        <CardDescription>
            Automatically updated rates based on today's wataks.
        </CardDescription>
      </CardHeader>
      <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="ml-4">Loading today's rates...</p>
            </div>
          ) : dailyRates.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dailyRates.map(({ variety, rates }) => (
                <Card
                    key={variety}
                    className="shadow-lg rounded-2xl border hover:shadow-xl transition-shadow duration-300"
                >
                    <CardHeader>
                        <CardTitle className="text-xl">{variety}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold text-lg">
                           ₹{rates.join(' / ')}
                        </p>
                    </CardContent>
                </Card>
                ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground mt-6 py-12 border-2 border-dashed rounded-lg">
                <p>No wataks have been created today.</p>
                <p className="text-sm">Rates will appear here as you create new wataks.</p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
