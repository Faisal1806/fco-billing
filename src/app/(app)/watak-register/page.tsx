
'use client'

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
import { wataks, type Watak } from '@/lib/data';
import { useLanguage } from '@/contexts/language-context';
import { PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function WatakRegisterPage() {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{t('watak_register')}</CardTitle>
                <CardDescription>{t('watak_register_subtitle')}</CardDescription>
            </div>
            <Button size="sm" className="gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    {t('add_watak')}
                </span>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('date')}</TableHead>
              <TableHead>{t('customer_name')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead className="text-right">{t('amount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wataks.map((watak: Watak) => (
              <TableRow key={watak.id}>
                <TableCell>{watak.date.toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{watak.customerName}</TableCell>
                <TableCell>
                    <Badge variant={watak.paymentStatus === 'Paid' ? 'secondary' : 'outline'}>{watak.paymentStatus}</Badge>
                </TableCell>
                <TableCell className="text-right">₹{watak.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
