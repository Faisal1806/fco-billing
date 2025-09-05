
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
    const [displayDate, setDisplayDate] = useState(new Date());
    const [rates, setRates] = useState<DailyRate[]>([]);
    const [ratesDate, setRatesDate] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchRatesForDate = (dateToFetch: Date) => {
            const dateString = dateToFetch.toISOString().split('T')[0];
            const todaysRates: { [key: string]: DailyRate } = {};

            for (let j = 0; j < localStorage.length; j++) {
                const key = localStorage.key(j);
                if (!key) continue;

                try {
                    let docDate: string | undefined;
                    let docEntries: any[] = [];
                    let varietyKey: string = 'variety';
                    let rateKey: string = 'rate';

                    if (sourceType === 'fruit' && key.startsWith('invoice-')) {
                        const watak: WatakEntry = JSON.parse(localStorage.getItem(key)!);
                        docDate = watak.date;
                        docEntries = watak.entries;
                    } else if (sourceType === 'fertilizer' && key.startsWith('pesticide-invoice-')) {
                        const bill: PesticideBillData = JSON.parse(localStorage.getItem(key)!);
                        docDate = bill.date;
                        docEntries = bill.entries;
                        varietyKey = 'particulars';
                    }

                    if (docDate === dateString && docEntries) {
                        docEntries.forEach(entry => {
                            const name = entry[varietyKey];
                            const rate = entry[rateKey];
                            if (name && rate > 0) {
                                if (!todaysRates[name]) {
                                    todaysRates[name] = { name: name, rates: new Set() };
                                }
                                todaysRates[name].rates.add(rate);
                            }
                        });
                    }
                } catch (e) {
                    console.error(`Could not parse item from local storage: ${key}`, e);
                }
            }
            return Object.values(todaysRates).sort((a,b) => a.name.localeCompare(b.name));
        };

        const findLatestRates = (dateToSearchFrom: Date) => {
            setIsLoading(true);
            let foundRates = false;
            let dateWithRates: Date | null = null;
            let processedRates: DailyRate[] = [];

            // First check the selected date
            processedRates = fetchRatesForDate(dateToSearchFrom);
            if (processedRates.length > 0) {
                 setRates(processedRates);
                 setRatesDate(dateToSearchFrom);
                 setIsLoading(false);
                 return;
            }

            // If no rates on selected date, search backwards
            for (let i = 1; i <= 30; i++) { // Look back up to 30 days
                const pastDate = new Date(dateToSearchFrom);
                pastDate.setDate(pastDate.getDate() - i);
                
                processedRates = fetchRatesForDate(pastDate);

                if (processedRates.length > 0) {
                    setRates(processedRates);
                    dateWithRates = pastDate;
                    foundRates = true;
                    break;
                }
            }

            if (!foundRates) {
                setRates([]);
                setRatesDate(null);
            } else {
                setRatesDate(dateWithRates);
            }
            
            setIsLoading(false);
        };
        
        findLatestRates(displayDate);
    }, [displayDate, sourceType]);

    const handleDateChange = (days: number) => {
        setDisplayDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setDate(newDate.getDate() + days);
            const today = new Date();
            today.setHours(0,0,0,0);
            
            // Prevent navigating to a future date
            if (newDate > today) {
                return prevDate;
            }
            return newDate;
        });
    };

    const handleShare = () => {
        if (!ratesDate) return;
        const dateString = ratesDate.toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        
        let shareText = `*${title} - ${dateString}*\n`;
        shareText += `*FIRDOUS AHMAD & COMPANY*\n\n`;

        rates.forEach(rate => {
            if (rate.name && rate.rates.size > 0) {
                const rateString = Array.from(rate.rates).sort((a,b) => a-b).join('-');
                shareText += `- ${rate.name}: *₹${rateString}*\n`;
            }
        });
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
    };
    
    const isToday = displayDate.toDateString() === new Date().toDateString();
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <CardTitle className="text-2xl font-bold text-primary">
                            📊 {title}
                        </CardTitle>
                        <CardDescription>
                           {ratesDate ? `Showing rates for ${ratesDate.toLocaleDateString('en-CA')}` : `No rates found for the selected period.`}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleDateChange(-1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold">{displayDate.toLocaleDateString('en-CA')}</span>
                        <Button variant="outline" size="icon" onClick={() => handleDateChange(1)} disabled={isToday}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="ml-4">Loading rates for {displayDate.toLocaleDateString('en-CA')}...</p>
                    </div>
                 ) : rates.length > 0 && ratesDate ? (
                    <>
                        {ratesDate.toDateString() !== displayDate.toDateString() && (
                            <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md text-sm">
                                No sales found for {displayDate.toLocaleDateString('en-CA')}. Showing most recent rates from {ratesDate.toLocaleDateString('en-CA')}.
                            </div>
                        )}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{sourceType === 'fruit' ? 'Variety' : 'Particulars'}</TableHead>
                                    <TableHead className="text-right">Rate Range</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rates.map(rate => (
                                    <TableRow key={rate.name}>
                                        <TableCell className="font-medium">{rate.name}</TableCell>
                                        <TableCell className="text-right font-semibold text-lg">
                                            ₹{Array.from(rate.rates).sort((a, b) => a - b).join(' - ')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         <div className="mt-4 flex justify-end">
                            <Button variant="secondary" onClick={handleShare} className="gap-2">
                                <FaWhatsapp className="h-4 w-4 text-green-500" />
                                Share List
                            </Button>
                        </div>
                    </>
                ) : (
                     <div className="text-center text-muted-foreground mt-6 py-12 border-2 border-dashed rounded-lg">
                        <p>No sales recorded for this date or any recent day.</p>
                        <p className="text-sm">Rates will appear here as you create new sales documents.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
