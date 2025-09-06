
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WatakEntry } from "@/app/(app)/watak-register/page";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SeasonRate {
    name: string;
    rates: Set<number>;
}

export default function RateList() {
  const [seasonRates, setSeasonRates] = useState<SeasonRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndProcessWataks = () => {
        setIsLoading(true);
        const allTimeRates: { [key: string]: SeasonRate } = {};

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('invoice-')) {
                try {
                    const watak: WatakEntry = JSON.parse(localStorage.getItem(key)!);
                    watak.entries.forEach(entry => {
                        const rate = entry.rate;
                        // Handle both old and new entry formats
                        const type = (entry as any).type || (entry.peti > 0 ? 'Patti' : 'Dabba');
                        const variety = entry.variety;

                        if (variety && rate > 0) {
                            const compositeName = `${variety} (${type})`; 
                            if (!allTimeRates[compositeName]) {
                                allTimeRates[compositeName] = { name: compositeName, rates: new Set() };
                            }
                            allTimeRates[compositeName].rates.add(rate);
                        }
                    });
                } catch (e) {
                    console.error("Could not parse watak from local storage", e);
                }
            }
        }

        const processedRates = Object.values(allTimeRates).sort((a,b) => a.name.localeCompare(b.name));
        setSeasonRates(processedRates);
        setIsLoading(false);
    };

    fetchAndProcessWataks();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">
            📊 Sopore Mandi Rate Summary
        </CardTitle>
        <CardDescription>
            A summary of all recorded rates from your local sales this season.
        </CardDescription>
      </CardHeader>
      <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="ml-4">Loading all recorded rates...</p>
            </div>
          ) : seasonRates.length > 0 ? (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Variety / Kind</TableHead>
                        <TableHead className="text-right">Recorded Rates</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {seasonRates.slice(0, 10).map(rate => ( // Show top 10 for dashboard summary
                        <TableRow key={rate.name}>
                            <TableCell className="font-medium">{rate.name}</TableCell>
                            <TableCell className="text-right font-semibold text-lg">
                                ₹{Array.from(rate.rates).sort((a, b) => a - b).join(' / ')}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground mt-6 py-12 border-2 border-dashed rounded-lg">
                <p>No local sales have been recorded yet.</p>
                <p className="text-sm">Rates will appear here as you create new wataks.</p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

    