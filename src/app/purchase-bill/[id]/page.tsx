
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
                 <div className="w-[105mm] min-h-[148mm] mx-auto bg-white p-4 border">
                    <Skeleton className="h-16 w-full mb-4" />
                    <div className="flex-grow mt-4">
                        <Skeleton className="h-48 w-full" />
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
        <div className="bg-gray-200 dark:bg-gray-900 font-sans print:bg-white flex justify-center py-8">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A5 portrait;
                        margin: 0;
                    }
                    body {
                        background-color: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
            <div className="w-[148mm] min-h-[210mm] bg-[#FDFEE2] text-black shadow-lg print:shadow-none p-4 border-2 border-green-700 flex flex-col">
                {/* Header */}
                <header className="text-center border-b-2 border-green-700 pb-2">
                    <div className="text-xs">
                        Trade Mark: FCO <span className="mx-2">|</span> Cell: 9797002164, 7006136330
                    </div>
                    <h1 className="text-2xl font-bold text-green-800">FIRDOUS AHMAD & COMPANY</h1>
                    <p className="text-xs font-semibold">Fruit Merchants & Commission Agents</p>
                    <p className="text-xs">Shed No. 13, Fud No. 12-A, Fruit Mandi Sopore, Kashmir</p>
                    <p className="text-xs font-bold">Prop: Firdous Ahmad</p>
                </header>
                
                {/* Bill Info */}
                <section className="flex justify-between items-end my-2 text-sm">
                    <div className="flex-1">
                        <p><strong>No:</strong> {billNo}</p>
                        <p><strong>M/s:</strong> {growerName}</p>
                    </div>
                    <div className="text-right">
                        <p><strong>Dated:</strong> {new Date(date).toLocaleDateString('en-GB')}</p>
                    </div>
                </section>

                {/* Table */}
                <main className="flex-grow relative">
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                       <Logo className="w-48 h-48 opacity-10" />
                    </div>
                    <div className="relative z-10">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-y-2 border-green-700">
                                    <th className="p-1 border-x border-green-600 w-[15%]">Petti</th>
                                    <th className="p-1 border-x border-green-600 w-[15%]">Dabba</th>
                                    <th className="p-1 border-x border-green-600">VARIETY</th>
                                    <th className="p-1 border-x border-green-600 w-[20%]">RATE</th>
                                    <th className="p-1 border-x border-green-600 w-[25%]">AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry, index) => (
                                    <tr key={index} className="border-b border-green-600/50 h-8">
                                        <td className="p-1 border-x border-green-600 text-center">{entry.type === 'Patti' ? entry.qty : ''}</td>
                                        <td className="p-1 border-x border-green-600 text-center">{entry.type === 'Dabba' ? entry.qty : ''}</td>
                                        <td className="p-1 border-x border-green-600">{entry.variety}</td>
                                        <td className="p-1 border-x border-green-600 text-right">₹{entry.rate.toFixed(2)}</td>
                                        <td className="p-1 border-x border-green-600 text-right font-semibold">₹{entry.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {Array.from({ length: Math.max(0, 15 - entries.length) }).map((_, index) => (
                                     <tr key={`empty-${index}`} className="border-b border-green-600/50 h-8">
                                        <td className="p-1 border-x border-green-600"></td>
                                        <td className="p-1 border-x border-green-600"></td>
                                        <td className="p-1 border-x border-green-600"></td>
                                        <td className="p-1 border-x border-green-600"></td>
                                        <td className="p-1 border-x border-green-600"></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-auto pt-2 text-sm">
                    <div className="flex justify-end">
                       <div className="w-2/5 p-1 border-2 border-green-700">
                          <div className="flex justify-between font-bold">
                            <span>G. Total</span>
                            <span>₹{totals.grandTotal.toFixed(2)}</span>
                          </div>
                       </div>
                    </div>
                    <div className="text-center text-xs mt-2">
                        <p>Your Satisfaction is our Success</p>
                        <p className="italic">If the bill is not paid within 15 days interest @ 5% will be Charged extra</p>
                    </div>
                    <div className="flex justify-between mt-4">
                        <Controls />
                        <div className="text-center">
                            <p className="border-t border-dotted border-black w-32 mt-8"></p>
                            <p className="font-semibold">Signature</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
