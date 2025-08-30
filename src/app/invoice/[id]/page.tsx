
'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BillData {
    sNo: string;
    date: string;
    customerName: string;
    challanNo: string;
    onAcOf: string;
    entries: {
        peti: number;
        dabba: number;
        variety: string;
        noAndTeh: string;
        rate: number;
    }[];
    grossSale: number;
    commissionAmount: number;
    freight: number;
    labour: number;
    security: number;
    otherExpenses: number;
    totalExpenses: number;
    netSale: number;
}


export default function InvoicePage({ params }: { params: { id: string } }) {
    const [billData, setBillData] = useState<BillData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedBill = localStorage.getItem(`invoice-${params.id}`);
        if (storedBill) {
            setBillData(JSON.parse(storedBill));
        }
        setLoading(false);
    }, [params.id]);


    const PrintButton = () => {
        'use client'
        return (
            <Button onClick={() => window.print()} className="gap-2 print:hidden">
                <Printer className="h-4 w-4" />
                Print Invoice
            </Button>
        )
    }

    if (loading) {
        return (
            <div className="bg-background min-h-screen p-4 sm:p-8 md:p-12">
                 <Card className="w-full max-w-4xl mx-auto">
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-48 w-full" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-32" />
                    </CardFooter>
                 </Card>
            </div>
        )
    }

    if (!billData) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md mx-auto text-center">
                    <CardHeader>
                        <CardTitle>Invoice Not Found</CardTitle>
                        <CardDescription>The invoice you are looking for does not exist or has been deleted.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const {
        sNo, date, customerName, challanNo, onAcOf, entries,
        grossSale, commissionAmount, freight, labour, security, otherExpenses, totalExpenses, netSale
    } = billData;

    const totalQty = entries.reduce((acc, entry) => acc + entry.peti + entry.dabba, 0);

    return (
        <div className="bg-white min-h-screen p-4 sm:p-8 md:p-12 print:bg-white">
            <Card className="w-full max-w-4xl mx-auto shadow-none border-none print:shadow-none print:border-none">
                <CardHeader>
                    <div className="text-center mb-4">
                        <h1 className="text-3xl font-bold text-gray-800">FIRDOUS AHMAD & COMPANY</h1>
                        <p className="text-sm text-gray-600">Fruit Merchants & Commission Agents</p>
                        <p className="text-sm text-gray-600">SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.</p>
                        <p className="text-sm text-gray-600">Cell: 7006136330, 9797002164</p>
                    </div>
                     <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p><strong>S.No:</strong> {sNo}</p>
                            <p><strong>M/s:</strong> {customerName}</p>
                            <p><strong>On A/c of:</strong> {onAcOf}</p>
                        </div>
                        <div className="text-right">
                             <p><strong>Date:</strong> {new Date(date).toLocaleDateString()}</p>
                             <p><strong>Challan No:</strong> {challanNo}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-[2fr_1fr] gap-4">
                        <div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Peti</TableHead>
                                        <TableHead>Dabba</TableHead>
                                        <TableHead>Variety</TableHead>
                                        <TableHead>Rate</TableHead>
                                        <TableHead className="text-right">Gross Sale</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entries.map((entry, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{entry.peti}</TableCell>
                                            <TableCell>{entry.dabba}</TableCell>
                                            <TableCell>{entry.variety}</TableCell>
                                            <TableCell>{entry.rate.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">₹{((entry.peti + entry.dabba) * entry.rate).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Details of Exp.</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow><TableCell>Freight</TableCell><TableCell className="text-right">₹{freight.toFixed(2)}</TableCell></TableRow>
                                    <TableRow><TableCell>Labour</TableCell><TableCell className="text-right">₹{labour.toFixed(2)}</TableCell></TableRow>
                                    <TableRow><TableCell>Commission</TableCell><TableCell className="text-right">₹{commissionAmount.toFixed(2)}</TableCell></TableRow>
                                    <TableRow><TableCell>Security</TableCell><TableCell className="text-right">₹{security.toFixed(2)}</TableCell></TableRow>
                                    <TableRow><TableCell>Other</TableCell><TableCell className="text-right">₹{otherExpenses.toFixed(2)}</TableCell></TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-3 gap-4 text-sm font-medium">
                        <div className="flex items-center">
                            <p>Total Qty: {totalQty}</p>
                        </div>
                        <div className="flex justify-between items-center px-4 py-2 bg-gray-100 rounded-md">
                           <p>Total Gross Sale:</p>
                           <p>₹{grossSale.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center px-4 py-2 bg-gray-100 rounded-md">
                           <p>Total Exp.:</p>
                           <p>₹{totalExpenses.toFixed(2)}</p>
                        </div>
                    </div>
                     <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                            <p className="font-semibold">Debit Our A/C</p>
                            <p className="text-xs text-gray-500">"Your Satisfaction is Our Success"</p>
                        </div>
                        <div className="col-span-2 flex justify-between items-center px-4 py-2 bg-gray-200 rounded-md">
                            <p className="text-lg font-bold">Net Sale:</p>
                            <p className="text-lg font-bold">₹{netSale.toFixed(2)}</p>
                        </div>
                     </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center mt-8">
                     <p className="text-xs text-gray-500">Subject to Sopore Jurisdiction Only</p>
                     <p className="font-semibold">Manager</p>
                     <PrintButton />
                </CardFooter>
            </Card>
        </div>
    );
}

