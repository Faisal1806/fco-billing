
'use client'

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { expenses, type Expense } from '@/lib/data';
import { useLanguage } from '@/contexts/language-context';
import { PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ExpensesPage() {
  const { t } = useLanguage();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{t('expenses')}</CardTitle>
                <CardDescription>{t('expenses_subtitle')}</CardDescription>
            </div>
            <Button size="sm" className="gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    {t('add_expense')}
                </span>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('date')}</TableHead>
              <TableHead>{t('description')}</TableHead>
              <TableHead>{t('category')}</TableHead>
              <TableHead className="text-right">{t('amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense: Expense) => (
              <TableRow key={expense.id}>
                <TableCell>{isClient ? expense.date.toLocaleDateString() : ''}</TableCell>
                <TableCell className="font-medium">{expense.description}</TableCell>
                <TableCell>
                    <Badge variant="outline">{expense.category}</Badge>
                </TableCell>
                <TableCell className="text-right">₹{expense.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
