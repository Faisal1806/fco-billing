
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
import { ChevronDown, PlusCircle, Share2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const growers = [
    "Mohd Ayoub Khan",
    "Firdous Ahmad Lone",
    "Samia Ayoub",
    "Khan Ayoub",
];

export default function WatakRegisterPage() {
  const { t } = useLanguage();
  const [isClient, setIsClient] = React.useState(false);
  const [selectedGrower, setSelectedGrower] = React.useState(growers[0]);
  const { toast } = useToast();

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

  const handleShare = async () => {
    const shareText = `Watak Register for ${selectedGrower}`;
     if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Watak Register',
                    text: shareText,
                    url: window.location.href,
                });
                toast({ title: "Register Shared", description: "The register link has been shared." });
            } catch (error) {
                toast({ variant: "destructive", title: "Share Failed", description: "Could not share the register." });
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                toast({ title: "Link Copied", description: "Register link copied to clipboard." });
            } catch (error) {
                 toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy the link." });
            }
        }
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
                <CardTitle>{t('watak_register')}</CardTitle>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                           <span>{`Grower: ${selectedGrower}`}</span>
                           <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {growers.map(grower => (
                             <DropdownMenuItem key={grower} onSelect={() => setSelectedGrower(grower)}>
                                {grower}
                             </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Grower
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm" className="gap-1" onClick={handleShare} variant="outline">
                    <Share2 className="h-3.5 w-3.5" />
                     <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Share Register
                    </span>
                </Button>
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        {t('add_watak')}
                    </span>
                </Button>
            </div>
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
                <TableCell>{isClient ? new Date(watak.date).toLocaleDateString('en-GB') : ''}</TableCell>
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
