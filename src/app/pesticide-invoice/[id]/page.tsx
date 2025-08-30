
'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface BillData {
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


export default function PesticideInvoicePage({ params }: { params: { id: string } }) {
    const [billData, setBillData] = useState<BillData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const storedBill = localStorage.getItem(`pesticide-invoice-${params.id}`);
        if (storedBill) {
            setBillData(JSON.parse(storedBill));
        }
        setLoading(false);
    }, [params.id]);

    const handleShare = async () => {
        if (navigator.share && billData) {
            try {
                await navigator.share({
                    title: `Pesticide Bill for ${billData.customerName}`,
                    text: `Here is the bill #${billData.no} for ${billData.customerName}.`,
                    url: window.location.href,
                });
                toast({ title: "Bill Shared", description: "The bill link has been shared." });
            } catch (error) {
                toast({ variant: "destructive", title: "Share Failed", description: "Could not share the bill." });
            }
        } else {
             try {
                await navigator.clipboard.writeText(window.location.href);
                toast({ title: "Link Copied", description: "Bill link copied to clipboard." });
            } catch (error) {
                 toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy the link." });
            }
        }
    };

    const Controls = () => {
        'use client'
        return (
             <div className="flex items-center gap-2 print:hidden">
                <Button onClick={handleShare} variant="outline" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                </Button>
                <Button onClick={() => window.print()} className="gap-2">
                    <Printer className="h-4 w-4" />
                    Print
                </Button>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="bg-background min-h-screen p-4 sm:p-8 md:p-12">
                 <Card className="w-full max-w-2xl mx-auto">
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-48 w-full" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-32" />
                    </CardFooter>
                 </Card>
            </div>
        )
    }

    if (!billData) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md mx-auto text-center">
                    <CardHeader>
                        <CardTitle>Bill Not Found</CardTitle>
                        <CardDescription>The bill you are looking for does not exist or has been deleted.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const {
        no, date, customerName, entries, grandTotal
    } = billData;

    return (
        <div className="bg-white min-h-screen p-4 sm:p-6 md:p-8 print:bg-white font-sans">
            <Card className="w-full max-w-2xl mx-auto shadow-none border print:shadow-none print:border">
                <CardHeader className="p-4">
                    <div className="text-center mb-4">
                        <h1 className="text-2xl font-bold text-gray-800">F. Co Pesticides & Fertilizers</h1>
                        <p className="text-sm text-gray-600">Deals in:- All kinds of Pesticides & Fertilizers</p>
                        <p className="text-sm text-gray-600">NEAR JAMIA MASJID NADIHAL</p>
                        <p className="text-sm text-gray-600">Cell: 9797002164, 7006136330</p>
                    </div>
                     <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <p><strong>No:</strong> {no}</p>
                            <p><strong>M/s:</strong> {customerName}</p>
                        </div>
                        <div className="text-right">
                             <p><strong>Dated:</strong> {new Date(date).toLocaleDateString()}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-2">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[10%]">S.NO.</TableHead>
                                <TableHead>PARTICULARS</TableHead>
                                <TableHead className="w-[15%] text-right">QTY</TableHead>
                                <TableHead className="w-[15%] text-right">RATE</TableHead>
                                <TableHead className="w-[20%] text-right">AMOUNT</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map((entry, index) => (
                                <TableRow key={index}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{entry.particulars}</TableCell>
                                    <TableCell className="text-right">{entry.qty}</TableCell>
                                    <TableCell className="text-right">{entry.rate.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">₹{entry.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                             {/* Add empty rows to fill space */}
                             {Array.from({ length: Math.max(0, 10 - entries.length) }).map((_, index) => (
                                <TableRow key={`empty-${index}`} className="h-10">
                                    <TableCell>{entries.length + index + 1}</TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Separator className="my-2" />

                    <div className="flex justify-end text-sm mt-2 px-4">
                        <div className="w-full max-w-xs">
                           <div className="flex justify-between font-bold text-lg border-t pt-2">
                             <span>G. Total</span>
                             <span>₹{grandTotal.toFixed(2)}</span>
                           </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-end p-4 mt-8">
                     <div>
                        <p className="text-xs">Goods once sold can not be taken back.</p>
                        <Controls />
                     </div>
                     <div className="flex flex-col items-center">
                        <div className="w-32 h-8 border-b border-gray-400"></div>
                        <p className="text-xs font-semibold">Signature</p>
                     </div>
                </CardFooter>
            </Card>
        </div>
    );
}
