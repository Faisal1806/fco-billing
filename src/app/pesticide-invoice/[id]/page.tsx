
'use client'

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, FlaskConical, Download } from "lucide-react";
import { FaWhatsapp } from 'react-icons/fa';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedBill = localStorage.getItem(`pesticide-invoice-${params.id}`);
        if (storedBill) {
            setBillData(JSON.parse(storedBill));
        }
        setLoading(false);
    }, [params.id]);

    const handleShare = () => {
        if (billData) {
            const message = `Check out this Pesticide Bill (#${billData.no}) for ${billData.customerName}: ${window.location.href}`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        } else {
            toast({ variant: "destructive", title: "Share Failed", description: "Could not share the bill." });
        }
    };

    const handleDownloadPdf = async () => {
        const element = printRef.current;
        if (!element || !billData) return;

        const canvas = await html2canvas(element, {
            scale: 2,
        });

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Pesticide-Bill-${billData.no}.pdf`);
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
                 <div className="w-[210mm] min-h-[297mm] mx-auto bg-white p-8">
                    <Skeleton className="h-24 w-full mb-4" />
                    <Skeleton className="h-48 w-full" />
                 </div>
            </div>
        )
    }

    if (!billData) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                 <div className="text-center p-8 border rounded-lg shadow-md bg-white">
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
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
                .font-signature {
                    font-family: 'Dancing Script', cursive;
                }
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
            <div ref={printRef} className="w-[210mm] min-h-[297mm] mx-auto bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg print:shadow-none p-8 flex flex-col">
                <header className="bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 text-white p-6 rounded-t-xl shadow-lg">
                    <div className="flex justify-between items-center">
                        <div className="text-sm font-bold flex items-center gap-1"><FlaskConical className="h-4 w-4" /> F.Co</div>
                        <div className="text-center">
                            <h1 className="text-3xl font-bold">F. Co Pesticides & Fertilizers</h1>
                            <p className="mt-1 text-sm">Deals in:- All kinds of Pesticides & Fertilizers</p>
                            <p className="text-xs">NEAR JAMIA MASJID NADIHAL, SOPORE</p>
                        </div>
                        <div className="text-sm font-bold flex items-center gap-1"><FlaskConical className="h-4 w-4" /> F.Co</div>
                    </div>
                </header>
                
                <main className="bg-white dark:bg-gray-800 p-6 rounded-b-xl shadow-lg -mt-4 flex-grow">
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
                                <TableRow key={index} className="h-10">
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{entry.particulars}</TableCell>
                                    <TableCell className="text-right">{entry.qty}</TableCell>
                                    <TableCell className="text-right">₹{entry.rate.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-medium">₹{entry.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="flex justify-end mt-6">
                        <div className="w-full max-w-sm space-y-2">
                           <Separator />
                           <div className="flex justify-between font-bold text-2xl pt-2">
                             <span>Grand Total:</span>
                             <span>₹{grandTotal.toFixed(2)}</span>
                           </div>
                           <Separator />
                        </div>
                    </div>
                </main>
                <footer className="flex justify-between items-end p-4 mt-auto print:pt-2 text-xs">
                    <div className="flex flex-col gap-2">
                         <Controls />
                         <p className="italic text-gray-500">Goods once sold can not be taken back.</p>
                    </div>
                     <div className="text-center">
                        <p className="font-signature text-2xl text-gray-700 dark:text-gray-300">Faisal</p>
                        <p className="font-bold">Sign. Of Manager</p>
                     </div>
                </footer>
            </div>
        </div>
    );
}

