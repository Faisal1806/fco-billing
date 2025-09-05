
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
        const fetchRates = (dateToSearchFrom: Date) => {
            setIsLoading(true);
            let foundRates = false;
            let dateWithRates: Date | null = null;

            for (let i = 0; i < 30; i++) { // Look back up to 30 days
                const dateToFetch = new Date(dateToSearchFrom);
                dateToFetch.setDate(dateToFetch.getDate() - i);
                const dateString = dateToFetch.toISOString().split('T')[0];
                const todaysRates: { [key: string]: DailyRate } = {};

                for (let j = 0; j < localStorage.length; j++) {
                    const key = localStorage.key(j);
                    if (!key) continue;

                    try {
                        if (sourceType === 'fruit' && key.startsWith('invoice-')) {
                            const watak: WatakEntry = JSON.parse(localStorage.getItem(key)!);
                            if (watak.date === dateString) {
                                watak.entries.forEach(entry => {
                                    if (entry.variety && entry.rate > 0) {
                                        if (!todaysRates[entry.variety]) {
                                            todaysRates[entry.variety] = { name: entry.variety, rates: new Set() };
                                        }
                                        todaysRates[entry.variety].rates.add(entry.rate);
                                    }
                                });
                            }
                        } else if (sourceType === 'fertilizer' && key.startsWith('pesticide-invoice-')) {
                            const bill: PesticideBillData = JSON.parse(localStorage.getItem(key)!);
                            if (bill.date === dateString) {
                                bill.entries.forEach(entry => {
                                    if (entry.particulars && entry.rate > 0) {
                                        if (!todaysRates[entry.particulars]) {
                                            todaysRates[entry.particulars] = { name: entry.particulars, rates: new Set() };
                                        }
                                        todaysRates[entry.particulars].rates.add(entry.rate);
                                    }
                                });
                            }
                        }
                    } catch (e) {
                        console.error(`Could not parse item from local storage: ${key}`, e);
                    }
                }

                const processedRates = Object.values(todaysRates).sort((a,b) => a.name.localeCompare(b.name));
                if (processedRates.length > 0) {
                    setRates(processedRates);
                    dateWithRates = dateToFetch;
                    foundRates = true;
                    break;
                }
            }

            if (!foundRates) {
                setRates([]);
            }

            setRatesDate(dateWithRates);
            setIsLoading(false);
        };
        
        fetchRates(displayDate);
    }, [displayDate, sourceType]);

    const handleDateChange = (days: number) => {
        setDisplayDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setDate(newDate.getDate() + days);
            // Prevent navigating to a future date
            if (newDate > new Date()) {
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
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-2xl font-bold text-primary">
                            📊 {title}
                        </CardTitle>
                        <CardDescription>
                           {ratesDate ? `Showing rates for ${ratesDate.toLocaleDateString('en-CA')}` : `Searching for rates...`}
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
