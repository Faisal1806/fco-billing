
'use client'

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Download } from "lucide-react";
import { FaWhatsapp } from 'react-icons/fa';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import BusinessCardQR from "@/components/BusinessCardQR";
import { getClientDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface BillData {
    id: string;
    sNo: string;
    date: string;
    customerName: string;
    watakNo: string;
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
    const printRef = useRef<HTMLDivElement>(null);
    const userId = 'default-user'; // As per the new structure

    useEffect(() => {
        const fetchBill = async () => {
            if (!params.id) {
                setLoading(false);
                return;
            };
            setLoading(true);

            let data: BillData | null = null;
            
            try {
                const db = getClientDb();
                const docRef = doc(db, `users/${userId}/invoices`, params.id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    data = docSnap.data() as BillData;
                } else {
                    toast({
                        variant: "destructive",
                        title: "Invoice Not Found",
                        description: "The requested invoice was not found in the cloud."
                    });
                }
            } catch (error) {
                console.error("Firestore fetch failed:", error);
                 toast({
                    variant: "destructive",
                    title: "Cloud Error",
                    description: "Could not connect to the cloud to fetch the invoice."
                });
            }
            
            if (data) {
                data.entries = data.entries.map(e => ({
                    ...e, 
                    qty: e.qty || e.peti || e.daba || 0
                }));
                setBillData(data);
            }
            
            setLoading(false);
        };
        fetchBill();
    }, [params.id, toast]);


    const handleShare = () => {
        if (billData) {
            const message = `Check out this Invoice (#${billData.sNo}) for ${billData.customerName}: ${window.location.href}`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        } else {
            toast({ variant: "destructive", title: "Share Failed", description: "Could not share the invoice." });
        }
    };
    
    const handleDownloadPdf = async () => {
        const element = printRef.current;
        if (!element || !billData) return;

        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
        });

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a5'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Invoice-${billData.sNo}.pdf`);
    };


    const Controls = () => (
        <div className="flex items-center gap-2 print:hidden">
            <Button onClick={handleShare} variant="outline" size="sm" className="gap-2">
                <FaWhatsapp className="h-4 w-4 text-green-500" />
                Share
            </Button>
            <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-2">
                <Printer className="h-4 w-4" />
                Print
            </Button>
             <Button onClick={handleDownloadPdf} size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
            </Button>
        </div>
    )

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen p-8 flex items-center justify-center">
                 <div className="w-[148mm] min-h-[210mm] mx-auto bg-white p-8">
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
                <div className="text-center p-8 border rounded-lg shadow-lg bg-white">
                    <h2 className="text-2xl font-bold text-destructive">Invoice Not Found</h2>
                    <p className="text-muted-foreground mt-2">The invoice you are looking for does not exist or has been deleted.</p>
                </div>
            </div>
        );
    }

    const {
        sNo, date, customerName, watakNo, khata, entries, totals, freight
    } = billData;


    return (
        <div className="bg-gray-100 dark:bg-gray-900 font-sans print:bg-white">
             <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
                .font-signature {
                    font-family: 'Dancing Script', cursive;
                }
                @media print {
                    @page {
                        size: A5 portrait;
                        margin: 0;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
            <div ref={printRef} className="w-[148mm] min-h-[210mm] mx-auto bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg print:shadow-none p-4 flex flex-col text-xs">
                 <header className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 text-white p-4 rounded-t-xl shadow-lg">
                    <div className="flex justify-between items-center">
                        <div className="text-left text-sm font-bold">
                           🍎 F.Co
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold">FIRDOUS AHMAD & COMPANY</h2>
                            <p className="mt-1 text-[10px]">Fruit Merchants & Commission Agents</p>
                            <p className="text-[8px]">SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.</p>
                            <p className="text-[8px]">Prop: Firdous Ahmad Lone (Nadihal) | Cell: 7006136330, 9797002164, 9906740921 | Email: lone07936@gmail.com</p>
                        </div>
                        <div className="text-right text-sm font-bold">
                           🍎 F.Co
                        </div>
                    </div>
                </header>

                <main className="bg-white dark:bg-gray-800 p-4 rounded-b-xl shadow-lg -mt-4 flex-grow relative">
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                        <Logo className="w-64 h-64 opacity-5" />
                    </div>
                    <div className="relative z-10">
                        <div className="grid grid-cols-2 gap-4 border-b pb-2 mb-2">
                            <div>
                                <h2 className="font-semibold text-gray-700 dark:text-gray-300">Bill To: / <span className="font-urdu">بل بنام</span></h2>
                                <p className="font-bold text-base">{customerName}</p>
                                <p>Khata: {khata}</p>
                            </div>
                            <div className="text-right">
                                 <p><strong>Bill No:</strong> {sNo}</p>
                                 <p><strong>Date:</strong> {new Date(date).toLocaleDateString('en-GB')}</p>
                                 <p><strong>Watak No:</strong> {watakNo}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                            <div className="col-span-3">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-100 dark:bg-gray-700">
                                            <TableHead>Type</TableHead>
                                            <TableHead>Variety</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead>Rate</TableHead>
                                            <TableHead className="text-right">Gross</TableHead>
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
                                            <TableHead>Expenses</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow><TableCell>Freight</TableCell><TableCell className="text-right">₹{freight.toFixed(2)}</TableCell></TableRow>
                                        <TableRow><TableCell>Labour</TableCell><TableCell className="text-right">₹{totals.labour.toFixed(2)}</TableCell></TableRow>
                                        <TableRow><TableCell>Association</TableCell><TableCell className="text-right">₹{totals.association.toFixed(2)}</TableCell></TableRow>
                                        <TableRow><TableCell>Security</TableCell><TableCell className="text-right">₹{totals.security.toFixed(2)}</TableCell></TableRow>
                                        <TableRow className="font-semibold border-t-2"><TableCell>Commission</TableCell><TableCell className="text-right">₹{totals.commissionAmount.toFixed(2)}</TableCell></TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                 <p><strong>Total Quantity:</strong> {totals.totalQty} (Patti: {totals.pattiQty}, Dabba: {totals.dabbaQty})</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Gross Sale:</span>
                                    <span>₹{totals.grossSale.toFixed(2)}</span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                    <span className="font-semibold">Total Expenses:</span>
                                    <span>- ₹{totals.totalExpenses.toFixed(2)}</span>
                                </div>
                                <Separator />
                                 <div className="flex justify-between items-center text-lg font-bold text-green-600">
                                    <span >Net Sale:</span>
                                    <span>₹{totals.netSale.toFixed(2)}</span>
                                 </div>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="flex justify-between items-end mt-auto pt-2 border-t print:pt-1">
                     <Controls />
                     <BusinessCardQR size={60} />
                     <div className="text-right text-[10px]">
                        <p className="font-signature text-2xl text-gray-700 dark:text-gray-300">Faisal</p>
                        <p className="font-bold">Sign. Of Manager</p>
                        <p>For Firdous Ahmad & Company</p>
                     </div>
                </footer>
            </div>
        </div>
    );
}
