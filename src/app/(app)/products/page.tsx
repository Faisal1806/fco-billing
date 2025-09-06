
'use client'

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { PlusCircle, Edit, Trash2, Package, Apple, Box } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';

interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  unitType?: string;
  varietyGrade?: string;
  rateRange?: string;
  batchNo?: string;
  expiryDate?: string;
  supplier?: string;
  reorderLevel?: number;
  notes?: string;
}

const emptyFormState: Omit<Product, 'id'> = {
    name: '',
    category: '',
    stock: 0,
    unitType: '',
    varietyGrade: '',
    rateRange: '',
    batchNo: '',
    expiryDate: '',
    supplier: '',
    reorderLevel: 0,
    notes: '',
}

export default function ProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState<Product | Omit<Product, 'id'>>(emptyFormState);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
        setUserRole(localStorage.getItem('userRole'));
    }
  }, []);

  const fetchProducts = () => {
    if (typeof window === 'undefined') return;
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('product-')) {
        items.push(JSON.parse(localStorage.getItem(key)!));
      }
    }
    setProducts(items);
  };

  useEffect(() => {
    if (isClient) {
      fetchProducts();
    }
  }, [isClient]);

  const { fruitProducts, accessoryProducts } = useMemo(() => {
    const fruits: Product[] = [];
    const accessories: Product[] = [];
    products.forEach(p => {
        const lowerCat = p.category.toLowerCase();
        if (['fruit', 'apple', 'pear', 'nakh', 'gosha', 'red delicious', 'american', 'gala mast', 'shimla'].includes(lowerCat)) {
            fruits.push(p);
        } else {
            accessories.push(p);
        }
    });
    return { fruitProducts: fruits, accessoryProducts: accessories };
  }, [products]);
  
  const resetForm = () => {
    setFormState(emptyFormState);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? Number(value) : value;
    setFormState(prev => ({...prev, [name]: val}));
  };

  const handleSaveProduct = () => {
    if (!formState.name || !formState.category) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Product Name and Category are required.',
      });
      return;
    }

    const id = 'id' in formState ? formState.id : `product-${Date.now()}`;
    const newProduct: Product = { id, ...formState } as Product;

    localStorage.setItem(id, JSON.stringify(newProduct));
    toast({
      title: 'id' in formState ? 'Product Updated' : 'Product Added',
      description: `${formState.name} has been saved.`,
    });
    
    fetchProducts();
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEditClick = (product: Product) => {
    setFormState(product);
    setIsDialogOpen(true);
  }
  
  const handleDeleteProduct = (id: string) => {
    if(userRole !== 'admin') {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'You cannot delete products.' });
      return;
    }
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    localStorage.removeItem(id);
    toast({
      title: 'Product Deleted',
      description: 'The product has been removed.',
    });
    fetchProducts();
  }
  
  const ProductTable = ({ products, title, icon }: { products: Product[], title: string, icon: React.ReactNode }) => (
    <div className="mb-4">
        {products.length > 0 ? (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Variety/Grade</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.varietyGrade}</TableCell>
                  <TableCell>{product.unitType}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {userRole === 'admin' && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No products in this category yet.</p>
        )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Products & Inventory</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
              setIsDialogOpen(isOpen);
              if (!isOpen) {
                resetForm();
              }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{'id' in formState ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" value={formState.name} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" name="category" value={formState.category} onChange={handleInputChange} placeholder="e.g., Fruit, Pesticide, Fertilizer" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="unitType">Unit Type</Label>
                        <Input id="unitType" name="unitType" value={formState.unitType || ''} onChange={handleInputChange} placeholder="e.g., kg, box, patti, liter, piece" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="varietyGrade">Variety/Grade</Label>
                        <Input id="varietyGrade" name="varietyGrade" value={formState.varietyGrade || ''} onChange={handleInputChange} placeholder="e.g., Extraordinary, Standard" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rateRange">Rate Range</Label>
                        <Input id="rateRange" name="rateRange" value={formState.rateRange || ''} onChange={handleInputChange} placeholder="e.g., 500-600" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="stock">Stock Quantity</Label>
                        <Input id="stock" name="stock" type="number" value={formState.stock || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="batchNo">Batch No. (for chemicals)</Label>
                        <Input id="batchNo" name="batchNo" value={formState.batchNo || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date (for chemicals)</Label>
                        <Input id="expiryDate" name="expiryDate" type="date" value={formState.expiryDate || ''} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="supplier">Supplier / Company</Label>
                        <Input id="supplier" name="supplier" value={formState.supplier || ''} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="reorderLevel">Reorder Level</Label>
                        <Input id="reorderLevel" name="reorderLevel" type="number" value={formState.reorderLevel || ''} onChange={handleInputChange} placeholder="Alert when stock drops to this level" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" name="notes" value={formState.notes || ''} onChange={handleInputChange} />
                    </div>
                  </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleSaveProduct}>Save Product</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          Manage your product inventory, track stock levels, and receive low-stock alerts here.
        </CardDescription>
      </CardHeader>
      <CardContent>
         {isClient && products.length > 0 ? (
            <Accordion type="multiple" defaultValue={['fruits', 'accessories']} className="w-full">
                <AccordionItem value="fruits">
                    <AccordionTrigger>
                        <h2 className="text-xl font-semibold flex items-center gap-2"><Apple className="h-5 w-5 text-red-500" /> Fruits ({fruitProducts.length})</h2>
                    </AccordionTrigger>
                    <AccordionContent>
                       <ProductTable products={fruitProducts} title="" icon={null} />
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="accessories">
                    <AccordionTrigger>
                        <h2 className="text-xl font-semibold flex items-center gap-2"><Box className="h-5 w-5 text-blue-500" /> Accessories ({accessoryProducts.length})</h2>
                    </AccordionTrigger>
                    <AccordionContent>
                        <ProductTable products={accessoryProducts} title="" icon={null} />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
         ) : (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <Package className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">No products found.</h3>
            <p className="mt-1 text-sm">Get started by adding your first product.</p>
             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
                setIsDialogOpen(isOpen);
                if (!isOpen) {
                    resetForm();
                }
             }}>
                <DialogTrigger asChild>
                <Button size="sm" className="mt-4 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    Add Your First Product
                </Button>
                </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                    <DialogTitle>{'id' in formState ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" name="name" value={formState.name} onChange={handleInputChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">Category</Label>
                    <Input id="category" name="category" value={formState.category} onChange={handleInputChange} className="col-span-3" placeholder="e.g., Fruit, Pesticide, Fertilizer" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="stock" className="text-right">Stock</Label>
                    <Input id="stock" name="stock" type="number" value={formState.stock || ''} onChange={handleInputChange} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSaveProduct}>Save Product</Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    