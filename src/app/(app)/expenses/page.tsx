
'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ExpensesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses</CardTitle>
        <CardDescription>This feature is coming soon. You will be able to track your business expenses here, which will be used for Profit & Loss reporting.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
            <p>Expense tracking is under construction.</p>
        </div>
      </CardContent>
    </Card>
  );
}
