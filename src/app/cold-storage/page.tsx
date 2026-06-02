
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
import { PlusCircle, ArrowUpRightFromSquare, Snowflake, Loader2, Trash2, Edit, Box } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { saveDocument, deleteDocument, sendPushNotification, getDocuments } from '@/lib/actions';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import PageHeader from '@/components/PageHeader';

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

const StockCard = ({ item, onReleaseClick, onDeleteClick, userRole }: { item: StockItem, onReleaseClick: (item: StockItem) => void, onDeleteClick: (id: string) => void, userRole: string | null }) => {
    const stockPercentage = (item.initialQty > 0) ? (item.currentQty / item.initialQty) * 100 : 0;
    const isLowStock = item.status === 'In Stock' && stockPercentage < 25;

    return (
         <motion.div
            whileHover={{ y: -8, scale: 1.05, boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.4)" }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="bg-card/60 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-lg h-full flex flex-col"
        >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold truncate">{item.item}</CardTitle>
                <Badge variant={item.status === 'In Stock' ? 'default' : 'secondary'} className="shrink-0">{item.status}</Badge>
            </CardHeader>
            <CardContent className="flex-grow space-y-3 pt-2">
                <p className="text-sm text-muted-foreground font-semibold">{item.grower} - Chamber {item.chamberNo}</p>
                <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm text-muted-foreground">Current Stock</span>
                        <span className="text-2xl font-bold">{item.currentQty} <span className="text-sm font-normal">/ {item.initialQty}</span></span>
                    </div>
                     <div className="relative">
                        <Progress value={stockPercentage} className="h-3" />
                         {isLowStock && <div className="absolute inset-0 bg-red-500/50 rounded-full animate-pulse"></div>}
                    </div>
                    <p className="text-xs text-muted-foreground">Date In: {new Date(item.dateIn).toLocaleDateString('en-GB')}</p>
                </div>
            </CardContent>
            <CardFooter className="bg-black/10 p-2 flex justify-end">
                <Button variant="ghost" size="sm" className="gap-1" disabled={item.status === 'Released'} onClick={() => onReleaseClick(item)}>
                    <ArrowUpRightFromSquare className="h-3 w-3" /> Release
                </Button>
                {userRole === 'admin' && (
                    <Button variant="ghost" size="icon" onClick={() => onDeleteClick(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                )}
            </CardFooter>
        </motion.div>
    );
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
  const [fcmTokens, setFcmTokens] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setUserRole(localStorage.getItem('userRole'));
    }
     const fetchTokens = async () => {
        const { success, data } = await getDocuments('fcm-tokens', true);
        if (success && data) {
            setFcmTokens(data.map(t => t.token));
        }
    };
    fetchTokens();
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

  const handleSaveStock = async () => {
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
    
    try {
        await saveDocument('cold-storage', id, newStockItem);
        toast({ title: 'Stock Added', description: `${qtyNum} units of ${item} have been logged and synced.` });
         if (fcmTokens.length > 0) {
            await sendPushNotification({
                title: 'Stock Inward',
                body: `${qtyNum} units of ${item} for ${grower} added to cold storage.`,
                tokens: fcmTokens,
            });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Sync Failed', description: 'Saved locally, but failed to sync to cloud.' });
    }

    fetchStock();
    setIsDialogOpen(false);
    setFormState(emptyFormState);
  };

  const handleRecordOutward = async () => {
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
    
    try {
        await saveDocument('cold-storage', updatedStock.id, updatedStock);
        toast({title: 'Stock Released', description: `${outwardQty} units of ${updatedStock.item} have been released and synced.`});
        if (fcmTokens.length > 0) {
            await sendPushNotification({
                title: 'Stock Outward',
                body: `${outwardQty} units of ${updatedStock.item} released. New balance: ${updatedStock.currentQty}`,
                tokens: fcmTokens,
            });
        }
    } catch (error) {
        toast({variant: 'destructive', title: 'Sync Failed', description: 'Updated locally, but failed to sync to cloud.'});
    }

    fetchStock();
    setIsOutwardDialogOpen(false);
    setSelectedStock(null);
    setOutwardQty(0);
    setOutwardNotes('');
  };
  
  const handleDelete = async (id: string) => {
    if (userRole !== 'admin') {
        toast({variant: 'destructive', title: 'Permission Denied'});
        return;
    }
    if(!window.confirm('Are you sure? This will delete the entire stock record.')) return;
    
    localStorage.removeItem(id);

    try {
        await deleteDocument('cold-storage', id);
        toast({title: 'Record Deleted'});
    } catch (error) {
        toast({variant: 'destructive', title: 'Cloud Delete Failed', description: 'Record removed locally.'});
    }
    
    fetchStock();
  }

  return (
    <div className="space-y-6">
        <PageHeader
            title="Cold Storage Register"
            description="Manage stock placed in Sopore cold storages. Track inward and outward movements."
            icon={<Snowflake className="h-8 w-8" />}
            imageUrl="/assets/3d/cold_storage.png"
        />
        <div className="flex justify-end">
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
        
        {isLoading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : stock.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {stock.map((item) => (
                    <StockCard 
                        key={item.id} 
                        item={item} 
                        onReleaseClick={() => { setSelectedStock(item); setIsOutwardDialogOpen(true); }}
                        onDeleteClick={handleDelete}
                        userRole={userRole}
                    />
                ))}
            </div>
        ) : (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                <Box className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">No stock logged in cold storage.</h3>
                <p className="mt-1 text-sm">Use the "Add Stock" button to log your first inward entry.</p>
            </div>
        )}
    
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
    </div>
  );
}


