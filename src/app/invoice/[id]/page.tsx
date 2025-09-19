
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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
        daba: number;
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
    const [invoiceStyle, setInvoiceStyle] = useState('classic');


    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPageUrl(window.location.href);
            const savedStyle = localStorage.getItem('invoiceStyle');
            if (savedStyle) {
                setInvoiceStyle(savedStyle);
            }
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
    
    const handleDownloadPdf = () => {
        if (!billData) return;
    
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a5'
        });
    
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
    
        // Draw border
        doc.setDrawColor('#16a34a'); // green-700
        doc.setLineWidth(1);
        doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
    
        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('🍎 F.Co', margin, margin);
        doc.text('🍎 F.Co', pageWidth - margin, margin, { align: 'right' });
    
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('Prop: Firdous Ahmad Lone (Nadihal)', pageWidth / 2, margin - 2, { align: 'center' });
        doc.text('Cell: 7006136330, 9797002164, 9906740921', pageWidth / 2, margin + 1, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#15803d'); // green-800
        doc.text('FIRDOUS AHMAD & COMPANY', pageWidth / 2, margin + 6, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text('Fruit Merchants & Commission Agents', pageWidth / 2, margin + 10, { align: 'center' });
        doc.setFontSize(6);
        doc.text('SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.', pageWidth / 2, margin + 13, { align: 'center' });
    
        doc.setLineWidth(0.5);
        doc.setDrawColor('#16a34a');
        doc.line(margin, margin + 15, pageWidth - margin, margin + 15);
    
        // Bill Info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`M/s: ${billData.customerName}`, margin, margin + 22);
        if (billData.khata) {
            doc.text(`Khata: ${billData.khata}`, margin, margin + 27);
        }
    
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Bill No: ${billData.sNo}`, pageWidth - margin, margin + 22, { align: 'right' });
        doc.text(`Date: ${new Date(billData.date).toLocaleDateString('en-GB')}`, pageWidth - margin, margin + 26, { align: 'right' });
        if(billData.watakNo) {
            doc.text(`Watak No: ${billData.watakNo}`, pageWidth - margin, margin + 30, { align: 'right' });
        }
    
        // Table
        const tableData = billData.entries.map(e => [
            e.type,
            e.variety,
            e.qty.toString(),
            `₹${e.rate.toFixed(2)}`,
            `₹${(e.qty * e.rate).toFixed(2)}`
        ]);
    
        autoTable(doc, {
            head: [['TYPE', 'VARIETY', 'QTY', 'RATE', 'GROSS']],
            body: tableData,
            startY: margin + 35,
            theme: 'grid',
            headStyles: {
                fillColor: '#16a34a',
                textColor: '#ffffff',
                fontStyle: 'bold',
                halign: 'center'
            },
            styles: {
                fontSize: 8,
                cellPadding: 1.5,
                font: 'helvetica'
            },
            columnStyles: {
                2: { halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'right', fontStyle: 'bold' },
            }
        });
    
        const finalY = (doc as any).lastAutoTable.finalY;
    
        // Totals
        const summaryX = pageWidth / 2;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Total Quantity: ${billData.totals.totalQty} (Patti: ${billData.totals.pattiQty}, Dabba: ${billData.totals.dabbaQty})`, margin, finalY + 8);
    
        const expenseLines = [
            { label: 'Gross Sale:', value: `₹${billData.totals.grossSale.toFixed(2)}` },
            { label: 'Freight:', value: `- ₹${billData.freight.toFixed(2)}` },
            { label: 'Labour:', value: `- ₹${billData.totals.labour.toFixed(2)}` },
            { label: 'Association:', value: `- ₹${billData.totals.association.toFixed(2)}` },
            { label: 'Security:', value: `- ₹${billData.totals.security.toFixed(2)}` },
            { label: 'Commission:', value: `- ₹${billData.totals.commissionAmount.toFixed(2)}` }
        ];
        
        const netSaleY = finalY + 8;
        let currentY = netSaleY;
        
        expenseLines.forEach(line => {
            doc.setFont('helvetica', 'normal');
            doc.text(line.label, summaryX, currentY, { align: 'left' });
            doc.text(line.value, pageWidth - margin, currentY, { align: 'right' });
            currentY += 4;
        });
    
        doc.setLineWidth(0.2);
        doc.line(summaryX, currentY, pageWidth - margin, currentY);
        currentY += 4;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Total Exp:', summaryX, currentY, { align: 'left' });
        doc.text(`- ₹${billData.totals.totalExpenses.toFixed(2)}`, pageWidth - margin, currentY, { align: 'right' });
        currentY += 4;
    
        doc.line(summaryX, currentY, pageWidth - margin, currentY);
        currentY += 5;
        
        doc.setFontSize(12);
        doc.text('Net Sale:', summaryX, currentY, { align: 'left' });
        doc.text(`₹${billData.totals.netSale.toFixed(2)}`, pageWidth - margin, currentY, { align: 'right' });
    
        // Footer
        const qrCanvas = document.querySelector('canvas');
        if (qrCanvas) {
            const qrImage = qrCanvas.toDataURL('image/png');
            doc.addImage(qrImage, 'PNG', margin, pageHeight - 35, 20, 20);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.text('Scan for Details & UPI', margin + 10, pageHeight - 12, { align: 'center'});
        }
    
        doc.addFont('/fonts/DancingScript-Bold.ttf', 'DancingScript', 'normal');
        doc.setFont('DancingScript');
        doc.setFontSize(12);
        doc.text('Faisal', pageWidth - margin - 20, pageHeight - 20, { align: 'center' });
    
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.text('For Firdous Ahmad & Company', pageWidth - margin - 20, pageHeight - 15, { align: 'center'});
        doc.setLineWidth(0.2);
        doc.line(pageWidth - margin - 40, pageHeight-16, pageWidth - margin, pageHeight-16);
    
    
        doc.save(`Invoice-${billData.sNo}_${billData.customerName}.pdf`);
    };



    const Controls = () => (
        <div className="flex flex-col gap-4 print:hidden p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2">
                 <Button onClick={() => setPrintStyle('a4')} variant={printStyle === 'a4' ? 'default' : 'outline'} size="sm" className="flex-1 gap-2">
                    <FileText className="h-4 w-4" /> A5
                </Button>
                <Button onClick={() => setPrintStyle('thermal')} variant={printStyle === 'thermal' ? 'default' : 'outline'} size="sm" className="flex-1 gap-2">
                    <Receipt className="h-4 w-4" /> Thermal
                </Button>
            </div>
             <div className="flex flex-col gap-2">
                <Button onClick={handleShare} variant="outline" size="sm" className="gap-2 bg-green-500/10 border-green-500/30 text-green-300 hover:bg-green-500/20 hover:text-green-200">
                    <FaWhatsapp className="h-4 w-4" />
                    Share on WhatsApp
                </Button>
                <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-2">
                    <Printer className="h-4 w-4" />
                    Print
                </Button>
                <Button onClick={handleDownloadPdf} size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                    <Download className="h-4 w-4" />
                    Save to Device
                </Button>
             </div>
             <div className="p-2 border border-gray-700 bg-gray-900 rounded-md flex flex-col items-center">
                <QRCode value={pageUrl} size={80} bgColor="#111827" fgColor="#FFFFFF"/>
                <p className="text-xs font-semibold mt-2 text-gray-400">Scan to View Bill</p>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="bg-gray-900 min-h-screen p-8 flex items-center justify-center">
                 <div className="w-[148mm] min-h-[210mm] mx-auto bg-gray-800 p-8">
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
            <div className="bg-gray-900 min-h-screen p-8 flex items-center justify-center">
                <div className="text-center p-8 border rounded-lg shadow-lg bg-gray-800 text-white">
                    <h2 className="text-2xl font-bold text-destructive">Invoice Not Found</h2>
                    <p className="text-muted-foreground mt-2">The invoice you are looking for does not exist or has been deleted.</p>
                </div>
            </div>
        );
    }

    const {
        sNo, date, customerName, watakNo, khata, entries, totals, freight
    } = billData;
    
    const ModernA4Layout = () => (
         <div className="w-[148mm] min-h-[210mm] mx-auto bg-gray-800 text-gray-200 shadow-2xl print:shadow-none p-6 flex flex-col font-sans relative">
            <div className="absolute inset-0 flex items-center justify-center z-0">
                <Logo className="w-96 h-96 opacity-[0.02]" />
            </div>
             <div className="relative z-10 flex flex-col flex-grow">
                <header className="bg-gradient-to-r from-green-500/80 to-teal-500/80 text-white p-4 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center">
                        <div className="text-left text-sm font-bold flex items-center gap-2">
                           <Logo className="h-8 w-8"/> F.Co
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold tracking-wider">FIRDOUS AHMAD & COMPANY</h2>
                            <p className="mt-1 text-[10px] opacity-80">Fruit Merchants & Commission Agents</p>
                            <p className="text-[8px] opacity-80">SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.</p>
                        </div>
                        <div className="text-right text-sm font-bold flex items-center gap-2">
                           F.Co <Logo className="h-8 w-8"/>
                        </div>
                    </div>
                </header>

                <main className="bg-gray-800/50 p-4 rounded-b-xl flex-grow mt-4">
                    <div className="grid grid-cols-2 gap-4 border-b border-gray-700 pb-3 mb-3 text-sm">
                        <div>
                            <h2 className="font-semibold text-gray-400">Bill To: / <span className="font-urdu">بل بنام</span></h2>
                            <p className="font-bold text-base text-white">{customerName}</p>
                            {khata && <p className="text-gray-400">Khata: {khata}</p>}
                        </div>
                        <div className="text-right text-xs text-gray-400">
                             <p><strong>Bill No:</strong> <span className="text-white font-mono">{sNo}</span></p>
                             <p><strong>Date:</strong> <span className="text-white font-mono">{new Date(date).toLocaleDateString('en-GB')}</span></p>
                             <p><strong>Watak No:</strong> <span className="text-white font-mono">{watakNo}</span></p>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-6 text-xs">
                        <div className="col-span-3">
                            <table className="w-full">
                                <thead className="text-gray-400 uppercase">
                                    <tr className="border-b border-gray-700">
                                        <th className="pb-2 text-left">Type</th>
                                        <th className="pb-2 text-left">Variety</th>
                                        <th className="pb-2 text-center">Qty</th>
                                        <th className="pb-2 text-right">Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((entry, index) => (
                                        <tr key={index} className="border-b border-gray-700/50">
                                            <td className="py-2">{entry.type}</td>
                                            <td className="py-2">{entry.variety}</td>
                                            <td className="py-2 text-center font-mono">{entry.qty}</td>
                                            <td className="py-2 text-right font-mono">₹{entry.rate.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="col-span-2 border-l border-gray-700 pl-6">
                            <h3 className="text-gray-400 uppercase font-semibold pb-2 border-b border-gray-700">Expenses</h3>
                             <div className="space-y-2 mt-2">
                                <div className="flex justify-between items-center"><span className="text-gray-400">Freight</span><span className="font-mono">₹{freight.toFixed(2)}</span></div>
                                <div className="flex justify-between items-center"><span className="text-gray-400">Labour</span><span className="font-mono">₹{totals.labour.toFixed(2)}</span></div>
                                <div className="flex justify-between items-center"><span className="text-gray-400">Association</span><span className="font-mono">₹{totals.association.toFixed(2)}</span></div>
                                <div className="flex justify-between items-center"><span className="text-gray-400">Security</span><span className="font-mono">₹{totals.security.toFixed(2)}</span></div>
                                <div className="flex justify-between items-center font-semibold pt-1 border-t border-gray-700/50"><span className="text-gray-300">Commission</span><span className="font-mono">₹{totals.commissionAmount.toFixed(2)}</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-5 gap-6">
                        <div className="col-span-3 text-xs">
                             <p className="text-gray-400"><strong>Total Quantity:</strong> <span className="font-mono text-gray-300">{totals.totalQty} (Patti: {totals.pattiQty}, Dabba: {totals.dabbaQty})</span></p>
                        </div>
                         <div className="col-span-2 space-y-1 text-sm border-l border-gray-700 pl-6">
                            <div className="flex justify-between items-center text-gray-400">
                                <span>Gross Sale:</span>
                                <span className="font-mono">₹{totals.grossSale.toFixed(2)}</span>
                             </div>
                             <div className="flex justify-between items-center text-gray-400">
                                <span>Total Expenses:</span>
                                <span className="font-mono">- ₹{totals.totalExpenses.toFixed(2)}</span>
                            </div>
                            <Separator className="my-2 bg-gray-600" />
                             <div className="flex justify-between items-center text-lg font-bold text-green-400 pt-1">
                                <span >Net Sale:</span>
                                <span className="font-mono">₹{totals.netSale.toFixed(2)}</span>
                             </div>
                        </div>
                    </div>
                </main>

                <footer className="flex justify-between items-end mt-auto pt-4 border-t border-gray-700 text-xs">
                    <BusinessCardQR size={64} />
                    <div className="text-right text-gray-400">
                        <p className="font-signature text-3xl text-gray-200">Faisal</p>
                        <p className="font-bold -mt-2">For Firdous Ahmad & Company</p>
                        <p className="text-[10px]">Sign. Of Manager</p>
                    </div>
                </footer>
            </div>
        </div>
    );
    
    const ClassicA4Layout = () => {
         const emptyRowsCount = Math.max(0, 12 - entries.length);
         const emptyRows = Array.from({ length: emptyRowsCount });

        return (
             <div className="w-[148mm] h-[210mm] bg-[#FDFEE2] text-black shadow-lg print:shadow-none p-4 border-2 border-green-700 flex flex-col relative font-serif">
                <div className="absolute inset-0 flex items-center justify-center z-0">
                   <Logo className="w-48 h-48 opacity-10" />
                </div>
                 <div className="relative z-10 flex flex-col flex-grow">
                    <header className="text-center border-b-2 border-green-700 pb-1">
                        <div className="flex justify-between items-start">
                             <div className="text-left text-xs font-bold"><p>🍎 F.Co</p></div>
                             <div className="flex-grow">
                                <div className="text-[8px] leading-tight">
                                     <p className="font-bold">Prop: Firdous Ahmad Lone (Nadihal)</p>
                                     <p>Cell: 7006136330, 9797002164, 9906740921</p>
                                </div>
                                <h1 className="text-lg font-bold text-green-800">FIRDOUS AHMAD & COMPANY</h1>
                                <p className="text-[10px] font-semibold">Fruit Merchants & Commission Agents</p>
                                <p className="text-[8px]">SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.</p>
                             </div>
                             <div className="text-right text-xs font-bold"><p>🍎 F.Co</p></div>
                        </div>
                    </header>
                    <section className="flex justify-between items-end my-1 text-sm">
                        <div>
                            <p><strong>M/s:</strong> {customerName}</p>
                            {khata && <p><strong>Khata:</strong> {khata}</p>}
                        </div>
                        <div className="text-right text-xs">
                            <p><strong>Bill No:</strong> {sNo}</p>
                            <p><strong>Date:</strong> {new Date(date).toLocaleDateString('en-GB')}</p>
                            <p><strong>Watak No:</strong> {watakNo}</p>
                        </div>
                    </section>
                    <main className="flex-grow">
                         <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-y-2 border-green-700">
                                    <th className="p-1 border-x border-green-600">TYPE</th>
                                    <th className="p-1 border-x border-green-600">VARIETY</th>
                                    <th className="p-1 border-x border-green-600">QTY</th>
                                    <th className="p-1 border-x border-green-600">RATE</th>
                                    <th className="p-1 border-x border-green-600">GROSS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry, index) => (
                                    <tr key={index} className="border-b border-green-600/50 h-5">
                                        <td className="py-0.5 px-1 border-x border-green-600">{entry.type}</td>
                                        <td className="py-0.5 px-1 border-x border-green-600">{entry.variety}</td>
                                        <td className="py-0.5 px-1 border-x border-green-600 text-center">{entry.qty}</td>
                                        <td className="py-0.5 px-1 border-x border-green-600 text-right">₹{entry.rate.toFixed(2)}</td>
                                        <td className="py-0.5 px-1 border-x border-green-600 text-right font-semibold">₹{(entry.qty * entry.rate).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {emptyRows.map((_, index) => (
                                     <tr key={`empty-${index}`} className="border-b border-green-600/50 h-5">
                                        <td className="py-0.5 px-1 border-x border-green-600">&nbsp;</td>
                                        <td className="py-0.5 px-1 border-x border-green-600"></td>
                                        <td className="py-0.5 px-1 border-x border-green-600"></td>
                                        <td className="py-0.5 px-1 border-x border-green-600"></td>
                                        <td className="py-0.5 px-1 border-x border-green-600"></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </main>
                     <footer className="mt-auto pt-1 text-xs">
                        <div className="grid grid-cols-2 gap-x-4">
                            <div className="space-y-0.5 pr-4">
                                <p><strong>Total Quantity:</strong> {totals.totalQty} (Patti: {totals.pattiQty}, Dabba: {totals.dabbaQty})</p>
                            </div>
                            <div className="space-y-0.5 border-l-2 border-green-700 pl-4 text-[10px]">
                                 <div className="flex justify-between"><span>Gross Sale:</span> <span className="font-semibold">₹{totals.grossSale.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Freight:</span> <span>- ₹{freight.toFixed(2)}</span></div>
                                 <div className="flex justify-between"><span>Labour:</span> <span>- ₹{totals.labour.toFixed(2)}</span></div>
                                 <div className="flex justify-between"><span>Association:</span> <span>- ₹{totals.association.toFixed(2)}</span></div>
                                 <div className="flex justify-between"><span>Security:</span> <span>- ₹{totals.security.toFixed(2)}</span></div>
                                 <div className="flex justify-between"><span>Commission:</span> <span>- ₹{totals.commissionAmount.toFixed(2)}</span></div>
                                 <div className="flex justify-between font-bold border-t border-gray-400"><span>Total Exp:</span> <span>- ₹{totals.totalExpenses.toFixed(2)}</span></div>
                                 <div className="flex justify-between font-bold text-base border-t border-gray-400"><span>Net Sale:</span> <span>₹{totals.netSale.toFixed(2)}</span></div>
                            </div>
                        </div>
                         <div className="flex justify-between items-end mt-1">
                            <BusinessCardQR size={40} />
                             <div className="text-center">
                                <p className="font-signature text-xl">Faisal</p>
                                <p className="font-bold -mt-2 text-[10px]">For Firdous Ahmad & Company</p>
                             </div>
                        </div>
                     </footer>
                </div>
            </div>
        )
    };

    const ThermalLayout = () => (
        <div className="w-[80mm] bg-white text-black p-2 font-sans text-xs leading-tight">
            <header className="text-center space-y-1">
                <h1 className="text-sm font-bold">Firdous Ahmad & Company</h1>
                <p className="text-[10px]">Fruit Merchants & Commission Agents, Sopore, Kashmir</p>
                <p className="text-[10px]">Ph: 7006136330</p>
                <p className="border-t border-dashed border-black mt-1 pt-1 font-bold">Sale Invoice</p>
            </header>
            <main className="my-2 border-t border-b border-dashed border-black py-2 space-y-1 text-[11px]">
                <div className="flex justify-between"><span>Bill No: {sNo}</span> <span>Date: {new Date(date).toLocaleDateString('en-GB')}</span></div>
                {watakNo && <div className="flex justify-between"><span>Watak: {watakNo}</span></div>}
                <div>Customer: {customerName}</div>
            </main>
            <table className="w-full text-[11px]">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="text-left">Item</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Rate</th>
                        <th className="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry, i) => (
                        <tr key={i} className="border-b border-dashed border-black">
                            <td className="text-left py-1">{entry.variety} ({entry.type})</td>
                            <td className="text-right">{entry.qty}</td>
                            <td className="text-right">{entry.rate.toFixed(2)}</td>
                            <td className="text-right">{(entry.qty * entry.rate).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="my-2 border-t border-dashed border-black pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between"><span>Gross Sale:</span><span>{totals.grossSale.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Freight:</span><span>- {freight.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Labour:</span><span>- {totals.labour.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Commission:</span><span>- {totals.commissionAmount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Other Exp:</span><span>- {(totals.association + totals.security).toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold"><span>Total Exp:</span><span>- {totals.totalExpenses.toFixed(2)}</span></div>
            </div>
             <div className="my-2 border-t-2 border-black pt-1 space-y-1 text-sm font-bold">
                <div className="flex justify-between"><span>NET SALE:</span><span>₹{totals.netSale.toFixed(2)}</span></div>
            </div>
            <footer className="text-center pt-2 border-t border-dashed border-black text-[10px]">
                <p>Thank you for your business!</p>
                <div className="flex justify-center pt-2">
                    <BusinessCardQR size={60} />
                </div>
            </footer>
        </div>
    );
    
    const renderContent = () => {
        switch(invoiceStyle) {
            case 'modern': return <ModernA4Layout />;
            default: return <ClassicA4Layout />;
        }
    }


    return (
        <div className="bg-gray-900 font-sans print:bg-white flex flex-col md:flex-row gap-8 justify-center p-4 md:p-8">
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
                    }
                     .print-area-thermal {
                        display: ${printStyle === 'thermal' ? 'block !important' : 'none !important'};
                    }
                    .A5-page {
                         @page {
                            size: A5 portrait;
                            margin: 0;
                        }
                    }
                }
            `}</style>
            
            <div className="print:hidden w-full max-w-[250px] space-y-4 sticky top-4 self-start">
                <Controls />
            </div>

            <div className="print-container A5-page">
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
