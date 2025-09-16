
'use client'

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Download, QrCode, FileText, Receipt } from "lucide-react";
import { FaWhatsapp } from 'react-icons/fa';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import BusinessCardQR from "@/components/BusinessCardQR";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode.react';

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
    const [pageUrl, setPageUrl] = useState('');
    const [printStyle, setPrintStyle] = useState<'a4' | 'thermal'>('a4');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPageUrl(window.location.href);
        }
    }, []);

    useEffect(() => {
        const fetchBill = async () => {
            if (!params.id) {
                setLoading(false);
                return;
            };
            setLoading(true);

            let data: BillData | null = null;
            const localData = localStorage.getItem(`invoice-${params.id}`);
            if (localData) {
                data = JSON.parse(localData);
            }

            if (data) {
                data.entries = data.entries.map(e => ({
                    ...e, 
                    qty: e.qty || e.peti || e.daba || 0
                }));
                setBillData(data);
            } else {
                toast({
                    variant: "destructive",
                    title: "Invoice Not Found",
                    description: "The requested invoice was not found on this device."
                });
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

        // Use the selected print style to determine PDF size
        const isThermal = printStyle === 'thermal';
        const format = isThermal ? [80, 297] : 'a4'; // 80mm width for thermal
        const orientation = 'portrait';

        const canvas = await html2canvas(element, {
            scale: 2,
            width: isThermal ? 302 : undefined, // 80mm at 96dpi is ~302px
            windowWidth: isThermal ? 302 : window.innerWidth,
        });

        const pdf = new jsPDF({
            orientation,
            unit: 'mm',
            format,
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Invoice-${billData.sNo}.pdf`);
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
                <Button onClick={handleDownloadPdf} size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    PDF
                </Button>
             </div>
             <div className="p-2 border rounded-md flex flex-col items-center">
                <QRCode value={pageUrl} size={60} />
                <p className="text-xs font-semibold mt-1">Scan to View Bill</p>
            </div>
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
    
    const A4Layout = () => (
         <div className="w-[148mm] min-h-[210mm] mx-auto bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg print:shadow-none p-4 flex flex-col text-xs">
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
                 <BusinessCardQR size={60} />
                 <div className="text-right text-[10px]">
                    <p className="font-signature text-2xl text-gray-700 dark:text-gray-300">Faisal</p>
                    <p className="font-bold">Sign. Of Manager</p>
                    <p>For Firdous Ahmad & Company</p>
                 </div>
            </footer>
        </div>
    );
    
    const ThermalLayout = () => (
        <div className="w-[80mm] bg-white text-black p-2 font-mono text-[10px] leading-tight">
            <header className="text-center space-y-1">
                <h1 className="text-sm font-bold">Firdous Ahmad & Company</h1>
                <p>Fruit Merchants & Commission Agents</p>
                <p>Sopore, Kashmir</p>
                <p>Ph: 7006136330</p>
                <p className="border-t border-dashed border-black mt-1 pt-1">Sale Invoice</p>
            </header>
            <main className="my-2 border-t border-b border-dashed border-black py-2 space-y-1">
                <div className="flex justify-between"><span>Bill No: {sNo}</span> <span>Date: {new Date(date).toLocaleDateString('en-GB')}</span></div>
                <div className="flex justify-between"><span>Watak: {watakNo}</span></div>
                <div>Customer: {customerName}</div>
            </main>
            <table className="w-full">
                <thead>
                    <tr className="border-b border-dashed border-black">
                        <th className="text-left">Item</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Rate</th>
                        <th className="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry, i) => (
                        <tr key={i}>
                            <td className="text-left">{entry.variety} ({entry.type})</td>
                            <td className="text-right">{entry.qty}</td>
                            <td className="text-right">{entry.rate.toFixed(2)}</td>
                            <td className="text-right">{(entry.qty * entry.rate).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="my-2 border-t border-dashed border-black pt-2 space-y-1">
                <div className="flex justify-between"><span>Gross Sale:</span><span>{totals.grossSale.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Freight:</span><span>{freight.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Labour:</span><span>{totals.labour.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Commission:</span><span>{totals.commissionAmount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Other Exp:</span><span>{(totals.association + totals.security).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Total Exp:</span><span>{totals.totalExpenses.toFixed(2)}</span></div>
            </div>
             <div className="my-2 border-t-2 border-black pt-1 space-y-1 text-sm font-bold">
                <div className="flex justify-between"><span>NET SALE:</span><span>₹{totals.netSale.toFixed(2)}</span></div>
            </div>
            <footer className="text-center pt-2 border-t border-dashed border-black">
                <p>Thank you for your business!</p>
                <div className="flex justify-center pt-2">
                    <QRCode value={pageUrl} size={80} />
                </div>
            </footer>
        </div>
    );


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
                        size: ${printStyle === 'a4' ? 'A5 portrait' : '80mm 297mm'};
                        margin: 0;
                    }
                }
            `}</style>
            
            <Controls />

            <div className="print-container">
                <div ref={printRef}>
                    <div className="print-area-a4">
                        <A4Layout />
                    </div>
                     <div className="print-area-thermal">
                        <ThermalLayout />
                    </div>
                </div>
            </div>
        </div>
    );
}

