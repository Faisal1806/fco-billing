
'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { PlusCircle, ArrowUpRightFromSquare, Snowflake, Loader2, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const STORAGE_PREFIX = 'cs-';

type StockItem = {
  id: string;
  dateIn: string;
  grower: string;
  item: string;
  chamberNo: string;
  initialQty: number;
  currentQty: number;
  status: 'In Stock' | 'Released';
  outwardHistory: { date: string; qty: number; notes: string }[];
};

const emptyFormState: Omit<StockItem, 'id' | 'currentQty' | 'status' | 'outwardHistory' | 'initialQty'> & { initialQty: number | string } = {
  dateIn: new Date().toISOString().split('T')[0],
  grower: '',
  item: '',
  chamberNo: '',
  initialQty: '',
};

export default function ColdStoragePage() {
  const { toast } = useToast();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [formState, setFormState] = useState(emptyFormState);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOutwardDialogOpen, setIsOutwardDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [outwardQty, setOutwardQty] = useState<number>(0);
  const [outwardNotes, setOutwardNotes] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setUserRole(localStorage.getItem('userRole'));
    }
  }, []);

  const fetchStock = () => {
    setIsLoading(true);
    if(typeof window !== 'undefined') {
        const items = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if(key?.startsWith(STORAGE_PREFIX)) {
                items.push(JSON.parse(localStorage.getItem(key)!));
            }
        }
        setStock(items.sort((a,b) => new Date(b.dateIn).getTime() - new Date(a.dateIn).getTime()));
    }
    setIsLoading(false);
  }

  useEffect(() => {
    fetchStock();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormState(prev => ({ ...prev, [name]: type === 'number' ? (value ? Number(value) : '') : value }));
  };

  const handleSaveStock = () => {
    const { dateIn, grower, item, chamberNo, initialQty } = formState;
    if (!dateIn || !grower || !item || !chamberNo || !initialQty || Number(initialQty) <= 0) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out all fields.' });
      return;
    }
    const qtyNum = Number(initialQty);

    const id = `${STORAGE_PREFIX}${Date.now()}`;
    const newStockItem: StockItem = {
      id,
      dateIn,
      grower,
      item,
      chamberNo,
      initialQty: qtyNum,
      currentQty: qtyNum,
      status: 'In Stock',
      outwardHistory: [],
    };

    localStorage.setItem(id, JSON.stringify(newStockItem));
    toast({ title: 'Stock Added', description: `${qtyNum} units of ${item} have been logged.` });
    fetchStock();
    setIsDialogOpen(false);
    setFormState(emptyFormState);
  };

  const handleRecordOutward = () => {
    if (!selectedStock || outwardQty <= 0) {
        toast({variant: 'destructive', title: 'Invalid Quantity', description: 'Please enter a valid quantity.'});
        return;
    }
    if (outwardQty > selectedStock.currentQty) {
        toast({variant: 'destructive', title: 'Not Enough Stock', description: `Cannot release more than the current stock of ${selectedStock.currentQty}.`});
        return;
    }

    const updatedStock = { ...selectedStock };
    updatedStock.currentQty -= outwardQty;
    updatedStock.outwardHistory.push({
        date: new Date().toISOString().split('T')[0],
        qty: outwardQty,
        notes: outwardNotes,
    });

    if (updatedStock.currentQty === 0) {
        updatedStock.status = 'Released';
    }

    localStorage.setItem(updatedStock.id, JSON.stringify(updatedStock));
    toast({title: 'Stock Released', description: `${outwardQty} units of ${updatedStock.item} have been released.`});
    fetchStock();
    setIsOutwardDialogOpen(false);
    setSelectedStock(null);
    setOutwardQty(0);
    setOutwardNotes('');
  };
  
  const handleDelete = (id: string) => {
    if (userRole !== 'admin') {
        toast({variant: 'destructive', title: 'Permission Denied'});
        return;
    }
    if(!window.confirm('Are you sure? This will delete the entire stock record.')) return;
    
    localStorage.removeItem(id);
    toast({title: 'Record Deleted'});
    fetchStock();
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                 <CardTitle className="flex items-center gap-2"><Snowflake className="h-6 w-6 text-blue-400"/> Cold Storage Register</CardTitle>
                 <CardDescription>Manage stock placed in Sopore cold storages. Track inward and outward movements.</CardDescription>
            </div>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><PlusCircle className="h-4 w-4" /> Add Stock (Inward)</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log New Stock Inward</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateIn">Date In</Label>
                      <Input id="dateIn" name="dateIn" type="date" value={formState.dateIn} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="item">Item/Produce Name</Label>
                        <Input id="item" name="item" value={formState.item} onChange={handleInputChange} placeholder="e.g., Red Delicious Apples" />
                    </div>
                  </div>
                   <div className="space-y-2">
                        <Label htmlFor="grower">Grower/Party Name</Label>
                        <Input id="grower" name="grower" value={formState.grower} onChange={handleInputChange} />
                    </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="chamberNo">Chamber No.</Label>
                        <Input id="chamberNo" name="chamberNo" value={formState.chamberNo} onChange={handleInputChange} placeholder="e.g., C-14" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="initialQty">Quantity (Boxes)</Label>
                        <Input id="initialQty" name="initialQty" type="number" value={formState.initialQty} onChange={handleInputChange} placeholder="0" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleSaveStock}>Save Stock</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : stock.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date In</TableHead>
              <TableHead>Grower</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Chamber No.</TableHead>
              <TableHead>Initial Qty</TableHead>
              <TableHead>Current Qty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stock.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{new Date(item.dateIn).toLocaleDateString('en-GB')}</TableCell>
                <TableCell className="font-medium">{item.grower}</TableCell>
                <TableCell>{item.item}</TableCell>
                <TableCell>{item.chamberNo}</TableCell>
                <TableCell>{item.initialQty}</TableCell>
                <TableCell className="font-semibold">{item.currentQty}</TableCell>
                <TableCell>
                  <Badge variant={item.status === 'In Stock' ? 'default' : 'secondary'}>{item.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 mr-2"
                    disabled={item.status === 'Released'}
                    onClick={() => { setSelectedStock(item); setIsOutwardDialogOpen(true); }}
                  >
                    <ArrowUpRightFromSquare className="h-3 w-3" /> Release
                  </Button>
                   {userRole === 'admin' && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                   )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        ) : (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                <Snowflake className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">No stock logged in cold storage.</h3>
                <p className="mt-1 text-sm">Use the "Add Stock" button to log your first inward entry.</p>
            </div>
        )}
      </CardContent>
    </Card>
    
     <Dialog open={isOutwardDialogOpen} onOpenChange={setIsOutwardDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Release Stock (Outward)</DialogTitle>
                <p className="text-sm text-muted-foreground">Releasing from: <strong>{selectedStock?.item}</strong> for <strong>{selectedStock?.grower}</strong></p>
                <p className="text-sm text-muted-foreground">Current stock: <strong>{selectedStock?.currentQty}</strong> boxes in Chamber <strong>{selectedStock?.chamberNo}</strong></p>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="outwardQty">Quantity to Release</Label>
                    <Input id="outwardQty" type="number" value={outwardQty || ''} onChange={(e) => setOutwardQty(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="outwardNotes">Notes / Remarks</Label>
                    <Input id="outwardNotes" value={outwardNotes} onChange={(e) => setOutwardNotes(e.target.value)} placeholder="e.g., Sold to XYZ Traders"/>
                </div>
            </div>
             <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleRecordOutward}>Confirm Release</Button>
            </DialogFooter>
        </DialogContent>
     </Dialog>

    </>
  );
}
