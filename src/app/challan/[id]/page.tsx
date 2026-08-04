

'use client'

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Download, FileText, Receipt } from "lucide-react";
import { FaWhatsapp } from 'react-icons/fa';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode.react';
import { useSearchParams } from "next/navigation";
import { getDocument } from "@/lib/actions";


interface ChallanData {
    id: string;
    challanNo: string;
    date: string;
    toMs: string;
    vehicleNo: string;
    company: string;
    driverName: string;
    entries: {
        peti: number;
        daba: number;
        kind: string;
        khata: string;
        rate: number;
        totalFreight: number;
        advance: number;
        balance: number;
        expenditure: number;
    }[];
    totalPetti: number;
    totalDabba: number;
    totalNugs: number;
    tollTax: number;
    payOnlyFreight: number;
}


export default function DeliveryNotePage({ params }: { params: { id: string } }) {
    const [challanData, setChallanData] = useState<ChallanData | null>(null);
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
        const fetchChallan = async () => {
             if (!params.id) {
                setLoading(false);
                return;
            };
            setLoading(true);

            let data: ChallanData | null = null;
            const decodedId = decodeURIComponent(params.id);
            const docId = `challan-${decodedId}`;

            if (isPublicView) {
                const { success, data: firestoreData, error } = await getDocument('challans', decodedId);
                if (success && firestoreData) {
                    data = firestoreData as ChallanData;
                } else {
                    toast({ variant: "destructive", title: "Not Found", description: error });
                }
            } else {
                const storedChallan = localStorage.getItem(docId);
                if (storedChallan) {
                    data = JSON.parse(storedChallan);
                }
            }
            
            if (data) {
                setChallanData(data);
            } else if (!isPublicView) {
                toast({
                    variant: "destructive",
                    title: "Delivery Note Not Found",
                    description: "The requested delivery note was not found on this device."
                });
            }
            
            setLoading(false);
        };
        fetchChallan();
    }, [params.id, toast, isPublicView]);

    const handleShare = () => {
        if (challanData) {
            const message = `Check out this Delivery Note (#${challanData.challanNo}) for ${challanData.toMs}: ${window.location.href.split('?')[0]}?source=qr`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        } else {
            toast({ variant: "destructive", title: "Share Failed", description: "Could not share the delivery note." });
        }
    };
    
    const handleDownloadPdf = async () => {
        const element = printRef.current;
        if (!element || !challanData) return;

        const isThermal = printStyle === 'thermal';
        const format: any = isThermal ? [80, 297] : 'a5';
        const orientation = 'portrait';
    
        const activeLayout = printStyle === 'a4' ? element.querySelector('.print-area-a4 > div') : element.querySelector('.print-area-thermal');
        if (!activeLayout) return;

        const canvas = await html2canvas(activeLayout as HTMLElement, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
        });

        const pdf = new jsPDF({
            orientation,
            unit: 'mm',
            format,
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Delivery-Note-${challanData.challanNo}.pdf`);
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
                    Save to Device
                </Button>
             </div>
              <div className="p-2 border rounded-md flex flex-col items-center">
                <QRCode value={`${window.location.href.split('?')[0]}?source=qr`} size={60} />
                <p className="text-xs font-semibold mt-1">Scan to View</p>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="bg-muted min-h-screen p-8 flex items-center justify-center">
                 <div className="w-[146mm] h-[208mm] bg-[#FDFEE2] text-black shadow-lg print:shadow-none p-[6mm] border border-green-700 flex flex-col relative font-serif overflow-hidden">
                    <Skeleton className="h-24 w-full mb-4" />
                    <Skeleton className="h-48 w-full" />
                 </div>
            </div>
        )
    }

    if (!challanData) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <div className="text-center p-8 border rounded-lg shadow-md">
                    <h2 className="text-xl font-bold">Delivery Note Not Found</h2>
                    <p className="text-muted-foreground">The delivery note you are looking for does not exist.</p>
                </div>
            </div>
        );
    }

    const {
        challanNo, date, toMs, vehicleNo, company, driverName, entries,
        totalPetti, totalDabba, totalNugs, tollTax, payOnlyFreight
    } = challanData;
    
    const A4Layout = () => (
         <div className="w-[146mm] h-[208mm] bg-[#FDFEE2] text-black shadow-lg print:shadow-none p-[6mm] border border-green-700 flex flex-col relative font-serif overflow-hidden">
                <header className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white p-4 rounded-t-xl text-center flex justify-between items-center">
                    <div className="text-sm font-bold">🍎 F.Co</div>
                    <div>
                        <h2 className="text-xl font-bold">FIRDOUS AHMAD & COMPANY</h2>
                        <p className="text-xs">Fruit Merchants & Commission Agents, Sopore</p>
                        <h1 className="text-2xl font-bold mt-2">DELIVERY NOTE</h1>
                    </div>
                    <div className="text-sm font-bold">🍎 F.Co</div>
                </header>

                 <main className="flex-grow bg-white dark:bg-gray-800 p-4 -mt-2 rounded-b-xl shadow-lg">
                    <div className="grid grid-cols-2 gap-4 text-xs border-b pb-2 mb-2">
                        <div className="space-y-1">
                            <p><strong>To, M/s:</strong> {toMs}</p>
                            <p><strong>Vehicle No:</strong> {vehicleNo}</p>
                            <p><strong>Company:</strong> {company}</p>
                            <p><strong>Driver:</strong> {driverName}</p>
                        </div>
                        <div className="text-right space-y-1">
                             <p><strong>Note No:</strong> {challanNo}</p>
                             <p><strong>Dated:</strong> {new Date(date).toLocaleDateString('en-GB')}</p>
                        </div>
                    </div>
                    
                    <Table>
                        <TableHeader>
                            <TableRow className="text-xs">
                                <TableHead>PETI</TableHead>
                                <TableHead>DABA</TableHead>
                                <TableHead>KIND</TableHead>
                                <TableHead>KHATA</TableHead>
                                <TableHead>RATE</TableHead>
                                <TableHead>FREIGHT</TableHead>
                                <TableHead>ADVANCE</TableHead>
                                <TableHead>BALANCE</TableHead>
                                <TableHead>EXP.</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                            {entries.map((entry, index) => (
                                <TableRow key={index} className="h-6">
                                    <TableCell>{entry?.peti || ''}</TableCell>
                                    <TableCell>{entry?.daba || ''}</TableCell>
                                    <TableCell>{entry?.kind || ''}</TableCell>
                                    <TableCell>{entry?.khata || ''}</TableCell>
                                    <TableCell>{entry?.rate || ''}</TableCell>
                                    <TableCell>{entry?.totalFreight || ''}</TableCell>
                                    <TableCell>{entry?.advance || ''}</TableCell>
                                    <TableCell>{entry?.balance || ''}</TableCell>
                                    <TableCell>{entry?.expenditure || ''}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Separator className="my-2" />

                    <div className="grid grid-cols-3 gap-4 text-xs font-semibold">
                        <p>Total Petti: {totalPetti}</p>
                        <p>Total Dabba: {totalDabba}</p>
                        <p>Total Nugs: {totalNugs}</p>
                    </div>

                     <div className="text-xs mt-2 space-y-1">
                        <p>All toll tax paid in cash Rs: {tollTax > 0 ? `₹${tollTax.toFixed(2)}` : '________________'}</p>
                        <p>Pay only Freight Rs: {payOnlyFreight > 0 ? `₹${payOnlyFreight.toFixed(2)}` : '________________'}</p>
                        <p className="italic text-gray-500">Driver will be responsible for any damage or delay of goods.</p>
                    </div>
                </main>
                <footer className="flex justify-between items-end p-4 mt-auto">
                     <div className="text-center text-xs">
                        <div className="w-32 h-10 border-b border-gray-400 border-dotted"></div>
                        <p className="font-semibold">Signature of Driver</p>
                     </div>
                     <div className="text-center text-xs">
                         <p className="font-signature text-2xl text-gray-700 dark:text-gray-300">Faisal</p>
                        <p className="font-bold -mt-2">Sign. Of Manager</p>
                     </div>
                </footer>
            </div>
    );
    
    const ThermalLayout = () => (
        <div className="w-[80mm] bg-white text-black p-2 font-mono text-[10px] leading-tight">
             <header className="text-center space-y-1">
                <h1 className="text-sm font-bold">Firdous Ahmad & Company</h1>
                <p>Fruit Merchants, Sopore</p>
                <p className="border-t border-dashed border-black mt-1 pt-1 font-bold">DELIVERY NOTE</p>
            </header>
             <main className="my-2 border-t border-b border-dashed border-black py-2 space-y-1">
                <div className="flex justify-between"><span>Note No: {challanNo}</span> <span>Date: {new Date(date).toLocaleDateString('en-GB')}</span></div>
                <div>To, M/s: {toMs}</div>
                <div>Vehicle: {vehicleNo}</div>
                <div>Driver: {driverName}</div>
            </main>
             <table className="w-full">
                <thead>
                    <tr className="border-b border-dashed border-black">
                        <th className="text-left">Kind</th>
                        <th className="text-right">Peti</th>
                        <th className="text-right">Daba</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry, i) => (
                        <tr key={i}>
                            <td className="text-left">{entry.kind} ({entry.khata})</td>
                            <td className="text-right">{entry.peti || 0}</td>
                            <td className="text-right">{entry.daba || 0}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
             <div className="my-2 border-t-2 border-black pt-1 space-y-1 text-xs font-bold">
                <div className="flex justify-between"><span>Total Petti:</span><span>{totalPetti}</span></div>
                <div className="flex justify-between"><span>Total Dabba:</span><span>{totalDabba}</span></div>
                <div className="flex justify-between"><span>Total Nugs:</span><span>{totalNugs}</span></div>
            </div>
             <div className="text-xs mt-2 space-y-1 border-t border-dashed pt-2">
                <p>Freight to pay: {payOnlyFreight > 0 ? `₹${payOnlyFreight.toFixed(2)}` : 'N/A'}</p>
                <p className="italic">Driver responsible for goods.</p>
            </div>
            <footer className="text-center pt-4">
                <p>For: Firdous Ahmad & Co.</p>
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
                        margin: 1mm;
                    }
                }
            `}</style>
            
            {!isPublicView ? (
                <div className="print:hidden w-full max-w-xs space-y-4 sticky top-4 self-start">
                    <Controls />
                </div>
             ) : (
                 <div className="print:hidden w-full max-w-xs space-y-4 sticky top-4 self-start">
                    <Button onClick={handleDownloadPdf} size="lg" className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white h-12 text-base">
                        <Download className="h-5 w-5" />
                        Save to Device
                    </Button>
                </div>
            )}

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

