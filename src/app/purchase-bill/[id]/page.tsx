
'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Printer, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";

interface PurchaseData {
    billNo: string;
    date: string;
    growerName: string;
    entries: {
        type: 'Patti' | 'Dabba';
        variety: string;
        qty: number;
        rate: number;
        total: number;
    }[];
    totals: {
      totalQty: number;
      grandTotal: number;
    }
}


export default function PurchaseBillPage({ params }: { params: { id: string } }) {
    const [billData, setBillData] = useState<PurchaseData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchBill = async () => {
            if (!params.id) return;
            setLoading(true);
            try {
                const storedBill = localStorage.getItem(`purchase-${params.id}`);
                if (storedBill) {
                    setBillData(JSON.parse(storedBill));
                } else {
                     toast({
                        variant: "destructive",
                        title: "Not Found",
                        description: "The requested purchase bill was not found."
                    })
                }
            } catch (error) {
                 console.error("Error fetching purchase bill:", error);
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not fetch the purchase bill data."
                })
            } finally {
                setLoading(false);
            }
        };
        fetchBill();
    }, [params.id, toast]);


    const handleShare = async () => {
        if (navigator.share && billData) {
            try {
                await navigator.share({
                    title: `Purchase Bill from ${billData.growerName}`,
                    text: `Here is the purchase bill #${billData.billNo}.`,
                    url: window.location.href,
                });
                toast({ title: "Bill Shared", description: "The purchase bill link has been shared." });
            } catch (error) {
                toast({ variant: "destructive", title: "Share Failed", description: "Could not share the bill." });
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                toast({ title: "Link Copied", description: "Purchase bill link copied to clipboard." });
            } catch (error) {
                 toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy the link." });
            }
        }
    };


    const Controls = () => (
        <div className="flex items-center gap-2 print:hidden">
            <Button onClick={handleShare} variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
            </Button>
            <Button onClick={() => window.print()} size="sm" className="gap-2">
                <Printer className="h-4 w-4" />
                Print
            </Button>
        </div>
    )

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen p-8 flex items-center justify-center">
                 <div className="w-[210mm] min-h-[297mm] mx-auto bg-white p-8">
                    <Skeleton className="h-16 w-3/4 self-center mb-8" />
                    <div className="flex-grow mt-8">
                        <Skeleton className="h-96 w-full" />
                    </div>
                 </div>
            </div>
        )
    }

    if (!billData) {
        return (
            <div className="bg-gray-50 min-h-screen p-8 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold">Purchase Bill Not Found</h2>
                    <p className="text-muted-foreground mt-2">The bill you are looking for does not exist or has been deleted.</p>
                </div>
            </div>
        );
    }

    const { billNo, date, growerName, entries, totals } = billData;


    return (
        <div className="bg-gray-100 dark:bg-gray-900 font-sans print:bg-white">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
            <div className="w-[210mm] min-h-[297mm] mx-auto bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg print:shadow-none p-8">
                <header className="flex justify-between items-start pb-6 border-b-2 border-blue-600">
                    <div className="text-blue-600 dark:text-blue-400">
                        <Logo className="h-20 w-20" />
                        <h1 className="text-4xl font-bold mt-2">Purchase Bill</h1>
                        <p className="text-lg">From Grower/Company</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-semibold">FIRDOUS AHMAD & COMPANY</h2>
                        <p className="text-sm">Fruit Merchants & Commission Agents</p>
                        <p className="text-sm">SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.</p>
                        <p className="text-sm">Cell: 7006136330, 9797002164, 9906740921</p>
                    </div>
                </header>
                
                <section className="grid grid-cols-2 gap-8 my-6 text-sm">
                     <div>
                        <p className="text-muted-foreground mb-1">Billed To:</p>
                        <p className="font-bold text-lg">Firdous Ahmad & Company</p>
                     </div>
                     <div className="text-right space-y-1">
                        <p><span className="font-semibold">Bill No:</span> {billNo}</p>
                        <p><span className="font-semibold">Date:</span> {new Date(date).toLocaleDateString()}</p>
                        <p><span className="font-semibold">From:</span> {growerName}</p>
                     </div>
                </section>

                <main>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-blue-50 dark:bg-blue-900/50">
                                <TableHead className="w-16">S.No.</TableHead>
                                <TableHead>Variety</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Rate</TableHead>
                                <TableHead className="text-right">Total Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map((entry, index) => (
                                <TableRow key={index}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-medium">{entry.variety}</TableCell>
                                    <TableCell>{entry.type}</TableCell>
                                    <TableCell className="text-right">{entry.qty}</TableCell>
                                    <TableCell className="text-right">₹{entry.rate.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-semibold">₹{entry.total.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                            {/* Add empty rows to fill space */}
                            {Array.from({ length: Math.max(0, 12 - entries.length) }).map((_, index) => (
                                <TableRow key={`empty-${index}`} className="h-10 border-b-0">
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="bg-muted dark:bg-gray-700">
                                <TableCell colSpan={4}></TableCell>
                                <TableCell className="text-right text-base font-bold">Total Qty</TableCell>
                                <TableCell className="text-right text-base font-bold">{totals.totalQty}</TableCell>
                            </TableRow>
                             <TableRow className="bg-muted dark:bg-gray-700">
                                <TableCell colSpan={4}></TableCell>
                                <TableCell className="text-right text-xl font-bold">Grand Total</TableCell>
                                <TableCell className="text-right text-xl font-bold">₹{totals.grandTotal.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </main>

                <footer className="mt-12 pt-6 border-t-2 border-blue-600 flex justify-between items-center">
                    <Controls />
                    <div className="text-center">
                        <p className="font-semibold">Manager's Signature</p>
                        <div className="w-48 h-12 mt-2 border-b-2 border-dotted border-gray-400"></div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

