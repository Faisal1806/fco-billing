
'use client';

import { useEffect, useState } from "react";
import { getClientDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export default function RateList() {
  const [rates, setRates] = useState<any>(null);
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
                    const docRef = doc(db, "rates", "today");
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setRates(docSnap.data());
                    } else {
                        console.log("No such document!");
                    }
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
            ) : rates ? (
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
                        {Object.entries(rates).map(([name, value]: any, idx) => (
                            <TableRow key={idx}>
                                <TableCell className="p-3 font-medium">{name.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                                <TableCell className="p-3">₹{value.normal || "-"}</TableCell>
                                <TableCell className="p-3">₹{value.extraordinary || "-"}</TableCell>
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
