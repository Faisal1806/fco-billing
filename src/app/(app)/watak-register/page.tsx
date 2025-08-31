
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
import { useLanguage } from '@/contexts/language-context';
import { ChevronDown, PlusCircle, Share2, Loader2, FilePenLine, Trash2, List, LayoutGrid } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot, query, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import DocumentCard from '@/components/DocumentCard';

export interface WatakEntry {
    id: string;
    date: string;
    sNo: string;
    watakNo: string;
    customerName: string;
    customerUrdu?: string; // Add this for Urdu name
    entries: { peti: number, daba: number }[];
    grossSale: number;
    totalExpenses: number;
    netSale: number;
}

export default function WatakRegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();

  const [wataks, setWataks] = React.useState<WatakEntry[]>([]);
  const [growers, setGrowers] = React.useState<string[]>([]);
  const [selectedGrower, setSelectedGrower] = React.useState('All Growers');
  const [isLoading, setIsLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>('table');


  React.useEffect(() => {
    const q = query(collection(db, "wataks"), orderBy("sNo", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedWataks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WatakEntry));
        setWataks(fetchedWataks);

        const uniqueGrowers = ['All Growers', ...new Set(fetchedWataks.map(w => w.customerName))];
        setGrowers(uniqueGrowers);

        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching wataks:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch watak register from Firestore."
        });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const filteredWataks = selectedGrower === 'All Growers'
    ? wataks
    : wataks.filter(w => w.customerName === selectedGrower);

  const footerTotals = filteredWataks.reduce((acc, watak) => {
    acc.grossSale += watak.grossSale || 0;
    acc.totalExpenses += watak.totalExpenses || 0;
    acc.netSale += watak.netSale || 0;
    return acc;
  }, { grossSale: 0, totalExpenses: 0, netSale: 0 });

  const handleShare = async () => {
    const shareText = `Watak Register for ${selectedGrower}`;
     if (navigator.share) {
        try {
            await navigator.share({
                title: 'Watak Register',
                text: shareText,
                url: window.location.href,
            });
            toast({ title: "Register Shared", description: "The register link has been shared." });
        } catch (error) {
            toast({ variant: "destructive", title: "Share Failed", description: "Could not share the register." });
        }
    } else {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast({ title: "Link Copied", description: "Register link copied to clipboard." });
        } catch (error) {
             toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy the link." });
        }
    }
  }

  const navigateToBill = (id: string) => {
    router.push(`/invoice/${id}`);
  }

  const handleDelete = async (id: string, sNo: string) => {
    if(!window.confirm(`Are you sure you want to delete Bill #${sNo}? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "wataks", id));
      localStorage.removeItem(`invoice-${sNo}`);
      toast({ title: "Bill Deleted", description: `Bill #${sNo} has been deleted.`});
    } catch(e) {
      toast({ variant: "destructive", title: "Delete failed", description: "Could not delete bill."});
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
                <CardTitle>{t('watak_register')}</CardTitle>
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
                <Button size="sm" className="gap-1" onClick={handleShare} variant="outline">
                    <Share2 className="h-3.5 w-3.5" />
                     <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Share Register
                    </span>
                </Button>
                <Button size="sm" className="gap-1" onClick={() => router.push('/sales')}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        {t('add_watak')}
                    </span>
                </Button>
            </div>
        </div>
        <CardDescription>{t('watak_register_subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredWataks.map((watak) => (
                     <div key={watak.id} onClick={() => navigateToBill(watak.sNo)} className="cursor-pointer">
                        <DocumentCard type="watak" title={`Watak #${watak.watakNo}`}>
                            <p className="text-lg font-semibold">{watak.customerName}</p>
                            {watak.customerUrdu && <p className="font-urdu text-xl mt-1">{watak.customerUrdu}</p>}
                            <p className="text-sm mt-2">Date: {new Date(watak.date).toLocaleDateString()}</p>
                            <p className="text-2xl font-bold mt-4">₹{watak.netSale.toFixed(2)}</p>
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
              <TableHead>Watak No.</TableHead>
              <TableHead>Khata (Grower)</TableHead>
              <TableHead>Peti</TableHead>
              <TableHead>Daba</TableHead>
              <TableHead className="text-right">Gross Sale</TableHead>
              <TableHead className="text-right">Total Exp.</TableHead>
              <TableHead className="text-right">Net Sale</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWataks.map((watak: WatakEntry) => (
              <TableRow key={watak.id}>
                <TableCell>{new Date(watak.date).toLocaleDateString('en-GB')}</TableCell>
                <TableCell>{watak.sNo}</TableCell>
                <TableCell>{watak.watakNo}</TableCell>
                <TableCell className="font-medium">{watak.customerName}</TableCell>
                <TableCell>{watak.entries.reduce((acc, e) => acc + (e.peti || 0), 0)}</TableCell>
                <TableCell>{watak.entries.reduce((acc, e) => acc + (e.daba || 0), 0)}</TableCell>
                <TableCell className="text-right">₹{watak.grossSale.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{watak.totalExpenses.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{watak.netSale.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => navigateToBill(watak.sNo)}>
                    <FilePenLine className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(watak.id, watak.sNo)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
             <TableRow className="font-bold bg-muted">
                <TableCell colSpan={6} className="text-right">Total</TableCell>
                <TableCell className="text-right">₹{footerTotals.grossSale.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{footerTotals.totalExpenses.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{footerTotals.netSale.toFixed(2)}</TableCell>
                <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}
