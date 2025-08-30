'use client'

import * as React from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  PlusCircle,
  Upload,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { products } from '@/lib/data';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';

export default function SalesPage() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [cart, setCart] = React.useState<typeof products>([]);
    const [isSaleComplete, setIsSaleComplete] = React.useState(false);

    const handleAddToCart = () => {
        if(products.length > cart.length) {
            setCart([...cart, products[cart.length]]);
        }
    }

    const handleCompleteSale = () => {
        if (cart.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Cart is empty',
                description: 'Please add products to the cart before completing the sale.',
            });
            return;
        }
        setIsSaleComplete(true);
    }

    const subtotal = cart.reduce((acc, product) => acc + product.price, 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;


  if (isSaleComplete) {
    return (
        <div className="flex min-h-[calc(100vh-8rem)] flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">{t('sale_successful')}</h3>
            <p className="text-sm text-muted-foreground">{t('sale_successful_subtitle')}</p>
            <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => { setCart([]); setIsSaleComplete(false); }}>{t('new_sale')}</Button>
                <Link href="/invoice/123" passHref>
                    <Button>{t('view_invoice')}</Button>
                </Link>
            </div>
          </div>
        </div>
    )
  }

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>{t('new_sale')}</CardTitle>
                    <CardDescription>{t('new_sale_subtitle')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6">
                    <div className="grid gap-3">
                        <Label htmlFor="product">{t('products')}</Label>
                        <div className="flex gap-2">
                        <Select>
                            <SelectTrigger id="product" aria-label="Select product">
                            <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAddToCart}>{t('add_to_cart')}</Button>
                        </div>
                    </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>{t('products')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('product_name')}</TableHead>
                                <TableHead>{t('quantity')}</TableHead>
                                <TableHead className="text-right">{t('price')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cart.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>1</TableCell>
                                    <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                             {cart.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                                        Cart is empty
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        <div>
            <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                        <span>{t('subtotal')}</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>{t('tax')} (5%)</span>
                        <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold text-lg">
                        <span>{t('total')}</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleCompleteSale}>{t('complete_sale')}</Button>
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}
