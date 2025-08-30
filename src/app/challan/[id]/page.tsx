
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
                <Button onClick={handleShare} variant="outline" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                </Button>
                <Button onClick={() => window.print()} className="gap-2">
                    <Printer className="h-4 w-4" />
                    Print
                </Button>
            </div>
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
        <div className="bg-white min-h-screen p-4 sm:p-6 md:p-8 print:bg-white font-sans">
            <Card className="w-full max-w-4xl mx-auto shadow-none border print:shadow-none print:border">
                <CardHeader className="p-4 relative">
                    <div className="text-center mb-4">
                        <h1 className="text-2xl font-bold text-gray-800">FIRDOUS AHMAD & COMPANY</h1>
                        <p className="text-xs text-gray-600">Fruit Merchants & Commission Agents</p>
                        <p className="text-xs text-gray-600">SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.</p>
                        <p className="text-xs text-gray-600">Prop: Firdous Ahmad Lone (Nadihal)</p>
                        <p className="text-xs text-gray-600">Cell: 7006136330, 9797002164</p>
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
                </CardHeader>
                <CardContent className="p-2">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[5%]">PETI</TableHead>
                                <TableHead className="w-[5%]">DABA</TableHead>
                                <TableHead>KIND</TableHead>
                                <TableHead>KHATA</TableHead>
                                <TableHead className="w-[8%]">RATE</TableHead>
                                <TableHead className="w-[8%]">TOTAL FREIGHT</TableHead>
                                <TableHead className="w-[8%]">ADVANCE</TableHead>
                                <TableHead className="w-[8%]">BALANCE</TableHead>
                                <TableHead className="w-[8%]">EXPENDITURE</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 15 }).map((_, index) => {
                                const entry = entries[index];
                                return (
                                <TableRow key={index} className="h-8">
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
                                )
                            })}
                        </TableBody>
                    </Table>

                    <Separator className="my-2" />

                    <div className="grid grid-cols-3 gap-4 text-xs mt-2 px-2 font-medium">
                        <p>Total Petti: {totalPetti}</p>
                        <p>Total Dabba: {totalDabba}</p>
                        <p>Total Nugs: {totalNugs}</p>
                    </div>

                     <div className="text-xs mt-4 px-2">
                        <p>All toll tax paid in cash Rs: {tollTax > 0 ? tollTax.toFixed(2) : '__________'}</p>
                        <p>Pay only Freight Rs: {payOnlyFreight > 0 ? payOnlyFreight.toFixed(2) : '__________'}</p>
                        <p className="mt-2">in good condition and driver will be responsible for any damage, delay of goods</p>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-end p-4 mt-8">
                     <Controls />
                     <div className="flex flex-col items-center">
                        <div className="w-32 h-8 border-t border-gray-400"></div>
                        <p className="text-xs font-semibold">Signature of Driver</p>
                     </div>
                     <div className="flex flex-col items-center">
                        <p>Received all goods</p>
                        <div className="w-32 h-8 border-t border-gray-400 mt-1"></div>
                        <p className="text-xs font-semibold">Signature of Manager</p>
                     </div>
                </CardFooter>
            </Card>
        </div>
    );
}
