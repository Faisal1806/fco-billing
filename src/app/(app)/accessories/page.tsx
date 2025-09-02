
'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AccessoriesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accessories & Daily Ledger</CardTitle>
        <CardDescription>This feature is coming soon. You will be able to track sales of accessories like tape, wood, and other items, and convert rough ledger entries into final bills.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
            <p>This feature is under construction.</p>
        </div>
      </CardContent>
    </Card>
  );
}
