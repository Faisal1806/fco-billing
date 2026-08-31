'use client'

import * as React from 'react';
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Printer, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClassicA4Layout } from "@/components/invoice-templates/classic-a4";
import { ModernDarkA4Layout } from "@/components/invoice-templates/modern-dark-a4";
import { ModernLightA4Layout } from "@/components/invoice-templates/modern-light-a4";
import { getDocument } from "@/lib/actions";
import { normalizeInvoiceData } from '@/lib/commission';
import { usePrintOrientation } from '@/components/print-orientation-provider';
import { PrintOrientationSelector } from '@/components/print-orientation-selector';

// This is the public-facing bill viewer page.
// It fetches from the new, public `bills` collection.

export default function PublicBillPage({ params }: { params: { id: string } }) {
    const [billData, setBillData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [pageUrl, setPageUrl] = useState('');
    const [invoiceStyle, setInvoiceStyle] = useState('classic');
    const searchParams = useSearchParams();
    const { orientation, printDocument } = usePrintOrientation();
    const styleParam = searchParams.get('style');


    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPageUrl(window.location.href);
            // On public pages, the style is passed via URL param
            if (styleParam) {
                setInvoiceStyle(styleParam);
            }
        }
        const fetchBill = async () => {
            if (!params.id) {
                setLoading(false);
                return;
            };
            setLoading(true);

            // Fetch directly from the new public `bills` collection.
            const { success, data: firestoreData, error } = await getDocument(`bills/${params.id}`);
            
            if (success && firestoreData) {
                setBillData(normalizeInvoiceData(firestoreData));
            } else {
                toast({
                    variant: "destructive",
                    title: "Invoice Not Found",
                    description: error || "The requested invoice could not be found in the cloud."
                });
            }
            
            setLoading(false);
        };
        fetchBill();
    }, [params.id, toast, styleParam]);

    const renderContent = () => {
        const props = { billData, pageUrl };
        switch(invoiceStyle) {
            case 'modern-dark': return <ModernDarkA4Layout {...props} />;
            case 'modern-light': return <ModernLightA4Layout {...props} />;
            default: return <ClassicA4Layout {...props} />;
        }
    }

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
    
    return (
        <div className="bg-muted/40 font-sans print:bg-white flex flex-col md:flex-row gap-8 justify-center p-4 md:p-8">
            <style jsx global>{`
                 @media print {
                    .print-container {
                        margin: 0;
                        padding: 0;
                    }
                    @page {
                        size: ${orientation === 'landscape' ? 'A5 landscape' : 'A5 portrait'};
                        margin: 1mm;
                    }
                }
            `}</style>
            
            <div className="print:hidden w-full max-w-[250px] space-y-4 sticky top-4 self-start">
                 <div className="flex flex-col gap-4 print:hidden p-4 bg-card rounded-lg border">
                     <PrintOrientationSelector />
                     <Button onClick={printDocument} variant="outline" size="sm" className="gap-2">
                        <Printer className="h-4 w-4" />
                        Print
                    </Button>
                    <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                        <Download className="h-4 w-4" />
                        Save to Device
                    </Button>
                </div>
            </div>

            <div className="print-container">
                {renderContent()}
            </div>
        </div>
    );
}


