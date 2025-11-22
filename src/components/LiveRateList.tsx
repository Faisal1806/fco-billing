

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Calendar } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

interface LiveRate {
    variety: string;
    type: 'Patti' | 'Dabba';
    rate: string;
}

// Data is hardcoded here to simulate a live feed.
// This can be replaced with a real API call in the future.
const liveSoporeRates: LiveRate[] = [
    { variety: 'American', type: 'Dabba', rate: '300 - 450' },
    { variety: 'American', type: 'Patti', rate: '150 - 300' },
    { variety: 'BG', type: 'Patti', rate: '150 - 350' },
    { variety: 'Delicious', type: 'Dabba', rate: '500 - 750' },
    { variety: 'Delicious', type: 'Patti', rate: '300 - 600' },
    { variety: 'Gala', type: 'Dabba', rate: '400 - 600' },
    { variety: 'Gala', type: 'Patti', rate: '200 - 450' },
    { variety: 'Golden Delicious', type: 'Dabba', rate: '300 - 500' },
    { variety: 'Golden Delicious', type: 'Patti', rate: '150 - 300' },
    { variety: 'Kulu', type: 'Dabba', rate: '600 - 900' },
    { variety: 'Kulu', type: 'Patti', rate: '400 - 700' },
    { variety: 'Maharaji', type: 'Dabba', rate: '700 - 1100' },
    { variety: 'Maharaji', type: 'Patti', rate: '500 - 800' },
    { variety: 'Nakh', type: 'Patti', rate: '100 - 250' },
    { variety: 'Shimla', type: 'Dabba', rate: '350 - 600' },
];


export default function LiveRateList() {
    const [rates, setRates] = useState<LiveRate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState('');

    useEffect(() => {
        // Simulate fetching live data
        setIsLoading(true);
        setTimeout(() => {
            setRates(liveSoporeRates.sort((a,b) => a.variety.localeCompare(b.variety)));
            setLastUpdated(new Date().toLocaleString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            }));
            setIsLoading(false);
        }, 500);
    }, []);

    const handleShare = () => {
        const dateString = new Date().toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        
        let shareText = `*Official Sopore Mandi Rates - ${dateString}*\n`;
        shareText += `*Source: Firdous Ahmad & Company*\n\n`;

        rates.forEach(rate => {
            if (rate.variety && rate.rate) {
                const name = `${rate.variety} (${rate.type})`;
                shareText += `- ${name}: *₹${rate.rate}*\n`;
            }
        });
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
    };
    
    return (
        <Card className="border-primary border-2 shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                           📣 Live Sopore Mandi Rates (Official)
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                           <Calendar className="h-4 w-4" /> A daily updated list of official market rates for comparison. Last updated: {lastUpdated}
                        </CardDescription>
                    </div>
                     <Button variant="secondary" onClick={handleShare} className="gap-2">
                        <FaWhatsapp className="h-4 w-4 text-green-500" />
                        Share Official List
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="ml-4">Fetching today's live rates...</p>
                    </div>
                 ) : rates.length > 0 ? (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Variety / Kind</TableHead>
                                    <TableHead className="text-right">Today's Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rates.map(rate => (
                                    <TableRow key={`${rate.variety}-${rate.type}`}>
                                        <TableCell className="font-medium">{rate.variety} ({rate.type})</TableCell>
                                        <TableCell className="text-right font-semibold text-lg">
                                            ₹{rate.rate}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </>
                ) : (
                     <div className="text-center text-muted-foreground mt-6 py-12 border-2 border-dashed rounded-lg">
                        <p>Could not fetch live rates at the moment.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
