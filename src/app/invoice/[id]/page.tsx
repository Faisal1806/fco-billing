
'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface BillData {
    sNo: string;
    date: string;
    customerName: string;
    challanNo: string;
    khata: string;
    entries: {
        peti: number;
        dabba: number;
        variety: string;
        rate: number;
        type: 'Patti' | 'Dabba';
        qty: number;
        total: number;
    }[];
    totals: {
      pattiQty: number;
      dabbaQty: number;
      totalQty: number;
      grossSale: number;
      commissionAmount: number;
      labour: number;
      association: number;
      security: number;
      totalExpenses: number;
      netSale: number;
    }
    freight: number;
}


export default function InvoicePage({ params }: { params: { id: string } }) {
    const [billData, setBillData] = useState<BillData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchBill = async () => {
            if (!params.id) return;
            setLoading(true);
            try {
                // Try fetching from Firestore first
                const docRef = doc(db, "wataks", params.id);
                const docSnap = await getDoc(docRef);
                
                let data: BillData | null = null;
                if (docSnap.exists()) {
                    data = docSnap.data() as BillData;
                } else {
                    // Fallback to localStorage if offline or not found
                    const storedBill = localStorage.getItem(`invoice-${params.id}`);
                    if (storedBill) {
                        data = JSON.parse(storedBill);
                    }
                }

                if(data) {
                    // This is to fix old records that may not have qty
                     data.entries = data.entries.map(e => ({...e, qty: e.qty || e.peti || e.dabba || 0}))
                    setBillData(data);
                    // Also cache it in localStorage
                    localStorage.setItem(`invoice-${params.id}`, JSON.stringify(data));
                } else {
                     toast({
                        variant: "destructive",
                        title: "Not Found",
                        description: "The requested bill was not found."
                    })
                }

            } catch (error) {
                 console.error("Error fetching bill:", error);
                 const storedBill = localStorage.getItem(`invoice-${params.id}`);
                  if (storedBill) {
                        setBillData(JSON.parse(storedBill));
                  } else {
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Could not fetch the bill data."
                    })
                  }
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
                    title: `Invoice for ${billData.customerName}`,
                    text: `Here is the invoice #${billData.sNo} for ${billData.customerName}.`,
                    url: window.location.href,
                });
                toast({ title: "Invoice Shared", description: "The invoice link has been shared." });
            } catch (error) {
                toast({ variant: "destructive", title: "Share Failed", description: "Could not share the invoice." });
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                toast({ title: "Link Copied", description: "Invoice link copied to clipboard." });
            } catch (error) {
                 toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy the link." });
            }
        }
    };


    const Controls = () => {
        'use client'
        return (
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
    }

    if (loading) {
        return (
            <div className="bg-muted min-h-screen p-8 flex items-center justify-center">
                 <Card className="w-[148mm] h-[210mm] mx-auto p-6 flex flex-col">
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <Skeleton className="h-full w-full" />
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
                        <CardTitle>Invoice Not Found</CardTitle>
                        <CardDescription>The invoice you are looking for does not exist or has been deleted.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const {
        sNo, date, customerName, challanNo, khata, entries, totals, freight
    } = billData;


    return (
        <div className="bg-muted min-h-screen py-8 print:bg-white print:py-0">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A5;
                        margin: 0;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
            <div className="w-[148mm] min-h-[200mm] mx-auto bg-white shadow-lg print:shadow-none flex flex-col text-sm">
                <header className="p-6 border-b">
                    <div className="text-center mb-4">
                        <h1 className="text-xl font-bold text-gray-800">FIRDOUS AHMAD & COMPANY</h1>
                        <p className="text-xs text-gray-600">Fruit Merchants & Commission Agents</p>
                        <p className="text-xs text-gray-600">SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.</p>
                        <p className="text-xs text-gray-600">Cell: 7006136330, 9797002164</p>
                    </div>
                     <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <p><strong>Bill No:</strong> {sNo}</p>
                            <p><strong>M/s:</strong> {customerName}</p>
                            <p><strong>Khata No:</strong> {khata}</p>
                        </div>
                        <div className="text-right">
                             <p><strong>Date:</strong> {new Date(date).toLocaleDateString()}</p>
                             <p><strong>Challan No:</strong> {challanNo}</p>
                        </div>
                    </div>
                </header>
                <main className="flex-grow p-4">
                    <div className="grid grid-cols-[60%_40%] gap-4">
                        <div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="h-8">Type</TableHead>
                                        <TableHead className="h-8">Variety</TableHead>
                                        <TableHead className="h-8">Qty</TableHead>
                                        <TableHead className="h-8">Rate</TableHead>
                                        <TableHead className="h-8 text-right">Gross Sale</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entries.map((entry, index) => (
                                        <TableRow key={index} className="h-8">
                                            <TableCell className="py-1">{entry.type}</TableCell>
                                            <TableCell className="py-1">{entry.variety}</TableCell>
                                            <TableCell className="py-1">{entry.qty}</TableCell>
                                            <TableCell className="py-1">{entry.rate.toFixed(2)}</TableCell>
                                            <TableCell className="py-1 text-right">₹{((entry.qty) * entry.rate).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {Array.from({ length: Math.max(0, 10 - entries.length) }).map((_, index) => (
                                        <TableRow key={`empty-${index}`} className="h-8"><TableCell colSpan={5}>&nbsp;</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="h-8">Details of Exp.</TableHead>
                                        <TableHead className="h-8 text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow className="h-8"><TableCell className="py-1">Freight</TableCell><TableCell className="py-1 text-right">₹{freight.toFixed(2)}</TableCell></TableRow>
                                    <TableRow className="h-8"><TableCell className="py-1">Labour</TableCell><TableCell className="py-1 text-right">₹{totals.labour.toFixed(2)}</TableCell></TableRow>
                                    <TableRow className="h-8"><TableCell className="py-1">Association</TableCell><TableCell className="py-1 text-right">₹{totals.association.toFixed(2)}</TableCell></TableRow>
                                    <TableRow className="h-8"><TableCell className="py-1">Security</TableCell><TableCell className="py-1 text-right">₹{totals.security.toFixed(2)}</TableCell></TableRow>
                                    <TableRow className="h-8"><TableCell className="py-1">Commission</TableCell><TableCell className="py-1 text-right">₹{totals.commissionAmount.toFixed(2)}</TableCell></TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="grid grid-cols-3 gap-4 text-xs font-medium">
                        <div className="flex items-center">
                            <p>Qty: {totals.totalQty} (Patti: {totals.pattiQty}, Dabba: {totals.dabbaQty})</p>
                        </div>
                        <div className="flex justify-between items-center px-2 py-1 bg-gray-100 rounded-sm">
                           <p>Gross Sale:</p>
                           <p>₹{totals.grossSale.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center px-2 py-1 bg-gray-100 rounded-sm">
                           <p>Total Exp.:</p>
                           <p>₹{totals.totalExpenses.toFixed(2)}</p>
                        </div>
                    </div>
                     <div className="grid grid-cols-3 gap-4 mt-2">
                        <div>
                            <p className="font-semibold text-xs">Debit Our A/C</p>
                            <p className="text-[10px] text-gray-500">"Your Satisfaction is Our Success"</p>
                        </div>
                        <div className="col-span-2 flex justify-between items-center px-3 py-1 bg-gray-200 rounded-sm">
                            <p className="font-bold">Net Sale:</p>
                            <p className="font-bold">₹{totals.netSale.toFixed(2)}</p>
                        </div>
                     </div>
                </main>
                <footer className="flex justify-between items-center p-4 border-t mt-auto">
                     <div className="text-[10px] text-gray-500 space-y-2">
                        <p>Subject to Sopore Jurisdiction Only</p>
                        <Controls />
                     </div>
                     <p className="font-semibold text-xs">Manager</p>
                </footer>
            </div>
        </div>
    );
}

    