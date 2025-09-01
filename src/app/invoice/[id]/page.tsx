
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
    id: string;
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
                const storedBill = localStorage.getItem(`invoice-${params.id}`);
                let data: BillData | null = null;
                if (storedBill) {
                    data = JSON.parse(storedBill);
                }

                if(data) {
                     data.entries = data.entries.map(e => ({...e, qty: e.qty || e.peti || e.dabba || 0}))
                    setBillData(data);
                } else {
                     toast({
                        variant: "destructive",
                        title: "Not Found",
                        description: "The requested bill was not found."
                    })
                }

            } catch (error) {
                 console.error("Error fetching bill:", error);
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not fetch the bill data."
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
                    <h2 className="text-xl font-semibold">Invoice Not Found</h2>
                    <p className="text-muted-foreground mt-2">The invoice you are looking for does not exist or has been deleted.</p>
                </div>
            </div>
        );
    }

    const {
        sNo, date, customerName, challanNo, khata, entries, totals, freight
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
            <div className="w-[210mm] min-h-[297mm] mx-auto bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg print:shadow-none p-8">
                <header className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 text-white p-6 rounded-t-xl shadow-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold">(F.Co) FIRDOUS AHMAD & COMPANY</h1>
                            <p className="mt-1">Fruit Merchants & Commission Agents</p>
                            <p className="text-xs">Shed No. 13, Fud No. 12A - Fruit Mandi Sopore, Kashmir</p>
                        </div>
                        <Logo className="w-20 h-20" />
                    </div>
                </header>

                <main className="bg-white dark:bg-gray-800 p-6 rounded-b-xl shadow-lg -mt-4">
                    <div className="grid grid-cols-2 gap-4 border-b pb-4 mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Bill To: / <span className="font-urdu">بل بنام</span></h2>
                            <p className="font-bold text-xl">{customerName}</p>
                            <p>Khata No: {khata}</p>
                        </div>
                        <div className="text-right">
                             <p><strong>Bill No:</strong> {sNo}</p>
                             <p><strong>Date:</strong> {new Date(date).toLocaleDateString()}</p>
                             <p><strong>Challan No:</strong> {challanNo}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4">
                        <div className="col-span-3">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-100 dark:bg-gray-700">
                                        <TableHead>Type / <span className="font-urdu">قسم</span></TableHead>
                                        <TableHead>Variety / <span className="font-urdu">ورائٹی</span></TableHead>
                                        <TableHead>Qty / <span className="font-urdu">مقدار</span></TableHead>
                                        <TableHead>Rate / <span className="font-urdu">ریٹ</span></TableHead>
                                        <TableHead className="text-right">Gross / <span className="font-urdu">مجموعی</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entries.map((entry, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{entry.type}</TableCell>
                                            <TableCell>{entry.variety}</TableCell>
                                            <TableCell>{entry.qty}</TableCell>
                                            <TableCell>₹{entry.rate.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-medium">₹{((entry.qty) * entry.rate).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="col-span-2">
                             <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-100 dark:bg-gray-700">
                                        <TableHead>Expenses / <span className="font-urdu">اخراجات</span></TableHead>
                                        <TableHead className="text-right">Amount / <span className="font-urdu">رقم</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow><TableCell>Freight / <span className="font-urdu">فریٹ</span></TableCell><TableCell className="text-right">₹{freight.toFixed(2)}</TableCell></TableRow>
                                    <TableRow><TableCell>Labour / <span className="font-urdu">مزدوری</span></TableCell><TableCell className="text-right">₹{totals.labour.toFixed(2)}</TableCell></TableRow>
                                    <TableRow><TableCell>Association / <span className="font-urdu">انجمن</span></TableCell><TableCell className="text-right">₹{totals.association.toFixed(2)}</TableCell></TableRow>
                                    <TableRow><TableCell>Security / <span className="font-urdu">سیکیورٹی</span></TableCell><TableCell className="text-right">₹{totals.security.toFixed(2)}</TableCell></TableRow>
                                    <TableRow className="font-semibold border-t-2"><TableCell>Commission / <span className="font-urdu">کمیشن</span></TableCell><TableCell className="text-right">₹{totals.commissionAmount.toFixed(2)}</TableCell></TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                             <p><strong>Total Quantity / <span className="font-urdu">کل مقدار</span>:</strong> {totals.totalQty} (Patti: {totals.pattiQty}, Dabba: {totals.dabbaQty})</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-semibold">Gross Sale / <span className="font-urdu">مجموعی فروخت</span>:</span>
                                <span>₹{totals.grossSale.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between items-center text-lg">
                                <span className="font-semibold">Total Expenses / <span className="font-urdu">کل اخراجات</span>:</span>
                                <span>- ₹{totals.totalExpenses.toFixed(2)}</span>
                            </div>
                            <Separator />
                             <div className="flex justify-between items-center text-2xl font-bold text-green-600">
                                <span >Net Sale / <span className="font-urdu">خالص فروخت</span>:</span>
                                <span>₹{totals.netSale.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="flex justify-between items-center mt-8 pt-4 border-t">
                     <Controls />
                     <div className="text-right text-xs">
                        <p className="font-bold">Manager</p>
                        <p>For Firdous Ahmad & Company</p>
                     </div>
                </footer>
            </div>
        </div>
    );
}

    