'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/contexts/language-context";
import { Printer } from "lucide-react";

export default function InvoicePage({ params }: { params: { id: string } }) {
    const { t } = useLanguage();

    const subtotal = 89.99;
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    const PrintButton = () => {
        'use client'
        return (
            <Button onClick={() => window.print()} className="gap-2 print:hidden">
                <Printer className="h-4 w-4" />
                {t('print_invoice')}
            </Button>
        )
    }

    return (
        <div className="bg-background min-h-screen p-4 sm:p-8 md:p-12">
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">{t('app_title')}</h1>
                        <p className="text-muted-foreground">{t('invoice_receipt')}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold">{t('invoice')} #{params.id}</h2>
                        <p className="text-muted-foreground">{t('date')}: {new Date().toLocaleDateString()}</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="font-semibold mb-2">{t('bill_to')}</h3>
                            <p>Bilal Ahmed</p>
                            <p>123 Gulberg, Lahore</p>
                            <p>Pakistan</p>
                            <p>bilal@example.com</p>
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('item')}</TableHead>
                                <TableHead className="text-center">{t('quantity')}</TableHead>
                                <TableHead className="text-right">{t('price')}</TableHead>
                                <TableHead className="text-right">{t('amount')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>Wireless Bluetooth Headphones</TableCell>
                                <TableCell className="text-center">1</TableCell>
                                <TableCell className="text-right">$89.99</TableCell>
                                <TableCell className="text-right">$89.99</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    <Separator className="my-8" />
                    <div className="grid grid-cols-2 gap-4 ms-auto max-w-sm">
                        <div className="text-muted-foreground">{t('subtotal')}</div>
                        <div className="text-right font-medium">${subtotal.toFixed(2)}</div>
                        <div className="text-muted-foreground">{t('tax')} (5%)</div>
                        <div className="text-right font-medium">${tax.toFixed(2)}</div>
                        <div className="font-semibold text-lg">{t('total')}</div>
                        <div className="text-right font-semibold text-lg">${total.toFixed(2)}</div>
                    </div>
                </CardContent>
                <CardFooter className="justify-between items-center">
                    <p className="text-muted-foreground text-sm">{t('thank_you')}</p>
                    <PrintButton />
                </CardFooter>
            </Card>
        </div>
    );
}
