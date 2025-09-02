
'use client'

import * as React from 'react';
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
import { ChevronDown, PlusCircle, Share2, Loader2, FilePenLine, Trash2, List, LayoutGrid, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import DocumentCard from '@/components/DocumentCard';


export interface PurchaseEntry {
    billNo: string;
    date: string;
    growerName: string;
    entries: {
        type: 'Patti' | 'Dabba';
        qty: number;
    }[];
    totals: {
        grandTotal: number;
    }
}

export default function PurchaseRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [purchases, setPurchases] = React.useState<PurchaseEntry[]>([]);
  const [growers, setGrowers] = React.useState<string[]>([]);
  const [selectedGrower, setSelectedGrower] = React.useState('All Growers');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>('grid');
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole'));
    }
  }, []);


  React.useEffect(() => {
    const fetchPurchases = async () => {
        setIsLoading(true);
        try {
            const savedPurchases = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('purchase-')) {
                    savedPurchases.push(JSON.parse(localStorage.getItem(key)!));
                }
            }
            setPurchases(savedPurchases);
            const uniqueGrowers = ['All Growers', ...new Set(savedPurchases.map(p => p.growerName))];
            setGrowers(uniqueGrowers);
        } catch (e) {
            console.error("Could not fetch purchases from LocalStorage", e);
            toast({ variant: "destructive", title: "Error", description: "Failed to load purchases."})
        } finally {
            setIsLoading(false);
        }
    }
    fetchPurchases();
  }, [toast]);

  const filteredPurchases = purchases
    .filter(p => selectedGrower === 'All Growers' || p.growerName === selectedGrower)
    .filter(p => {
        if (!searchTerm) return true;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return (
            p.growerName.toLowerCase().includes(lowerCaseSearch) ||
            p.billNo.toLowerCase().includes(lowerCaseSearch)
        )
    });


  const footerTotals = filteredPurchases.reduce((acc, purchase) => {
    acc.grandTotal += purchase.totals.grandTotal || 0;
    const patti = purchase.entries.filter(e => e.type === 'Patti').reduce((sum, e) => sum + e.qty, 0);
    const dabba = purchase.entries.filter(e => e.type === 'Dabba').reduce((sum, e) => sum + e.qty, 0);
    acc.patti += patti;
    acc.dabba += dabba;
    return acc;
  }, { grandTotal: 0, patti: 0, dabba: 0 });

  const navigateToBill = (id: string) => {
    router.push(`/purchase-bill/${id}`);
  }

  const handleDelete = async (billNo: string) => {
    if (userRole !== 'admin') {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to delete purchase bills.' });
      return;
    }
    if(!window.confirm(`Are you sure you want to delete Purchase Bill #${billNo}? This cannot be undone.`)) return;
    try {
      localStorage.removeItem(`purchase-${billNo}`);
      setPurchases(prev => prev.filter(p => p.billNo !== billNo));
      toast({ title: "Purchase Bill Deleted", description: `Bill #${billNo} has been deleted.`});
    } catch(e) {
      toast({ variant: "destructive", title: "Delete failed", description: "Could not delete bill."});
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-4 flex-wrap">
            <div className="flex items-center gap-4">
                <CardTitle>Purchase Register</CardTitle>
                 <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by Bill No, Name..."
                        className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2 min-w-[200px]">
                           <span className="flex-1 text-left">{selectedGrower}</span>
                           <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {growers.map(grower => (
                             <DropdownMenuItem key={grower} onSelect={() => setSelectedGrower(grower)}>
                                {grower}
                             </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
                 <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                    title={viewMode === 'table' ? 'Grid View' : 'Table View'}
                    >
                    {viewMode === 'table' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                </Button>
                <Button size="sm" className="gap-1" onClick={() => router.push('/purchases')}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Purchase
                    </span>
                </Button>
            </div>
        </div>
        <CardDescription>Review all recorded purchases from growers.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPurchases.map((purchase) => (
                     <div key={purchase.billNo} onClick={() => navigateToBill(purchase.billNo)} className="cursor-pointer">
                        <DocumentCard type="bill" title={`Purchase #${purchase.billNo}`}>
                            <p className="text-lg font-semibold">{purchase.growerName}</p>
                            <p className="text-sm mt-2">Date: {new Date(purchase.date).toLocaleDateString()}</p>
                            <p className="text-2xl font-bold mt-4">₹{purchase.totals.grandTotal.toFixed(2)}</p>
                        </DocumentCard>
                    </div>
                ))}
            </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Bill No.</TableHead>
              <TableHead>Grower</TableHead>
              <TableHead>Patti</TableHead>
              <TableHead>Dabba</TableHead>
              <TableHead className="text-right">Grand Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPurchases.map((purchase: PurchaseEntry) => (
              <TableRow key={purchase.billNo}>
                <TableCell>{new Date(purchase.date).toLocaleDateString('en-GB')}</TableCell>
                <TableCell>{purchase.billNo}</TableCell>
                <TableCell className="font-medium">{purchase.growerName}</TableCell>
                <TableCell>{purchase.entries.filter(e=>e.type === 'Patti').reduce((acc, e) => acc + (e.qty || 0), 0)}</TableCell>
                <TableCell>{purchase.entries.filter(e=>e.type === 'Dabba').reduce((acc, e) => acc + (e.qty || 0), 0)}</TableCell>
                <TableCell className="text-right">₹{purchase.totals.grandTotal.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => navigateToBill(purchase.billNo)}>
                    <FilePenLine className="h-4 w-4" />
                  </Button>
                  {userRole === 'admin' && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(purchase.billNo)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
             <TableRow className="font-bold bg-muted">
                <TableCell colSpan={3} className="text-right">Total</TableCell>
                <TableCell>{footerTotals.patti}</TableCell>
                <TableCell>{footerTotals.dabba}</TableCell>
                <TableCell className="text-right">₹{footerTotals.grandTotal.toFixed(2)}</TableCell>
                <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}
