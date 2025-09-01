
"use client";

import { useEffect, useState } from "react";
import { getClientDb } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";


interface Rate {
  id: string;
  fruit: string;
  category: string;
  rateRange: string;
}

export default function RateList() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
        const db = getClientDb();
        if (!db) {
            console.error("Firestore is not available");
            setLoading(false);
            return;
        }
      const querySnapshot = await getDocs(query(collection(db, "rates")));
      const fetchedRates: Rate[] = [];
      querySnapshot.forEach((doc) => {
        fetchedRates.push({ id: doc.id, ...doc.data() } as Rate);
      });
      setRates(fetchedRates);
      setLoading(false);
    };
    fetchRates();
  }, []);

  if (loading) {
    return (
        <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4 text-lg">Loading rates...</p>
        </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-3xl font-bold text-primary">
            📊 Today’s Rate List
        </CardTitle>
         <CardDescription className="text-center">
            Rates can change daily. Updated directly from F.Co Billing System ✅
        </CardDescription>
      </CardHeader>
      <CardContent>
          {rates.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rates.map((rate) => (
                <Card
                    key={rate.id}
                    className="shadow-lg rounded-2xl border hover:shadow-xl transition-shadow duration-300"
                >
                    <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-foreground">
                        {rate.fruit}
                    </h3>
                    <p className="text-muted-foreground">Category: {rate.category}</p>
                    <p className="text-2xl font-bold text-primary mt-2">
                        ₹{rate.rateRange}
                    </p>
                    </CardContent>
                </Card>
                ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground mt-6">No rates available for today.</p>
          )}
      </CardContent>
    </Card>
  );
}
