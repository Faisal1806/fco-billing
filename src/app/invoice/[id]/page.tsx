

'use client'

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download, FileText, Receipt } from "lucide-react";
import { FaWhatsapp } from 'react-icons/fa';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode.react';
import { ClassicA4Layout } from "@/components/invoice-templates/classic-a4";
import { ModernDarkA4Layout } from "@/components/invoice-templates/modern-dark-a4";
import { ThermalLayout } from "@/components/invoice-templates/thermal";
import { ModernLightA4Layout } from "@/components/invoice-templates/modern-light-a4";

interface BillData {
    id: string;
    sNo: string;
    date: string;
    date2?: string;
    customerName: string;
    watakNo: string;
    khata: string;
    entries: {
        peti?: number;
        daba?: number;
        variety: string;
        rate: number;
        type: 'Patti' | 'Dabba';
        qty: number;
        total: number;
        isForwarded?: boolean;
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
                try {
                    data = JSON.parse(localData) as BillData;
                } catch (e) {
                    console.error("Failed to parse invoice data", e);
                    toast({
                        variant: "destructive",
                        title: "Error Loading Invoice",
                        description: "The saved invoice data appears to be corrupted."
                    });
                }
            }

            if (data) {
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
        toast({
            title: "Generating PDF...",
            description: "Your PDF is being created. This might take a moment.",
        });

        const invoiceElement = printRef.current;
        if (!invoiceElement || !billData) return;

        import('html2canvas').then(html2canvas => {
            const activeLayout = printStyle === 'a4' ? invoiceElement.querySelector('.print-area-a4') : invoiceElement.querySelector('.print-area-thermal');
            if (!activeLayout) return;

            // Find all QR code canvas elements within the layout
            const qrCanvases = activeLayout.querySelectorAll<HTMLCanvasElement>('canvas[aria-label="QR code"]');
            
            const isThermal = printStyle === 'thermal';
            const format = isThermal ? [80, 297] : 'a5';
            const orientation = 'portrait';
            const backgroundColor = invoiceStyle === 'modern-dark' ? '#1f2937' : (printStyle === 'thermal' || invoiceStyle === 'modern-light' ? '#ffffff' : '#FDFEE2');

            html2canvas.default(activeLayout as HTMLElement, {
                scale: 3, // Increase scale for better overall quality
                useCORS: true,
                backgroundColor: backgroundColor,
                onclone: (document) => {
                    const clonedBody = document.body;
                    if (invoiceStyle === 'modern-dark') {
                        clonedBody.style.color = '#e5e7eb';
                    } else {
                        clonedBody.style.color = '#111827';
                    }
                }
            }).then(canvas => {
                const pdf = new jsPDF({
                    orientation,
                    unit: 'mm',
                    format,
                });
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);

                // Re-draw high-quality QR codes over the screenshot
                qrCanvases.forEach(qrCanvas => {
                    const qrRect = qrCanvas.getBoundingClientRect();
                    const layoutRect = activeLayout.getBoundingClientRect();

                    const x = ((qrRect.left - layoutRect.left) / layoutRect.width) * pdfWidth;
                    const y = ((qrRect.top - layoutRect.top) / layoutRect.height) * pdfHeight;
                    const width = (qrRect.width / layoutRect.width) * pdfWidth;
                    const height = (qrRect.height / layoutRect.height) * pdfHeight;
                    
                    // Use a higher-resolution version of the QR code for the PDF
                    const highResCanvas = document.createElement('canvas');
                    const qrInstance = new (QRCode as any)({ // Use 'any' to bypass potential type issues with constructor
                        value: qrCanvas.ariaValueText,
                        size: 512, // High resolution
                        level: 'M',
                        includeMargin: false,
                        renderAs: 'canvas',
                    });
                    const highResDataURL = qrInstance._canvas.current.toDataURL('image/png');
                    
                    pdf.addImage(highResDataURL, 'PNG', x, y, width, height);
                });
                
                pdf.save(`Invoice-${billData.sNo}_${billData.customerName}.pdf`);
            });
        });
    };



    const Controls = () => (
        <div className="flex flex-col gap-4 print:hidden p-4 bg-card rounded-lg border">
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
             <div className="p-2 border bg-muted rounded-md flex flex-col items-center">
                <QRCode value={pageUrl} size={80} bgColor="transparent" fgColor="hsl(var(--foreground))" />
                <p className="text-xs font-semibold text-muted-foreground mt-1">Scan to View Bill</p>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="bg-muted min-h-screen p-8 flex items-center justify-center">
                 <div className="w-[148mm] min-h-[210mm] mx-auto bg-card p-8">
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
            <div className="bg-background min-h-screen p-8 flex items-center justify-center">
                <div className="text-center p-8 border rounded-lg shadow-lg bg-card text-card-foreground">
                    <h2 className="text-2xl font-bold text-destructive">Invoice Not Found</h2>
                    <p className="text-muted-foreground mt-2">The invoice you are looking for does not exist or has been deleted.</p>
                </div>
            </div>
        );
    }
    
    const renderContent = () => {
        const props = { billData, pageUrl };
        switch(invoiceStyle) {
            case 'modern-dark': return <ModernDarkA4Layout {...props} />;
            case 'modern-light': return <ModernLightA4Layout {...props} />;
            default: return <ClassicA4Layout {...props} />;
        }
    }


    return (
        <div className="bg-muted/40 font-sans print:bg-white flex flex-col md:flex-row gap-8 justify-center p-4 md:p-8">
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
                        <ThermalLayout billData={billData} pageUrl={pageUrl} />
                    </div>
                </div>
            </div>
        </div>
    );
}
