
'use client'

import * as React from 'react';
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
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
      serviceCharges: number;
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
    const router = useRouter();

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
            const localData = localStorage.getItem(`invoice-${params.id}`);
            if (localData) {
                try {
                    data = JSON.parse(localData) as BillData;
                } catch (e) {
                    toast({ variant: "destructive", title: "Local Data Corrupted" });
                }
            } else {
                const { success, data: firestoreData, error } = await getDocument(`bills/${params.id}`);
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
                  setPageUrl(`${window.location.origin}/bill/view/${params.id}?style=${invoiceStyle}`);
                }
            }
            
            setLoading(false);
        };
        fetchBill();
    }, [params.id, toast, invoiceStyle]);


    const handleShare = () => {
        if (billData) {
            const message = `F.Co Official Invoice (#${billData.sNo}) for ${billData.customerName}: ${pageUrl}`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        } else {
            toast({ variant: "destructive", title: "Share Failed", description: "Could not share the invoice." });
        }
    };
    
    const handleDownloadPdf = async () => {
        toast({
            title: "Generating High-Res PDF",
            description: "Preparing your document for local storage...",
        });

        const activeLayout = printRef.current;
        if (!activeLayout || !billData) return;

        const isThermal = printStyle === 'thermal';
        const format: any = isThermal ? [80, 297] : 'a5';
        const orientation = 'portrait';

        const content =
    printStyle === 'a4'
        ? activeLayout.querySelector('.print-area-a4')
        : activeLayout.querySelector('.print-area-thermal');
        if (!content) return;

        try {
            const canvas = await html2canvas(content as HTMLElement, {
                scale: 3, // Ultra high resolution for "Save to Device"
                useCORS: true,
                backgroundColor: invoiceStyle === 'modern-dark' ? '#1f2937' : '#ffffff',
                logging: false
            });

            const pdf = new jsPDF({
                orientation,
                unit: 'mm',
                format,
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`FCo-Invoice-${billData.sNo}_${billData.customerName}.pdf`);
            
            toast({ title: "Document Saved", description: "The invoice has been downloaded to your device.", isSuccess: true });
        } catch (e) {
            toast({ variant: 'destructive', title: "Save Failed", description: "An error occurred while generating the PDF." });
        }
    };



    const Controls = () => (
        <div className="flex flex-col gap-4 print:hidden p-6 glass-panel rounded-[2rem] border-white/10">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Output Options</h3>
            <div className="flex items-center gap-2">
                <Button onClick={() => setPrintStyle('a4')} variant={printStyle === 'a4' ? 'default' : 'outline'} size="sm" className="flex-1 h-12 rounded-xl gap-2 font-bold">
                    <FileText className="h-4 w-4" /> A5 MASTER
                </Button>
                <Button onClick={() => setPrintStyle('thermal')} variant={printStyle === 'thermal' ? 'default' : 'outline'} size="sm" className="flex-1 h-12 rounded-xl gap-2 font-bold">
                    <Receipt className="h-4 w-4" /> THERMAL
                </Button>
            </div>
             <div className="flex flex-col gap-2">
                <Button onClick={handleShare} variant="outline" size="sm" className="h-12 rounded-xl gap-2 bg-green-500/10 border-green-500/20 text-green-400 font-bold hover:bg-green-500/20">
                    <FaWhatsapp className="h-4 w-4" />
                    WHATSAPP SHARE
                </Button>
                <Button onClick={() => window.print()} variant="outline" size="sm" className="h-12 rounded-xl gap-2 border-white/10 font-bold">
                    <Printer className="h-4 w-4" />
                    PRINT NOW
                </Button>
            </div>
            <Button onClick={handleDownloadPdf} size="sm" className="h-14 rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black tracking-widest">
                <Download className="h-5 w-5" />
                SAVE TO DEVICE
            </Button>
             {billData && pageUrl && (
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center gap-3">
                    <div className="p-2 bg-white rounded-xl">
                        <QRCode value={pageUrl} size={120} bgColor="#ffffff" fgColor="#000000" level="H" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Verification QR Code</p>
                </div>
            )}
        </div>
    )

    if (loading) {
        return (
            <div className="bg-muted min-h-screen p-8 flex items-center justify-center">
                 <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-16 w-16 animate-spin text-accent" />
                    <p className="text-lg font-black tracking-tighter opacity-50">INITIALIZING SECURE RENDER...</p>
                 </div>
            </div>
        )
    }

    if (!billData) {
        return (
            <div className="bg-background min-h-screen p-8 flex items-center justify-center">
                <div className="text-center p-12 glass-panel rounded-[3rem] border-destructive/20 text-card-foreground">
                    <h2 className="text-3xl font-black tracking-tighter text-destructive uppercase">Invoice Null</h2>
                    <p className="text-muted-foreground mt-4 font-semibold">The specified document node could not be located in local or cloud storage.</p>
                    <Button onClick={() => router.push('/watak-register')} className="mt-8 rounded-xl font-bold">BACK TO REGISTER</Button>
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
        <div className="bg-background font-sans print:bg-white flex flex-col md:flex-row gap-10 justify-center p-4 md:p-12">
             <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .print-container {
                        margin: 1mm;
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
                        margin: 1mm;
                    }
                }
            `}</style>
            
            <div className="print:hidden w-full max-w-[300px] space-y-4 sticky top-10 self-start">
                <Controls />
            </div>

            <div className="print-container">
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
