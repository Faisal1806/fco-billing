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
import { PlusCircle, Trash2, RotateCcw, Box, User, ArrowLeft, ArrowRight, CornerUpLeft, CornerUpRight, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { PartySelector } from '@/components/party-selector';

const RETURN_STORAGE_PREFIX = 'return-';

interface ReturnItem {
  id: string;
  date: string;
  type: 'Sales Return' | 'Purchase Return';
  partyName: string;
  itemName: string;
  quantity: number;
  reason?: string;
}

const emptyFormState: Omit<ReturnItem, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  type: 'Sales Return',
  partyName: '',
  itemName: '',
  quantity: 0,
  reason: '',
};

const ReturnCard = ({ item, onDelete, userRole }: { item: ReturnItem, onDelete: (id: string) => void, userRole: string | null }) => {
  const isSalesReturn = item.type === 'Sales Return';
  const cardColor = isSalesReturn ? 'bg-red-900/30 border-red-500/30' : 'bg-green-900/30 border-green-500/30';
  const textColor = isSalesReturn ? 'text-red-300' : 'text-green-300';
  const Icon = isSalesReturn ? CornerUpLeft : CornerUpRight;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      whileHover={{ y: -8, scale: 1.05, zIndex: 10, boxShadow: '0px 10px 20px rgba(0,0,0,0.4)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative rounded-xl overflow-hidden shadow-lg h-full flex flex-col ${cardColor}`}
    >
        <div className="absolute top-2 right-2 p-2 bg-black/30 rounded-full">
            <Icon className={`h-6 w-6 ${textColor}`} />
        </div>

        <CardHeader className="pb-2">
            <CardTitle className={`text-lg font-bold truncate ${textColor}`}>{item.itemName}</CardTitle>
            <CardDescription className="text-white/70">
                {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-3 pt-2">
            <div className="flex items-center gap-2 text-sm text-white/90">
                <User className="h-4 w-4" />
                <span>{item.partyName}</span>
            </div>
             <p className="text-2xl font-bold text-white/90">
                {item.quantity} <span className="text-base font-normal">units</span>
            </p>
            {item.reason && <p className="text-xs text-white/60 italic">Reason: {item.reason}</p>}
        </CardContent>
        <CardFooter className="bg-black/20 p-2 flex justify-end">
            {userRole === 'admin' && (
                <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
            )}
        </CardFooter>
    </motion.div>
  );
};


export default function ReturnsPage() {
  const { toast } = useToast();
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [formState, setFormState] = useState<Omit<ReturnItem, 'id'>>(emptyFormState);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchReturns = () => {
    setIsLoading(true);
    if(typeof window !== 'undefined') {
        const items = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if(key?.startsWith(RETURN_STORAGE_PREFIX)) {
                items.push(JSON.parse(localStorage.getItem(key)!));
            }
        }
        setReturns(items.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
    setIsLoading(false);
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setUserRole(localStorage.getItem('userRole'));
    }
    fetchReturns();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormState(prev => ({ ...prev, [name]: type === 'number' ? (value ? Number(value) : '') : value }));
  };

  const handleSelectChange = (name: keyof typeof formState, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value as ReturnItem['type'] }));
  };

  const handleSaveReturn = () => {
    const { date, type, partyName, itemName, quantity } = formState;
    if (!date || !partyName || !itemName || !quantity || Number(quantity) <= 0) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out all required fields with valid data.' });
      return;
    }
    
    const id = `${RETURN_STORAGE_PREFIX}${Date.now()}`;
    const newReturnItem: ReturnItem = { id, ...formState, quantity: Number(quantity) };

    localStorage.setItem(id, JSON.stringify(newReturnItem));
    toast({ title: 'Return Logged', description: `A ${type} of ${quantity} unit(s) for ${itemName} has been recorded.` });

    fetchReturns();
    setIsDialogOpen(false);
    setFormState(emptyFormState);
  };
  
  const handleDelete = (id: string) => {
    if (userRole !== 'admin') {
        toast({variant: 'destructive', title: 'Permission Denied'});
        return;
    }
    if(!window.confirm('Are you sure? This will permanently delete this return record.')) return;
    
    localStorage.removeItem(id);
    toast({title: 'Record Deleted'});
    fetchReturns();
  }

  const { salesReturns, purchaseReturns } = useMemo(() => {
      return returns.reduce((acc, item) => {
          if(item.type === 'Sales Return') {
              acc.salesReturns.push(item);
          } else {
              acc.purchaseReturns.push(item);
          }
          return acc;
      }, { salesReturns: [] as ReturnItem[], purchaseReturns: [] as ReturnItem[] });
  }, [returns]);


  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                 <CardTitle className="flex items-center gap-3 text-3xl"><RotateCcw className="h-8 w-8 text-orange-400"/> Sales & Purchase Returns</CardTitle>
                 <CardDescription>Track items returned from customers (Sales Return) or items you return to your suppliers (Purchase Return).</CardDescription>
            </div>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><PlusCircle className="h-4 w-4" /> Log New Return</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log a New Return</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Type of Return</Label>
                        <Select value={formState.type} onValueChange={(v) => handleSelectChange('type', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sales Return">Sales Return (from Customer)</SelectItem>
                                <SelectItem value="Purchase Return">Purchase Return (to Supplier)</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" name="date" type="date" value={formState.date} onChange={handleInputChange} />
                    </div>
                  </div>
                   <div className="space-y-2">
                        <Label htmlFor="partyName">{formState.type === 'Sales Return' ? 'Customer Name' : 'Supplier Name'}</Label>
                        <PartySelector value={formState.partyName} onChange={(val) => handleSelectChange('partyName', val)} filter="all" />
                    </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="itemName">Item/Product Name</Label>
                        <Input id="itemName" name="itemName" value={formState.itemName} onChange={handleInputChange} placeholder="e.g., Red Delicious Apples" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity Returned</Label>
                        <Input id="quantity" name="quantity" type="number" value={formState.quantity || ''} onChange={handleInputChange} placeholder="0" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Return (Optional)</Label>
                    <Input id="reason" name="reason" value={formState.reason || ''} onChange={handleInputChange} placeholder="e.g., Damaged goods, wrong item" />
                  </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleSaveReturn}>Save Return Record</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><CornerUpLeft className="h-5 w-5 text-red-400" /> Sales Returns (From Customers)</h3>
             {salesReturns.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {salesReturns.map(item => <ReturnCard key={item.id} item={item} onDelete={handleDelete} userRole={userRole} />)}
                    </AnimatePresence>
                </div>
             ) : (
                 <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg bg-red-900/10 border-red-500/20">
                    <AlertTriangle className="mx-auto h-12 w-12 text-red-500/50" />
                    <p className="mt-2 font-semibold">No sales returns recorded.</p>
                </div>
             )}
        </div>
         <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><CornerUpRight className="h-5 w-5 text-green-400" /> Purchase Returns (To Suppliers)</h3>
             {purchaseReturns.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {purchaseReturns.map(item => <ReturnCard key={item.id} item={item} onDelete={handleDelete} userRole={userRole} />)}
                    </AnimatePresence>
                </div>
             ) : (
                <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg bg-green-900/10 border-green-500/20">
                    <AlertTriangle className="mx-auto h-12 w-12 text-green-500/50" />
                    <p className="mt-2 font-semibold">No purchase returns recorded.</p>
                </div>
             )}
        </div>
      </CardContent>
    </Card>
    </>
  );
}
