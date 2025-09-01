
'use client';

import { useEffect, useState } from "react";
import { getClientDb } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface RateEntry {
    fruit: string;
    category: 'Normal' | 'Extraordinary';
    rateRange: string;
    updatedAt: string;
}

interface ProcessedRates {
    [fruitName: string]: {
        normal?: string;
        extraordinary?: string;
    }
}

export default function RateList() {
  const [rates, setRates] = useState<ProcessedRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
        const fetchRates = async () => {
            try {
                const db = getClientDb();
                if (db) {
                    const ratesCollection = collection(db, "rates");
                    const q = query(ratesCollection, orderBy("fruit"));
                    const ratesSnapshot = await getDocs(q);
                    const ratesData = ratesSnapshot.docs.map(doc => doc.data() as RateEntry);
                    
                    const processed: ProcessedRates = {};
                    ratesData.forEach(rate => {
                        if (!processed[rate.fruit]) {
                            processed[rate.fruit] = {};
                        }
                        if (rate.category === 'Normal') {
                            processed[rate.fruit].normal = rate.rateRange;
                        } else if (rate.category === 'Extraordinary') {
                            processed[rate.fruit].extraordinary = rate.rateRange;
                        }
                    });
                    setRates(processed);
                }
            } catch (error) {
                console.error("Error fetching rates:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRates();
    }
  }, [isClient]);

  return (
    <Card>
        <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-primary">
                🍎 Today’s Rate List
            </CardTitle>
            <CardDescription className="text-center">
                Rates can change daily. Updated directly from F.Co Billing System ✅
            </CardDescription>
        </CardHeader>
        <CardContent>
             {loading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : rates && Object.keys(rates).length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                    <Table>
                        <TableHeader>
                        <TableRow className="bg-muted hover:bg-muted">
                            <TableHead className="p-3 font-semibold">Variety</TableHead>
                            <TableHead className="p-3 font-semibold">Normal Rate</TableHead>
                            <TableHead className="p-3 font-semibold">Extraordinary</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {Object.entries(rates).map(([name, value], idx) => (
                            <TableRow key={idx}>
                                <TableCell className="p-3 font-medium">{name}</TableCell>
                                <TableCell className="p-3">{value.normal || "-"}</TableCell>
                                <TableCell className="p-3">{value.extraordinary || "-"}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                 <p className="text-center mt-6 text-muted-foreground">No rates available for today.</p>
            )}
        </CardContent>
    </Card>
  );
}
