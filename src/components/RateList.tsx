
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WatakEntry } from "@/app/watak-register/page";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SeasonRate {
    name: string;
    rates: Set<number>;
}

export default function RateList() {
  const [seasonRates, setSeasonRates] = useState<SeasonRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentWataks, setRecentWataks] = useState<WatakEntry[]>([]);

  useEffect(() => {
    const fetchAndProcessWataks = () => {
        setIsLoading(true);
        const allTimeRates: { [key: string]: SeasonRate } = {};
        const allWataks: WatakEntry[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('invoice-')) {
                try {
                    const watak: WatakEntry = JSON.parse(localStorage.getItem(key)!);
                    allWataks.push(watak);
                    watak.entries.forEach(entry => {
                        const rate = entry.rate;
                        // Handle both old and new entry formats
                        const type = (entry as any).type || (((entry as any).peti ?? 0) > 0 ? 'Patti' : 'Dabba');
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
        
        allWataks.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentWataks(allWataks.slice(0, 5));

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
            📋 Recent Wataks
        </CardTitle>
        <CardDescription>
            A list of your 5 most recent sales invoices (wataks).
        </CardDescription>
      </CardHeader>
      <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="ml-4">Loading recent wataks...</p>
            </div>
          ) : recentWataks.length > 0 ? (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Invoice No.</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Net Sale</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentWataks.map(watak => (
                        <TableRow key={watak.id}>
                            <TableCell className="font-medium">{watak.sNo}</TableCell>
                            <TableCell>{watak.customerName}</TableCell>
                            <TableCell>{new Date(watak.date).toLocaleDateString('en-GB')}</TableCell>
                            <TableCell className="text-right font-mono">₹{watak.totals.netSale.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground mt-6 py-12 border-2 border-dashed rounded-lg">
                <p>No sales have been recorded yet.</p>
                <p className="text-sm">Your recent wataks will appear here once you create them.</p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}


