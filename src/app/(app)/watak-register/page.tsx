
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
import { wataks, type WatakEntry } from '@/lib/data';
import { useLanguage } from '@/contexts/language-context';
import { PlusCircle } from 'lucide-react';

export default function WatakRegisterPage() {
  const { t } = useLanguage();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const footerTotals = wataks.reduce((acc, watak) => {
    acc.gross += watak.gross;
    acc.soporExp += watak.soporExp;
    acc.netSale += watak.netSale;
    acc.amount += watak.amount;
    return acc;
    }, { gross: 0, soporExp: 0, netSale: 0, amount: 0 });


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{t('watak_register')}</CardTitle>
                <CardDescription>{"Grower's Name: Mohd Ayoub Khan"}</CardDescription>
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
              <TableHead>Date</TableHead>
              <TableHead>Ch No.</TableHead>
              <TableHead>Watak No.</TableHead>
              <TableHead>Khata</TableHead>
              <TableHead>Peti</TableHead>
              <TableHead>Daba</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Sopore Exp.</TableHead>
              <TableHead className="text-right">Net Sale</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wataks.map((watak: WatakEntry) => (
              <TableRow key={watak.id}>
                <TableCell>{isClient ? watak.date.toLocaleDateString('en-GB') : ''}</TableCell>
                <TableCell>{watak.chNo}</TableCell>
                <TableCell>{watak.watakNo}</TableCell>
                <TableCell className="font-medium">{watak.khata}</TableCell>
                <TableCell>{watak.peti}</TableCell>
                <TableCell>{watak.daba}</TableCell>
                <TableCell className="text-right">{watak.gross.toFixed(2)}</TableCell>
                <TableCell className="text-right">{watak.soporExp.toFixed(2)}</TableCell>
                <TableCell className="text-right">{watak.netSale.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{watak.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
             <TableRow className="font-bold bg-muted">
                <TableCell colSpan={6} className="text-right">Total</TableCell>
                <TableCell className="text-right">{footerTotals.gross.toFixed(2)}</TableCell>
                <TableCell className="text-right">{footerTotals.soporExp.toFixed(2)}</TableCell>
                <TableCell className="text-right">{footerTotals.netSale.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{footerTotals.amount.toFixed(2)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

