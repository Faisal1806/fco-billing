'use client';

import AutomaticRateList from "@/components/AutomaticRateList";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function FertilizersPage() {
  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Fertilizers & Pesticides</CardTitle>

          <CardDescription>
            Automatically generated rates from sales.
          </CardDescription>
        </CardHeader>
      </Card>

      <AutomaticRateList
        sourceType="fertilizer"
        title="Automatic Fertilizer & Pesticide Rate List (from Sales)"
      />

      <Separator className="my-8" />
    </>
  );
}


