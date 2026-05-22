

'use client'

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Printer, Download, FileText, Receipt, Loader2 } from "lucide-react";
import { FaWhatsapp } from 'react-icons/fa';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode.react';
import BusinessCardQR from "@/components/BusinessCardQR";
import { getDocument } from "@/lib/actions";
import { useSearchParams } from "next/navigation";

interface PurchaseData {
    id: string;
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


export default function PurchaseBillPage({ params }: { params: { id:string } }) {
    const [billData, setBillData] = useState<PurchaseData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const printRef = useRef<HTMLDivElement>(null);
    const [pageUrl, setPageUrl] = useState('');
    const [printStyle, setPrintStyle] = useState<'a4' | 'thermal'>('a4');
    const [invoiceStyle, setInvoiceStyle] = useState('classic');
    const searchParams = useSearchParams();
    const isPublicView = searchParams.get('source') === 'qr';


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

            let data: PurchaseData | null = null;
            const docId = `purchase-${params.id}`;

            const { success, data: firestoreData, error } = await getDocument('purchases', docId);

            if (success && firestoreData) {
                data = firestoreData as PurchaseData;
            } else {
                const localData = localStorage.getItem(docId);
                if (localData) {
                    data = JSON.parse(localData);
                } else {
                    toast({
                        variant: "destructive",
                        title: "Not Found",
                        description: error || "The purchase bill was not found."
                    });
                }
            }
            
            if (data) {
                setBillData(data);
            }
            setLoading(false);
        };
        fetchBill();
    }, [params.id, toast, isPublicView]);


    const handleShare = () => {
        if (billData) {
            const message = `Check out this Purchase Bill (#${billData.billNo}) from ${billData.growerName}: ${window.location.href.split('?')[0]}?source=qr`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        } else {
            toast({ variant: "destructive", title: "Share Failed", description: "Could not share the purchase bill." });
        }
    };

    const handleDownloadPdf = async () => {
        const element = printRef.current;
        if (!element || !billData) return;
    
        const activeLayout = printStyle === 'a4' ? element.querySelector('.print-area-a4 > div') : element.querySelector('.print-area-thermal');
        if (!activeLayout) return;

        const canvas = await html2canvas(activeLayout as HTMLElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: invoiceStyle === 'modern' ? '#1f2937' : (printStyle === 'thermal' ? '#ffffff' : '#FDFEE2'),
        });
    
        const isThermal = printStyle === 'thermal';
        const format: any = isThermal ? [80, 297] : 'a5';
        const orientation = 'portrait';
    
        const pdf = new jsPDF({
            orientation,
            unit: 'mm',
            format,
        });
    
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Purchase-Bill-${billData.billNo}.pdf`);
    };


    const Controls = () => (
        <div className="flex flex-col gap-4 print:hidden">
             <div className="flex items-center gap-2">
                <Button onClick={() => setPrintStyle('a4')} variant={printStyle === 'a4' ? 'default' : 'outline'} size="sm" className="gap-2">
                    <FileText className="h-4 w-4" /> A5
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
                    Save PDF
                </Button>
            </div>
             <div className="p-2 border rounded-md flex flex-col items-center">
                <QRCode value={`${window.location.href.split('?')[0]}?source=qr`} size={60} />
                <p className="text-xs font-semibold mt-1">Scan to View Bill</p>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="bg-muted min-h-screen p-8 flex items-center justify-center">
                 <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    <p className="text-lg text-muted-foreground">Loading Purchase Bill...</p>
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
    
    const A4Layout = () => (
         <div className="w-[148mm] min-h-[210mm] bg-[#FDFEE2] text-black shadow-lg print:shadow-none p-4 border-2 border-green-700 flex flex-col relative font-serif">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center z-0">
               <Logo className="w-48 h-48 opacity-10" />
            </div>
            
            <div className="relative z-10 flex flex-col flex-grow">

                {/* Header */}
                <header className="text-center border-b-2 border-green-700 pb-2">
                    <div className="flex justify-between items-start">
                         <div className="text-left text-sm font-bold">
                            <p>🍎 F.Co</p>
                         </div>
                         <div className="flex-grow">
                            <div className="text-xs">
                                 <p className="font-bold">Prop: Firdous Ahmad Lone (Nadihal)</p>
                                 <p>Cell: 7006136330, 9797002164, 9906740921</p>
                            </div>
                            <h1 className="text-2xl font-bold text-green-800">FIRDOUS AHMAD & COMPANY</h1>
                            <p className="text-xs font-semibold">Fruit Merchants & Commission Agents</p>
                            <p className="text-xs">SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.</p>
                         </div>
                         <div className="text-right text-sm font-bold">
                            <p>🍎 F.Co</p>
                         </div>
                    </div>
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
                <main className="flex-grow">
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
                        </tbody>
                    </table>
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
                    <div className="flex justify-between items-end mt-4">
                         <div className="text-center">
                            <BusinessCardQR size={60} />
                        </div>
                        <div className="text-center">
                            <p className="font-signature text-2xl text-gray-700 dark:text-gray-300">Faisal</p>
                            <p className="font-bold -mt-2">Sign. Of Manager</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
    
    const ThermalLayout = () => (
        <div className="w-[80mm] bg-white text-black p-2 font-mono text-[10px] leading-tight">
            <header className="text-center space-y-1">
                <h1 className="text-sm font-bold">Firdous Ahmad & Company</h1>
                <p>Fruit Merchants & Commission Agents, Sopore</p>
                <p>Ph: 7006136330</p>
                <p className="border-t border-dashed border-black mt-1 pt-1 font-bold">Purchase Bill</p>
            </header>
            <main className="my-2 border-t border-b border-dashed border-black py-2 space-y-1">
                <div className="flex justify-between"><span>Bill No: {billNo}</span> <span>Date: {new Date(date).toLocaleDateString('en-GB')}</span></div>
                <div>From: {growerName}</div>
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
                            <td className="text-right">{(entry.total).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
             <div className="my-2 border-t-2 border-black pt-1 space-y-1 text-sm font-bold">
                <div className="flex justify-between"><span>GRAND TOTAL:</span><span>₹{totals.grandTotal.toFixed(2)}</span></div>
            </div>
            <footer className="text-center pt-2 border-t border-dashed border-black">
                <p>Thank you for your business!</p>
                <div className="flex justify-center pt-2">
                    <BusinessCardQR size={80} />
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
        <div className="bg-gray-200 dark:bg-gray-900 font-sans print:bg-white flex flex-col md:flex-row gap-8 justify-center p-4 md:p-8">
            <style jsx global>{`
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
                        display: ${printStyle === 'a4' ? 'block' : 'none'} !important;
                    }
                     .print-area-thermal {
                        display: ${printStyle === 'thermal' ? 'block' : 'none'} !important;
                    }

                    @page {
                        size: ${printStyle === 'a4' ? 'A5 portrait' : '80mm 297mm'};
                        margin: 0;
                    }
                }
            `}</style>
            
            <div className="print:hidden w-full max-w-xs space-y-4">
                <Controls />
            </div>

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

