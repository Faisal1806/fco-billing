
'use client'

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, FlaskConical, Download, FileText, Receipt } from "lucide-react";
import { FaWhatsapp } from 'react-icons/fa';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode.react';

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
    const [pageUrl, setPageUrl] = useState('');
    const [printStyle, setPrintStyle] = useState<'a4' | 'thermal'>('a4');
    const [invoiceStyle, setInvoiceStyle] = useState('classic');

    useEffect(() => {
        if(typeof window !== 'undefined'){
            setPageUrl(window.location.href);
             const savedStyle = localStorage.getItem('invoiceStyle');
            if (savedStyle) {
                setInvoiceStyle(savedStyle);
            }
        }
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

        const isThermal = printStyle === 'thermal';
        const format = isThermal ? [80, 297] : 'a4';
        const orientation = 'portrait';
    
        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            width: element.scrollWidth,
            height: element.scrollHeight,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
        });

        const pdf = new jsPDF({
            orientation,
            unit: 'mm',
            format,
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Pesticide-Bill-${billData.no}.pdf`);
    };

    const Controls = () => (
         <div className="flex flex-col gap-4 print:hidden">
            <div className="flex items-center gap-2">
                 <Button onClick={() => setPrintStyle('a4')} variant={printStyle === 'a4' ? 'default' : 'outline'} size="sm" className="gap-2">
                    <FileText className="h-4 w-4" /> A4
                </Button>
                <Button onClick={() => setPrintStyle('thermal')} variant={printStyle === 'thermal' ? 'default' : 'outline'} size="sm" className="gap-2">
                    <Receipt className="h-4 w-4" /> Thermal
                </Button>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handleShare} variant="outline" size="sm" className="gap-2">
                    <FaWhatsapp className="h-4 w-4 text-green-500" />
                    Share
                </Button>
                <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-2">
                    <Printer className="h-4 w-4" />
                    Print
                </Button>
                 <Button onClick={handleDownloadPdf} size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Download className="h-4 w-4" />
                    Save to Device
                </Button>
            </div>
             <div className="p-2 border rounded-md flex flex-col items-center">
                <QRCode value={pageUrl} size={60} />
                <p className="text-xs font-semibold mt-1">Scan to View</p>
            </div>
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
    
    const A4Layout = () => (
        <div className="w-[210mm] min-h-[297mm] mx-auto bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg print:shadow-none p-8 flex flex-col">
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
                <p className="italic text-gray-500">Goods once sold can not be taken back.</p>
                 <div className="text-center">
                    <p className="font-signature text-2xl text-gray-700 dark:text-gray-300">Faisal</p>
                    <p className="font-bold">Sign. Of Manager</p>
                 </div>
            </footer>
        </div>
    );
    
    const ThermalLayout = () => (
         <div className="w-[80mm] bg-white text-black p-2 font-mono text-[10px] leading-tight">
            <header className="text-center space-y-1">
                <h1 className="text-sm font-bold">F.Co Pesticides</h1>
                <p>Nadihal, Sopore</p>
                <p className="border-t border-dashed border-black mt-1 pt-1 font-bold">Pesticide/Fertilizer Bill</p>
            </header>
            <main className="my-2 border-t border-b border-dashed border-black py-2 space-y-1">
                <div className="flex justify-between"><span>Bill No: {no}</span> <span>Date: {new Date(date).toLocaleDateString('en-GB')}</span></div>
                <div>To: {customerName}</div>
            </main>
            <table className="w-full">
                <thead>
                    <tr className="border-b border-dashed border-black">
                        <th className="text-left">Item</th>
                        <th className="text-right">Rate</th>
                        <th className="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry, i) => (
                        <tr key={i}>
                            <td className="text-left">{entry.particulars} ({entry.qty})</td>
                            <td className="text-right">{entry.rate.toFixed(2)}</td>
                            <td className="text-right">{(entry.amount).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
             <div className="my-2 border-t-2 border-black pt-1 space-y-1 text-sm font-bold">
                <div className="flex justify-between"><span>GRAND TOTAL:</span><span>₹{grandTotal.toFixed(2)}</span></div>
            </div>
            <footer className="text-center pt-2 border-t border-dashed border-black">
                <p>Thank you!</p>
                <p className="text-[8px]">Goods once sold cannot be returned.</p>
                <div className="flex justify-center pt-2">
                    <QRCode value={pageUrl} size={80} />
                </div>
            </footer>
        </div>
    );

    const renderContent = () => {
        // Here you can add logic for Modern, Urdu etc.
        // For now, it defaults to the classic A4 layout.
        switch(invoiceStyle) {
            // case 'modern': return <ModernLayout />;
            // case 'urdu': return <UrduLayout />;
            default: return <A4Layout />;
        }
    }


    return (
         <div className="bg-gray-100 dark:bg-gray-900 font-sans print:bg-white flex flex-col md:flex-row gap-8 justify-center p-4 md:p-8">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
                .font-signature {
                    font-family: 'Dancing Script', cursive;
                }
                @media print {
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .print-container {
                        margin: 0;
                        padding: 0;
                        display: block !important;
                        width: 100%;
                        height: 100%;
                    }
                    .print-area-a4 {
                        display: ${printStyle === 'a4' ? 'flex !important' : 'none !important'};
                        width: 100%;
                        height: 100%;
                        box-shadow: none;
                        border: none;
                    }
                     .print-area-thermal {
                        display: ${printStyle === 'thermal' ? 'block !important' : 'none !important'};
                         box-shadow: none;
                        border: none;
                    }

                    @page {
                        size: ${printStyle === 'a4' ? 'A4 portrait' : '80mm 297mm'};
                        margin: 0;
                    }
                }
            `}</style>
            
            <Controls />

            <div className="print-container">
                <div ref={printRef}>
                    <div className="print-area-a4">
                        {renderContent()}
                    </div>
                     <div className="print-area-thermal">
                        <ThermalLayout />
                    </div>
                </div>
            </div>
        </div>
    );
}
