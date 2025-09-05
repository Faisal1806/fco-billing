
'use client'

import React, { useState, useEffect } from 'react';
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
import { PlusCircle, Edit, Trash2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
}

export default function ProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  // Form state
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState(0);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
  
  const resetForm = () => {
    setProductId(null);
    setProductName('');
    setCategory('');
    setStock(0);
  }

  const handleSaveProduct = () => {
    if (!productName || !category) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Product Name and Category are required.',
      });
      return;
    }

    const id = productId || `product-${Date.now()}`;
    const newProduct: Product = {
      id,
      name: productName,
      category,
      stock: Number(stock) || 0,
    };

    localStorage.setItem(id, JSON.stringify(newProduct));
    toast({
      title: productId ? 'Product Updated' : 'Product Added',
      description: `${productName} has been saved.`,
    });
    
    fetchProducts();
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEditClick = (product: Product) => {
    setProductId(product.id);
    setProductName(product.name);
    setCategory(product.category);
    setStock(product.stock);
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Products & Inventory</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1" onClick={resetForm}>
                <PlusCircle className="h-3.5 w-3.5" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{productId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" value={productName} onChange={(e) => setProductName(e.target.value)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">Category</Label>
                  <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="col-span-3" placeholder="e.g., Fruit, Pesticide, Fertilizer" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right">Stock</Label>
                  <Input id="stock" type="number" value={stock || ''} onChange={(e) => setStock(Number(e.target.value))} className="col-span-3" />
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock Quantity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
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
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <Package className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">No products found.</h3>
            <p className="mt-1 text-sm">Get started by adding your first product.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
