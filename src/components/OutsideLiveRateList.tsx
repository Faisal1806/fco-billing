
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Globe, Calendar } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

interface LiveRate {
    market: string;
    variety: string;
    rate: string;
}

// Data is hardcoded here to simulate a live feed for outside markets.
const liveOutsideRates: LiveRate[] = [
    { market: 'Assam', variety: 'Delicious (Dabba)', rate: '800 - 1100' },
    { market: 'Bihar', variety: 'Delicious (Dabba)', rate: '750 - 1050' },
    { market: 'Delhi', variety: 'American (Dabba)', rate: '500 - 700' },
    { market: 'Delhi', variety: 'Delicious (Dabba)', rate: '700 - 1000' },
    { market: 'Guwahati', variety: 'Delicious (Dabba)', rate: '850 - 1150' },
    { market: 'Jammu', variety: 'American (Dabba)', rate: '450 - 650' },
    { market: 'Kanpur', variety: 'Delicious (Dabba)', rate: '650 - 950' },
    { market: 'Kolkata', variety: 'Delicious (Dabba)', rate: '900 - 1200' },
    { market: 'Kolkata', variety: 'Gala (Dabba)', rate: '800 - 1100' },
    { market: 'Malda', variety: 'Kulu (Dabba)', rate: '1000 - 1300' },
];


export default function OutsideLiveRateList() {
    const [rates, setRates] = useState<LiveRate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState('');

    useEffect(() => {
        // Simulate fetching live data
        setIsLoading(true);
        setTimeout(() => {
            setRates(liveOutsideRates.sort((a,b) => a.market.localeCompare(b.market) || a.variety.localeCompare(b.variety)));
            setLastUpdated(new Date().toLocaleString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            }));
            setIsLoading(false);
        }, 700);
    }, []);

    const handleShare = () => {
        const dateString = new Date().toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        
        let shareText = `*Outside Market Rates - ${dateString}*\n`;
        shareText += `*Source: Firdous Ahmad & Company*\n\n`;

        rates.forEach(rate => {
            if (rate.market && rate.variety && rate.rate) {
                const name = `${rate.market} - ${rate.variety}`;
                shareText += `- ${name}: *₹${rate.rate}*\n`;
            }
        });
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
    };
    
    return (
        <Card className="border-blue-500 border-2 shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <CardTitle className="text-2xl font-bold text-blue-500 flex items-center gap-2">
                           <Globe className="h-6 w-6" /> Live Outside Market Rates
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                           <Calendar className="h-4 w-4" /> A guide to rates in major national markets. Last updated: {lastUpdated}
                        </CardDescription>
                    </div>
                     <Button variant="secondary" onClick={handleShare} className="gap-2">
                        <FaWhatsapp className="h-4 w-4 text-green-500" />
                        Share Outside Rates
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="ml-4">Fetching today's outside rates...</p>
                    </div>
                 ) : rates.length > 0 ? (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Market</TableHead>
                                    <TableHead>Variety / Kind</TableHead>
                                    <TableHead className="text-right">Today's Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rates.map(rate => (
                                    <TableRow key={`${rate.market}-${rate.variety}`}>
                                        <TableCell className="font-medium">{rate.market}</TableCell>
                                        <TableCell>{rate.variety}</TableCell>
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
                        <p>Could not fetch live outside rates at the moment.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


