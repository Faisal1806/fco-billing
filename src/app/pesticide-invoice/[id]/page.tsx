
'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";

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
                 <div className="w-full max-w-3xl mx-auto bg-white p-8">
                    <Skeleton className="h-24 w-full mb-4" />
                    <Skeleton className="h-48 w-full" />
                 </div>
            </div>
        )
    }

    if (!billData) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                 <div className="text-center p-8 border rounded-lg shadow-md">
                    <h2 className="text-xl font-bold">Bill Not Found</h2>
                    <p className="text-muted-foreground">The bill you are looking for does not exist.</p>
                </div>
            </div>
        );
    }

    const {
        no, date, customerName, entries, grandTotal
    } = billData;

    return (
        <div className="bg-gray-100 dark:bg-gray-900 font-sans print:bg-white">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
            <div className="w-full max-w-3xl mx-auto bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg print:shadow-none p-8 my-8 print:my-0">
                <header className="bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 text-white p-6 rounded-t-xl shadow-lg">
                    <div className="flex justify-between items-center">
                        <Logo className="w-20 h-20" />
                        <div className="text-center">
                            <h1 className="text-3xl font-bold">F. Co Pesticides & Fertilizers</h1>
                            <p className="mt-1 text-sm">Deals in:- All kinds of Pesticides & Fertilizers</p>
                            <p className="text-xs">NEAR JAMIA MASJID NADIHAL, SOPORE</p>
                        </div>
                        <div className="w-20"></div>
                    </div>
                </header>
                
                <main className="bg-white dark:bg-gray-800 p-6 rounded-b-xl shadow-lg -mt-4">
                     <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4 mb-4">
                        <div>
                            <p><strong>No:</strong> {no}</p>
                            <p><strong>M/s:</strong> {customerName}</p>
                        </div>
                        <div className="text-right">
                             <p><strong>Dated:</strong> {new Date(date).toLocaleDateString('en-GB')}</p>
                        </div>
                    </div>
                    
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-100 dark:bg-gray-700">
                                <TableHead className="w-[10%]">S.NO.</TableHead>
                                <TableHead>PARTICULARS</TableHead>
                                <TableHead className="text-right">QTY</TableHead>
                                <TableHead className="text-right">RATE</TableHead>
                                <TableHead className="text-right">AMOUNT</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map((entry, index) => (
                                <TableRow key={index}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{entry.particulars}</TableCell>
                                    <TableCell className="text-right">{entry.qty}</TableCell>
                                    <TableCell className="text-right">₹{entry.rate.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-medium">₹{entry.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Separator className="my-4" />

                    <div className="flex justify-end text-sm mt-2">
                        <div className="w-full max-w-sm">
                           <div className="flex justify-between font-bold text-2xl border-t-2 pt-2">
                             <span>Grand Total:</span>
                             <span>₹{grandTotal.toFixed(2)}</span>
                           </div>
                        </div>
                    </div>
                </main>
                <footer className="flex justify-between items-end p-4 mt-8 text-xs">
                     <div>
                        <p className="italic text-gray-500">Goods once sold can not be taken back.</p>
                        <Controls />
                     </div>
                     <div className="text-center">
                        <div className="w-40 h-12 border-b border-gray-400 border-dotted"></div>
                        <p className="font-semibold">Authorized Signature</p>
                     </div>
                </footer>
            </div>
        </div>
    );
}
