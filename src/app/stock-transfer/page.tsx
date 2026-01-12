'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { PlusCircle, Trash2, Box, ArrowRight, Truck, Warehouse, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { PartySelector } from '@/components/party-selector';

const TRANSFER_STORAGE_PREFIX = 'stock-transfer-';

interface TransferItem {
  id: string;
  date: string;
  itemName: string;
  quantity: number;
  fromLocation: string;
  toLocation: string;
  notes?: string;
}

const emptyFormState: Omit<TransferItem, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  itemName: '',
  quantity: 0,
  fromLocation: '',
  toLocation: '',
  notes: '',
};

const TransferCard = ({ item, onDelete, userRole }: { item: TransferItem, onDelete: (id: string) => void, userRole: string | null }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      whileHover={{ y: -8, scale: 1.05, zIndex: 10, boxShadow: '0px 10px 20px rgba(0,0,0,0.4)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative bg-card/60 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-lg"
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-primary-foreground">{item.itemName}</h3>
            <div className="text-right">
                <p className="font-bold text-2xl text-primary-foreground">{item.quantity}</p>
                <p className="text-xs text-muted-foreground">Units</p>
            </div>
        </div>
        
        <div className="flex items-center justify-between gap-2 my-4">
            <div className="flex-1 text-center bg-black/20 p-2 rounded-lg">
                <p className="text-xs text-muted-foreground">From</p>
                <p className="font-semibold truncate flex items-center justify-center gap-1"><Warehouse className="h-4 w-4"/> {item.fromLocation}</p>
            </div>
            
            <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
            >
                <ArrowRight className="h-6 w-6 text-green-400" />
            </motion.div>

            <div className="flex-1 text-center bg-black/20 p-2 rounded-lg">
                <p className="text-xs text-muted-foreground">To</p>
                <p className="font-semibold truncate flex items-center justify-center gap-1"><Building className="h-4 w-4"/> {item.toLocation}</p>
            </div>
        </div>

        <p className="text-xs text-muted-foreground">
            Transferred on {new Date(item.date).toLocaleDateString('en-GB')}
        </p>
        {item.notes && <p className="text-xs text-muted-foreground italic mt-1">Note: {item.notes}</p>}
      </div>

      <CardFooter className="bg-black/20 p-1 flex justify-end">
        {userRole === 'admin' && (
          <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        )}
      </CardFooter>
    </motion.div>
  );
};


export default function StockTransferPage() {
  const { toast } = useToast();
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [formState, setFormState] = useState<Omit<TransferItem, 'id'>>(emptyFormState);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchTransfers = () => {
    setIsLoading(true);
    if(typeof window !== 'undefined') {
        const items = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if(key?.startsWith(TRANSFER_STORAGE_PREFIX)) {
                items.push(JSON.parse(localStorage.getItem(key)!));
            }
        }
        setTransfers(items.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
    setIsLoading(false);
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setUserRole(localStorage.getItem('userRole'));
    }
    fetchTransfers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormState(prev => ({ ...prev, [name]: type === 'number' ? (value ? Number(value) : '') : value }));
  };

  const handleSaveTransfer = () => {
    const { date, itemName, quantity, fromLocation, toLocation } = formState;
    if (!date || !itemName || !quantity || !fromLocation || !toLocation || Number(quantity) <= 0) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out all required fields with valid data.' });
      return;
    }
    
    const id = `${TRANSFER_STORAGE_PREFIX}${Date.now()}`;
    const newTransferItem: TransferItem = { id, ...formState, quantity: Number(quantity) };

    localStorage.setItem(id, JSON.stringify(newTransferItem));
    toast({ title: 'Transfer Logged', description: `${quantity} unit(s) of ${itemName} moved from ${fromLocation} to ${toLocation}.` });

    fetchTransfers();
    setIsDialogOpen(false);
    setFormState(emptyFormState);
  };
  
  const handleDelete = (id: string) => {
    if (userRole !== 'admin') {
        toast({variant: 'destructive', title: 'Permission Denied'});
        return;
    }
    if(!window.confirm('Are you sure? This will permanently delete this transfer record.')) return;
    
    localStorage.removeItem(id);
    toast({title: 'Record Deleted'});
    fetchTransfers();
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                 <CardTitle className="flex items-center gap-3 text-3xl"><Truck className="h-8 w-8 text-blue-400"/> Stock Transfer</CardTitle>
                 <CardDescription>Log the movement of goods between different locations, warehouses, or stores.</CardDescription>
            </div>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><PlusCircle className="h-4 w-4" /> Log New Transfer</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log a New Stock Transfer</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                   <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" name="date" type="date" value={formState.date} onChange={handleInputChange} />
                    </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="itemName">Item/Product Name</Label>
                        <Input id="itemName" name="itemName" value={formState.itemName} onChange={handleInputChange} placeholder="e.g., Red Delicious Apples" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity Transferred</Label>
                        <Input id="quantity" name="quantity" type="number" value={formState.quantity || ''} onChange={handleInputChange} placeholder="0" />
                    </div>
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="fromLocation">From Location</Label>
                        <Input id="fromLocation" name="fromLocation" value={formState.fromLocation} onChange={handleInputChange} placeholder="e.g., Main Warehouse" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="toLocation">To Location</Label>
                        <Input id="toLocation" name="toLocation" value={formState.toLocation} onChange={handleInputChange} placeholder="e.g., Shop Front" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes / Reason (Optional)</Label>
                    <Input id="notes" name="notes" value={formState.notes || ''} onChange={handleInputChange} placeholder="e.g., Restocking retail" />
                  </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleSaveTransfer}>Save Transfer Record</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent>
         {transfers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {transfers.map(item => <TransferCard key={item.id} item={item} onDelete={handleDelete} userRole={userRole} />)}
                </AnimatePresence>
            </div>
         ) : (
             <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                <Truck className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">No stock transfers recorded.</h3>
                <p className="mt-1 text-sm">Use the "Log New Transfer" button to record your first stock movement.</p>
            </div>
         )}
      </CardContent>
    </Card>
    </>
  );
}
