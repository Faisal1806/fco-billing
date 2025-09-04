
'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer } from "lucide-react";
import { FaWhatsapp } from 'react-icons/fa';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";

interface ReceiptData {
    no: string;
    date: string;
    customerName: string;
    ro: string;
    entries: {
        khata: string;
        kind: string;
        peti: number;
        daba: number;
        freight: string;
    }[];
    totalNugs: number;
    freightPaid: number;
    wattakReadyOn: string;
}


export default function ReceiptPage({ params }: { params: { id: string } }) {
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const storedReceipt = localStorage.getItem(`receipt-${params.id}`);
        if (storedReceipt) {
            setReceiptData(JSON.parse(storedReceipt));
        }
        setLoading(false);
    }, [params.id]);


    const handleShare = () => {
        if (receiptData) {
            const message = `Check out this Receipt (#${receiptData.no}) for ${receiptData.customerName}: ${window.location.href}`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        } else {
            toast({ variant: "destructive", title: "Share Failed", description: "Could not share the receipt." });
        }
    };

    const Controls = () => (
        <div className="flex items-center gap-2 print:hidden">
            <Button onClick={handleShare} variant="outline" size="sm" className="gap-2">
                <FaWhatsapp className="h-4 w-4 text-green-500" />
                Share
            </Button>
            <Button onClick={() => window.print()} size="sm" className="gap-2">
                <Printer className="h-4 w-4" />
                Print
            </Button>
        </div>
    )

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen p-8 flex items-center justify-center">
                 <div className="w-[148mm] min-h-[210mm] mx-auto bg-white p-6">
                    <Skeleton className="h-24 w-full mb-4" />
                    <Skeleton className="h-48 w-full" />
                 </div>
            </div>
        )
    }

    if (!receiptData) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <div className="text-center p-8 border rounded-lg shadow-md bg-white">
                    <h2 className="text-xl font-bold">Receipt Not Found</h2>
                    <p className="text-muted-foreground">The receipt you are looking for does not exist.</p>
                </div>
            </div>
        );
    }

    const {
        no, date, customerName, ro, entries,
        totalNugs, freightPaid, wattakReadyOn
    } = receiptData;

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
            <div className="w-[148mm] min-h-[210mm] mx-auto bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg print:shadow-none p-6 flex flex-col">
                <header className="bg-gradient-to-r from-yellow-400 via-orange-500 to-amber-600 text-white p-4 rounded-t-xl shadow-md flex justify-between items-center">
                    <div className="text-2xl">🍎</div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">GOODS RECEIPT</h1>
                        <p className="text-xs">FIRDOUS AHMAD & COMPANY (F.Co)</p>
                    </div>
                    <div className="text-2xl">🍎</div>
                </header>
                <main className="flex-grow bg-white dark:bg-gray-800 p-4 -mt-2 rounded-b-xl shadow-lg">
                     <div className="grid grid-cols-2 gap-2 text-xs border-b pb-2 mb-2">
                        <div>
                            <p><strong>No:</strong> {no}</p>
                            <p><strong>M/s:</strong> {customerName}</p>
                            <p><strong>R/o:</strong> {ro}</p>
                        </div>
                        <div className="text-right">
                             <p><strong>Dated:</strong> {new Date(date).toLocaleDateString('en-GB')}</p>
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="text-xs">
                                <TableHead>KHATA</TableHead>
                                <TableHead>KIND</TableHead>
                                <TableHead>PETI</TableHead>
                                <TableHead>DABA</TableHead>
                                <TableHead>FREIGHT</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                            {entries.map((entry, index) => (
                                <TableRow key={index} className="h-8">
                                    <TableCell>{entry?.khata || ''}</TableCell>
                                    <TableCell>{entry?.kind || ''}</TableCell>
                                    <TableCell>{entry?.peti || ''}</TableCell>
                                    <TableCell>{entry?.daba || ''}</TableCell>
                                    <TableCell>{entry?.freight || ''}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                        <div>
                           <p>Freight Paid Rs: {freightPaid > 0 ? `₹${freightPaid.toFixed(2)}` : ''}</p>
                           <p>Wattak Ready On: {wattakReadyOn}</p>
                        </div>
                        <div className="text-right">
                           <p>Total Nugs: {totalNugs}</p>
                        </div>
                    </div>
                </main>
                <footer className="flex justify-between items-end p-4 mt-auto text-xs print:pt-2">
                     <Controls />
                     <div className="text-center">
                        <p className="font-signature text-2xl text-gray-700 dark:text-gray-300">Faisal</p>
                        <p className="font-bold">Sign. Of Manager</p>
                     </div>
                </footer>
            </div>
        </div>
    );
}
