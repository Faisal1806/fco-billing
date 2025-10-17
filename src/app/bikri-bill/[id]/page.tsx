
'use client'

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Download, FileText } from "lucide-react";
import { FaWhatsapp } from 'react-icons/fa';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode.react';

interface Entry {
    type: 'Patti' | 'Dabba';
    qty: number;
    variety: string;
    rate: number;
    total: number;
}
interface BikriData {
    id: string;
    challanNo: string;
    bikriNo: string;
    date: string;
    market: string;
    growerName?: string;
    bikriType?: 'fcoStock' | 'growerForwarding';
    purchaseEntries: Entry[];
    saleEntries: Entry[];
    expenses: number;
    commissionRate: number;
    freightPerPatti: number;
    calculation: {
        totalPurchaseCost: number;
        grossSale: number;
        commissionAmount: number;
        calculatedFreight: number;
        totalExpenses: number;
        netSale?: number;
        netProfitOrLoss?: number;
        netSalePayableToGrower?: number;
    }
}


export default function BikriBillPage({ params }: { params: { id: string } }) {
    const [billData, setBillData] = useState<BikriData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const printRef = useRef<HTMLDivElement>(null);
    const [pageUrl, setPageUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPageUrl(window.location.href);
        }
        const fetchBill = () => {
             if (!params.id) {
                setLoading(false);
                return;
            };
            setLoading(true);

            let data: BikriData | null = null;
            const storedBill = localStorage.getItem(`bikri-${params.id}`);
            if (storedBill) {
                data = JSON.parse(storedBill);
            }
            
            if (data) {
                setBillData(data);
            } else {
                toast({
                    variant: "destructive",
                    title: "Bikri Not Found",
                    description: "The requested outside sale was not found on this device."
                });
            }
            
            setLoading(false);
        };
        fetchBill();
    }, [params.id, toast]);

    const handleShare = () => {
        if (billData) {
            const message = `Check out this Bikri Bill (#${billData.bikriNo}) for ${billData.market}: ${window.location.href}`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        } else {
            toast({ variant: "destructive", title: "Share Failed", description: "Could not share the bill." });
        }
    };
    
    const handleDownloadPdf = () => {
        const element = printRef.current;
        if (!element || !billData) return;
    
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
    
        doc.html(element, {
            callback: function (doc) {
                doc.save(`Bikri-Bill-${billData.bikriNo}.pdf`);
            },
            x: 10,
            y: 10,
            width: 190,
            windowWidth: element.scrollWidth
        });
    };

    const Controls = () => (
         <div className="flex flex-col gap-4 print:hidden">
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
                <QRCode value={pageUrl} size={60} />
                <p className="text-xs font-semibold mt-1">Scan to View</p>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="bg-muted min-h-screen p-8 flex items-center justify-center">
                 <div className="w-full max-w-4xl mx-auto bg-white p-6">
                    <Skeleton className="h-24 w-full mb-4" />
                    <Skeleton className="h-48 w-full" />
                 </div>
            </div>
        )
    }

    if (!billData) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <div className="text-center p-8 border rounded-lg shadow-md">
                    <h2 className="text-xl font-bold">Bikri Not Found</h2>
                    <p className="text-muted-foreground">The outside sale you are looking for does not exist.</p>
                </div>
            </div>
        );
    }
    
    const isForwarding = billData.bikriType === 'growerForwarding';

    const EntryTable = ({ title, entries } : { title: string, entries: Entry[]}) => (
        <div>
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Variety</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entries.map((e, i) => (
                        <TableRow key={i}>
                            <TableCell>{e.type}</TableCell>
                            <TableCell>{e.variety}</TableCell>
                            <TableCell className="text-right">{e.qty}</TableCell>
                            <TableCell className="text-right">₹{e.rate.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">₹{e.total.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );


    return (
        <div className="bg-gray-100 dark:bg-gray-900 font-sans print:bg-white flex flex-col md:flex-row gap-8 justify-center p-4 md:p-8">
            <div className="print:hidden w-full max-w-xs space-y-4">
                <Controls />
            </div>

            <div ref={printRef} className="w-full max-w-4xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg print:shadow-none p-8">
                <header className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-primary">Outside Sale (Bikri) Statement</h1>
                    <p className="text-muted-foreground">Firdous Ahmad & Company, Sopore</p>
                </header>
                
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-y py-4 my-6">
                    <p><strong>Challan No:</strong> {billData.challanNo}</p>
                    <p><strong>Bikri No:</strong> {billData.bikriNo}</p>
                    <p><strong>Date:</strong> {new Date(billData.date).toLocaleDateString('en-GB')}</p>
                    {isForwarding ? (
                         <p><strong>Grower:</strong> {billData.growerName}</p>
                    ) : (
                        <p><strong>Market:</strong> {billData.market}</p>
                    )}
                </div>

                <div className="space-y-8">
                    {!isForwarding && billData.purchaseEntries.length > 0 && (
                        <EntryTable title="Original Purchase Cost (Sopore)" entries={billData.purchaseEntries} />
                    )}
                    <EntryTable title="Sale Details (from Bikri)" entries={billData.saleEntries} />
                </div>
                
                <Separator className="my-8" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                        <h3 className="text-lg font-bold mb-2">Expenses</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Calculated Freight:</span> <span className="font-mono">₹{billData.calculation.calculatedFreight.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Commission ({billData.commissionRate}%):</span> <span className="font-mono">₹{billData.calculation.commissionAmount.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Other Expenses:</span> <span className="font-mono">₹{billData.expenses.toFixed(2)}</span></div>
                            <Separator className="my-1"/>
                            <div className="flex justify-between font-bold"><span>Total Expenses:</span> <span className="font-mono">₹{billData.calculation.totalExpenses.toFixed(2)}</span></div>
                        </div>
                    </div>
                     <div className="bg-muted p-4 rounded-lg">
                        <h3 className="text-lg font-bold mb-2">Final Calculation</h3>
                        {isForwarding ? (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Gross Sale:</span> <span className="font-mono font-medium">₹{billData.calculation.grossSale.toFixed(2)}</span></div>
                                <div className="flex justify-between text-destructive"><span>(-) Total Expenses:</span> <span className="font-mono font-medium">₹{billData.calculation.totalExpenses.toFixed(2)}</span></div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-xl text-green-600">
                                    <span>Net Sale Payable:</span>
                                    <span>₹{billData.calculation.netSalePayableToGrower?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>
                        ) : (
                             <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Gross Sale:</span> <span className="font-mono font-medium">₹{billData.calculation.grossSale.toFixed(2)}</span></div>
                                <div className="flex justify-between text-destructive"><span>(-) Total Purchase Cost:</span> <span className="font-mono font-medium">₹{billData.calculation.totalPurchaseCost.toFixed(2)}</span></div>
                                <div className="flex justify-between text-destructive"><span>(-) Total Expenses:</span> <span className="font-mono font-medium">₹{billData.calculation.totalExpenses.toFixed(2)}</span></div>
                                <Separator className="my-2" />
                                <div className={`flex justify-between font-bold text-xl ${billData.calculation.netProfitOrLoss && billData.calculation.netProfitOrLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    <span>Net Profit / Loss:</span>
                                    <span>₹{billData.calculation.netProfitOrLoss?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <footer className="text-center text-xs text-muted-foreground mt-12">
                     <p>This is a computer-generated statement and does not require a signature.</p>
                     <p>F.Co - Your Trusted Partner in Fruit Trading</p>
                </footer>
            </div>
        </div>
    );
}
