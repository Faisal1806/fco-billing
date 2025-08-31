
'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

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

    useEffect(() => {
        const storedChallan = localStorage.getItem(`challan-${params.id}`);
        if (storedChallan) {
            setChallanData(JSON.parse(storedChallan));
        }
        setLoading(false);
    }, [params.id]);

    const handleShare = async () => {
        if (navigator.share && challanData) {
            try {
                await navigator.share({
                    title: `Challan for ${challanData.toMs}`,
                    text: `Here is the challan #${challanData.challanNo}.`,
                    url: window.location.href,
                });
                toast({ title: "Challan Shared", description: "The challan link has been shared." });
            } catch (error) {
                toast({ variant: "destructive", title: "Share Failed", description: "Could not share the challan." });
            }
        } else {
             try {
                await navigator.clipboard.writeText(window.location.href);
                toast({ title: "Link Copied", description: "Challan link copied to clipboard." });
            } catch (error) {
                 toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy the link." });
            }
        }
    };

    const Controls = () => {
        'use client'
        return (
             <div className="flex items-center gap-2 print:hidden">
                <Button onClick={handleShare} variant="outline" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                </Button>
                <Button onClick={() => window.print()} size="sm" className="gap-2">
                    <Printer className="h-4 w-4" />
                    Print
                </Button>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="bg-muted min-h-screen p-8 flex items-center justify-center">
                 <Card className="w-[148mm] h-[210mm] mx-auto p-6 flex flex-col">
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <Skeleton className="h-full w-full" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-32" />
                    </CardFooter>
                 </Card>
            </div>
        )
    }

    if (!challanData) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md mx-auto text-center">
                    <CardHeader>
                        <CardTitle>Challan Not Found</CardTitle>
                        <CardDescription>The challan you are looking for does not exist or has been deleted.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const {
        challanNo, date, toMs, vehicleNo, company, driverName, entries,
        totalPetti, totalDabba, totalNugs, tollTax, payOnlyFreight
    } = challanData;

    return (
        <div className="bg-muted min-h-screen py-8 print:bg-white print:py-0">
             <style jsx global>{`
                @media print {
                    @page {
                        size: A5 landscape;
                        margin: 0;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
            <div className="w-[210mm] min-h-[148mm] mx-auto bg-white shadow-lg print:shadow-none flex flex-col text-sm">
                <header className="p-4 border-b">
                    <div className="text-center mb-4">
                        <h1 className="text-xl font-bold text-gray-800">FIRDOUS AHMAD & COMPANY</h1>
                        <p className="text-xs text-gray-600">Fruit Merchants & Commission Agents</p>
                        <p className="text-xs text-gray-600">SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.</p>
                        <p className="text-xs text-gray-600">Prop: Firdous Ahmad Lone (Nadihal)</p>
                        <p className="text-xs text-gray-600">Cell: 7006136330, 9797002164, 9906740921 | Email: lone07936@gmail.com</p>
                    </div>
                     <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <p><strong>To, M/s:</strong> {toMs}</p>
                            <p><strong>Vehicle No:</strong> {vehicleNo}</p>
                            <p><strong>Company:</strong> {company}</p>
                            <p><strong>Name of Driver:</strong> {driverName}</p>
                        </div>
                        <div className="text-right">
                             <p><strong>Challan:</strong> {challanNo}</p>
                             <p><strong>Dated:</strong> {new Date(date).toLocaleDateString()}</p>
                        </div>
                    </div>
                </header>
                <main className="flex-grow p-2">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[5%] px-1 py-1 h-auto">PETI</TableHead>
                                <TableHead className="w-[5%] px-1 py-1 h-auto">DABA</TableHead>
                                <TableHead className="px-1 py-1 h-auto">KIND</TableHead>
                                <TableHead className="px-1 py-1 h-auto">KHATA</TableHead>
                                <TableHead className="w-[8%] px-1 py-1 h-auto">RATE</TableHead>
                                <TableHead className="w-[10%] px-1 py-1 h-auto">TOTAL FREIGHT</TableHead>
                                <TableHead className="w-[8%] px-1 py-1 h-auto">ADVANCE</TableHead>
                                <TableHead className="w-[8%] px-1 py-1 h-auto">BALANCE</TableHead>
                                <TableHead className="w-[8%] px-1 py-1 h-auto">EXPENDITURE</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 15 }).map((_, index) => {
                                const entry = entries[index];
                                return (
                                <TableRow key={index} className="h-6">
                                    <TableCell className="px-1 py-0">{entry?.peti || ''}</TableCell>
                                    <TableCell className="px-1 py-0">{entry?.daba || ''}</TableCell>
                                    <TableCell className="px-1 py-0">{entry?.kind || ''}</TableCell>
                                    <TableCell className="px-1 py-0">{entry?.khata || ''}</TableCell>
                                    <TableCell className="px-1 py-0 text-right">{entry?.rate || ''}</TableCell>
                                    <TableCell className="px-1 py-0 text-right">{entry?.totalFreight || ''}</TableCell>
                                    <TableCell className="px-1 py-0 text-right">{entry?.advance || ''}</TableCell>
                                    <TableCell className="px-1 py-0 text-right">{entry?.balance || ''}</TableCell>
                                    <TableCell className="px-1 py-0 text-right">{entry?.expenditure || ''}</TableCell>
                                </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>

                    <Separator className="my-1" />

                    <div className="grid grid-cols-3 gap-4 text-[10px] mt-1 px-2 font-medium">
                        <p>Total Petti: {totalPetti}</p>
                        <p>Total Dabba: {totalDabba}</p>
                        <p>Total Nugs: {totalNugs}</p>
                    </div>

                     <div className="text-[10px] mt-2 px-2">
                        <p>All toll tax paid in cash Rs: {tollTax > 0 ? tollTax.toFixed(2) : '__________'}</p>
                        <p>Pay only Freight Rs: {payOnlyFreight > 0 ? payOnlyFreight.toFixed(2) : '__________'}</p>
                        <p className="mt-1">in good condition and driver will be responsible for any damage, delay of goods</p>
                    </div>
                </main>
                <footer className="flex justify-between items-end p-2 mt-auto">
                     <Controls />
                     <div className="flex flex-col items-center">
                        <div className="w-24 h-6 border-t border-gray-400"></div>
                        <p className="text-[10px] font-semibold">Signature of Driver</p>
                     </div>
                     <div className="flex flex-col items-center text-[10px]">
                        <p>Received all goods</p>
                        <div className="w-24 h-6 border-t border-gray-400 mt-1"></div>
                        <p className="font-semibold">Signature of Manager</p>
                     </div>
                </footer>
            </div>
        </div>
    );
}
