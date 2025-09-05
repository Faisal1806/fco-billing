
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { WatakEntry } from '@/app/(app)/watak-register/page';

interface PesticideBillData {
    no: string;
    date: string;
    customerName: string;
    entries: {
        particulars: string;
        qty: string;
        rate: number;
        amount: number;
    }[];
    grandTotal: number;
}

interface DailyRate {
    name: string;
    rates: Set<number>;
    category?: string;
}

interface AutomaticRateListProps {
    sourceType: 'fruit' | 'fertilizer';
    title: string;
}

export default function AutomaticRateList({ sourceType, title }: AutomaticRateListProps) {
    const [rates, setRates] = useState<DailyRate[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchAllRates = () => {
            setIsLoading(true);
            const allTimeRates: { [key: string]: DailyRate } = {};

            for (let j = 0; j < localStorage.length; j++) {
                const key = localStorage.key(j);
                if (!key) continue;

                try {
                    let docEntries: any[] = [];
                    let varietyKey: string = 'variety';
                    let rateKey: string = 'rate';

                    if (sourceType === 'fruit' && key.startsWith('invoice-')) {
                        const watak: WatakEntry = JSON.parse(localStorage.getItem(key)!);
                        docEntries = watak.entries;
                    } else if (sourceType === 'fertilizer' && key.startsWith('pesticide-invoice-')) {
                        const bill: PesticideBillData = JSON.parse(localStorage.getItem(key)!);
                        docEntries = bill.entries;
                        varietyKey = 'particulars';
                    }

                    if (docEntries) {
                        docEntries.forEach(entry => {
                            const name = entry[varietyKey];
                            const rate = entry[rateKey];
                            if (name && rate > 0) {
                                if (!allTimeRates[name]) {
                                    allTimeRates[name] = { name: name, rates: new Set() };
                                }
                                allTimeRates[name].rates.add(rate);
                            }
                        });
                    }
                } catch (e) {
                    console.error(`Could not parse item from local storage: ${key}`, e);
                }
            }
            const processedRates = Object.values(allTimeRates).sort((a,b) => a.name.localeCompare(b.name));
            setRates(processedRates);
            setIsLoading(false);
        };

        fetchAllRates();
    }, [sourceType]);

    const handleShare = () => {
        const dateString = new Date().toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        
        let shareText = `*${title} - All Rates as of ${dateString}*\n`;
        shareText += `*FIRDOUS AHMAD & COMPANY*\n\n`;

        rates.forEach(rate => {
            if (rate.name && rate.rates.size > 0) {
                const rateString = Array.from(rate.rates).sort((a,b) => a-b).join(' / ');
                shareText += `- ${rate.name}: *₹${rateString}*\n`;
            }
        });
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
    };
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <CardTitle className="text-2xl font-bold text-primary">
                            📊 {title}
                        </CardTitle>
                        <CardDescription>
                           Showing a complete list of all rates recorded for the entire season.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="ml-4">Loading all recorded rates...</p>
                    </div>
                 ) : rates.length > 0 ? (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{sourceType === 'fruit' ? 'Variety / Kind' : 'Particulars'}</TableHead>
                                    <TableHead className="text-right">Recorded Rates</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rates.map(rate => (
                                    <TableRow key={rate.name}>
                                        <TableCell className="font-medium">{rate.name}</TableCell>
                                        <TableCell className="text-right font-semibold text-lg">
                                            ₹{Array.from(rate.rates).sort((a, b) => a - b).join(' / ')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         <div className="mt-4 flex justify-end">
                            <Button variant="secondary" onClick={handleShare} className="gap-2">
                                <FaWhatsapp className="h-4 w-4 text-green-500" />
                                Share Full List
                            </Button>
                        </div>
                    </>
                ) : (
                     <div className="text-center text-muted-foreground mt-6 py-12 border-2 border-dashed rounded-lg">
                        <p>No sales have been recorded yet.</p>
                        <p className="text-sm">Rates will appear here as you create new sales documents.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
