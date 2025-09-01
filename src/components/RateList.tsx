
"use client";

import { useEffect, useState } from "react";
import { dailyRates, type DailyRates } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";


export default function RateList() {
  const [rates, setRates] = useState<DailyRates | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setRates(dailyRates);
    setLoading(false);
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
          {rates && Object.keys(rates).length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(rates).map(([fruit, rate]) => (
                <Card
                    key={fruit}
                    className="shadow-lg rounded-2xl border hover:shadow-xl transition-shadow duration-300"
                >
                    <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-foreground">
                        {fruit}
                    </h3>
                    <p className="text-muted-foreground">Normal: ₹{rate.normal}</p>
                    {rate.extraordinary && <p className="text-primary font-semibold">Extraordinary: ₹{rate.extraordinary}</p>}
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
