
'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface ReceiptData {
    no: string;
    date: string;
    customerName: string;
    ro: string;
    entries: {
        khata: string;
        peti: number;
        daba: number;
        freight: string;
    }[];
    totalNugs: number;
    freightPaid: number;
    wattakReadyOn: string;
}


export default function ReceiptPage({ params }: { params: { id: string } }) {
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const storedReceipt = localStorage.getItem(`receipt-${params.id}`);
        if (storedReceipt) {
            setReceiptData(JSON.parse(storedReceipt));
        }
        setLoading(false);
    }, [params.id]);


    const handleShare = async () => {
        if (navigator.share && receiptData) {
            try {
                await navigator.share({
                    title: `Receipt for ${receiptData.customerName}`,
                    text: `Here is the receipt #${receiptData.no} for ${receiptData.customerName}.`,
                    url: window.location.href,
                });
                toast({ title: "Receipt Shared", description: "The receipt link has been shared." });
            } catch (error) {
                toast({ variant: "destructive", title: "Share Failed", description: "Could not share the receipt." });
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                toast({ title: "Link Copied", description: "Receipt link copied to clipboard." });
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

    if (!receiptData) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md mx-auto text-center">
                    <CardHeader>
                        <CardTitle>Receipt Not Found</CardTitle>
                        <CardDescription>The receipt you are looking for does not exist or has been deleted.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const {
        no, date, customerName, ro, entries,
        totalNugs, freightPaid, wattakReadyOn
    } = receiptData;

    return (
        <div className="bg-white min-h-screen p-4 sm:p-6 md:p-8 print:bg-white font-sans">
            <Card className="w-full max-w-2xl mx-auto shadow-none border print:shadow-none print:border">
                <CardHeader className="p-4">
                    <div className="text-center mb-4">
                        <h1 className="text-2xl font-bold text-gray-800">FIRDOUS AHMAD & COMPANY</h1>
                        <p className="text-xs text-gray-600">Fruit Merchants & Commission Agents</p>
                        <p className="text-xs text-gray-600">SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.</p>
                        <p className="text-xs text-gray-600">Prop: Firdous Ahmad Lone (Nadihal)</p>
                        <p className="text-xs text-gray-600">Cell: 7006136330, 9797002164</p>
                    </div>
                     <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <p><strong>No:</strong> {no}</p>
                            <p><strong>M/s:</strong> {customerName}</p>
                            <p><strong>R/o:</strong> {ro}</p>
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
                                <TableHead className="w-[10%]">S.No.</TableHead>
                                <TableHead>KHATA</TableHead>
                                <TableHead className="w-[10%]">PETI</TableHead>
                                <TableHead className="w-[10%]">DABA</TableHead>
                                <TableHead className="w-[20%]">FREIGHT</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 8 }).map((_, index) => {
                                const entry = entries[index];
                                return (
                                <TableRow key={index} className="h-10">
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{entry?.khata || ''}</TableCell>
                                    <TableCell>{entry?.peti || ''}</TableCell>
                                    <TableCell>{entry?.daba || ''}</TableCell>
                                    <TableCell>{entry?.freight || ''}</TableCell>
                                </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>

                    <Separator className="my-2" />

                    <div className="grid grid-cols-2 gap-4 text-xs mt-2 px-2">
                        <div>
                           <p><strong>Freight Paid Rs:</strong> {freightPaid > 0 ? freightPaid.toFixed(2) : ''}</p>
                           <p><strong>Wattak Ready On:</strong> {wattakReadyOn}</p>
                        </div>
                        <div className="text-right">
                           <p><strong>Total Nugs:</strong> {totalNugs}</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-end p-4 mt-4">
                     <Controls />
                     <div className="flex flex-col items-center">
                        <div className="w-24 h-8 border-b border-gray-400"></div>
                        <p className="text-xs font-semibold">Signature</p>
                     </div>
                </CardFooter>
            </Card>
        </div>
    );
}
