
'use client'

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Download } from "lucide-react";
import { FaWhatsapp } from 'react-icons/fa';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


interface ChallanData {
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


export default function ChallanPage({ params }: { params: { id: string } }) {
    const [challanData, setChallanData] = useState<ChallanData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchChallan = () => {
             if (!params.id) {
                setLoading(false);
                return;
            };
            setLoading(true);

            let data: ChallanData | null = null;
            const storedChallan = localStorage.getItem(`challan-${params.id}`);
            if (storedChallan) {
                data = JSON.parse(storedChallan);
            }
            
            if (data) {
                setChallanData(data);
            } else {
                toast({
                    variant: "destructive",
                    title: "Challan Not Found",
                    description: "The requested challan was not found on this device."
                });
            }
            
            setLoading(false);
        };
        fetchChallan();
    }, [params.id, toast]);

    const handleShare = () => {
        if (challanData) {
            const message = `Check out this Challan (#${challanData.challanNo}) for ${challanData.toMs}: ${window.location.href}`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        } else {
            toast({ variant: "destructive", title: "Share Failed", description: "Could not share the challan." });
        }
    };
    
    const handleDownloadPdf = async () => {
        const element = printRef.current;
        if (!element || !challanData) return;

        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
        });

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a5'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Challan-${challanData.challanNo}.pdf`);
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
            <div className="bg-muted min-h-screen p-8 flex items-center justify-center">
                 <div className="w-[148mm] min-h-[210mm] mx-auto bg-white p-6">
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
                    <h2 className="text-xl font-bold">Challan Not Found</h2>
                    <p className="text-muted-foreground">The challan you are looking for does not exist.</p>
                </div>
            </div>
        );
    }

    const {
        challanNo, date, toMs, vehicleNo, company, driverName, entries,
        totalPetti, totalDabba, totalNugs, tollTax, payOnlyFreight
    } = challanData;

    return (
        <div className="bg-gray-100 dark:bg-gray-900 font-sans print:bg-white">
             <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
                .font-signature {
                    font-family: 'Dancing Script', cursive;
                }
                @media print {
                    @page {
                        size: A5 portrait;
                        margin: 0;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
            <div ref={printRef} className="w-[148mm] min-h-[210mm] mx-auto bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg print:shadow-none p-6 flex flex-col">
                <header className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white p-4 rounded-t-xl text-center flex justify-between items-center">
                    <div className="text-sm font-bold">🍎 F.Co</div>
                    <div>
                        <h2 className="text-xl font-bold">FIRDOUS AHMAD & COMPANY</h2>
                        <p className="text-xs">Fruit Merchants & Commission Agents, Sopore</p>
                        <h1 className="text-2xl font-bold mt-2">CHALLAN</h1>
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
                             <p><strong>Challan No:</strong> {challanNo}</p>
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
                     <Controls />
                     <div className="text-center text-xs">
                        <div className="w-32 h-10 border-b border-gray-400 border-dotted"></div>
                        <p className="font-semibold">Signature of Driver</p>
                     </div>
                     <div className="text-center text-xs">
                         <p className="font-signature text-2xl text-gray-700 dark:text-gray-300">Faisal</p>
                        <p className="font-bold">Sign. Of Manager</p>
                     </div>
                </footer>
            </div>
        </div>
    );
}

    
