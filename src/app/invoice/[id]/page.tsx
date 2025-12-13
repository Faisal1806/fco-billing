'use client'

import * as React from 'react';
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Printer, Download, FileText, Receipt, Loader2 } from "lucide-react";
import { FaWhatsapp } from 'react-icons/fa';
import { useToast } from "@/hooks/use-toast";
import QRCode from 'qrcode.react';
import { ClassicA4Layout } from "@/components/invoice-templates/classic-a4";
import { ModernDarkA4Layout } from "@/components/invoice-templates/modern-dark-a4";
import { ThermalLayout } from "@/components/invoice-templates/thermal";
import { ModernLightA4Layout } from "@/components/invoice-templates/modern-light-a4";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getDocument } from "@/lib/actions";

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
            // The internal page can just use the local copy
            const localData = localStorage.getItem(`invoice-${params.id}`);
            if (localData) {
                try {
                    data = JSON.parse(localData) as BillData;
                } catch (e) {
                    toast({ variant: "destructive", title: "Local Data Corrupted" });
                }
            } else {
                // As a fallback, try fetching from the public collection if local is missing
                const { success, data: firestoreData, error } = await getDocument('bills', params.id);
                 if (success && firestoreData) {
                    data = firestoreData as BillData;
                } else {
                     toast({
                        variant: "destructive",
                        title: "Invoice Not Found",
                        description: error || "The invoice may not exist on this device or in the cloud."
                    });
                }
            }


            if (data) {
                setBillData(data);
                if(typeof window !== 'undefined'){
                  // The QR link points to the new public page and includes the style
                  setPageUrl(`${window.location.origin}/bill/view/${params.id}?style=${invoiceStyle}`);
                }
            }
            
            setLoading(false);
        };
        fetchBill();
    }, [params.id, toast, invoiceStyle]);


    const handleShare = () => {
        if (billData) {
            const message = `Check out this Invoice (#${billData.sNo}) for ${billData.customerName}: ${pageUrl}`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        } else {
            toast({ variant: "destructive", title: "Share Failed", description: "Could not share the invoice." });
        }
    };
    
    const handleDownloadPdf = async () => {
        toast({
            title: "Generating PDF...",
            description: "Your PDF is being created. This might take a moment.",
        });

        const activeLayout = printRef.current;
        if (!activeLayout || !billData) return;

        const isThermal = printStyle === 'thermal';
        const format: any = isThermal ? [80, 297] : 'a5';
        const orientation = 'portrait';

        const content = printStyle === 'a4'
            ? activeLayout.querySelector('.print-area-a4 > div')
            : activeLayout.querySelector('.print-area-thermal');

        if (!content) return;

        const canvas = await html2canvas(content as HTMLElement, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            backgroundColor: invoiceStyle === 'modern-dark' ? '#1f2937' : '#ffffff',
        });

        const pdf = new jsPDF({
            orientation,
            unit: 'mm',
            format,
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Invoice-${billData.sNo}_${billData.customerName}.pdf`);
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
            </div>
            <Button onClick={handleDownloadPdf} size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="h-4 w-4" />
                Save to Device
            </Button>
             {billData && pageUrl && (
                <div className="p-4 border bg-muted rounded-md flex flex-col items-center gap-2">
                    <QRCode value={pageUrl} size={128} bgColor="transparent" fgColor="hsl(var(--foreground))" />
                    <p className="text-xs font-semibold text-muted-foreground mt-1">Scan to View Bill</p>
                </div>
            )}
        </div>
    )

    if (loading) {
        return (
            <div className="bg-muted min-h-screen p-8 flex items-center justify-center">
                 <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    <p className="text-lg text-muted-foreground">Loading Invoice...</p>
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
        const props = { billData, pageUrl: pageUrl };
        switch(invoiceStyle) {
            case 'modern-dark': return <ModernDarkA4Layout {...props} />;
            case 'modern-light': return <ModernLightA4Layout {...props} />;
            default: return <ClassicA4Layout {...props} />;
        }
    }


    return (
        <div className="bg-muted/40 font-sans print:bg-white flex flex-col md:flex-row gap-8 justify-center p-4 md:p-8">
             <style jsx global>{`
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
