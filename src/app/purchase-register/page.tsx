'use client';

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
import {
  ChevronDown,
  PlusCircle,
  Loader2,
  FilePenLine,
  Trash2,
  List,
  LayoutGrid,
  Search,
  FileDown,
  DownloadCloud,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import DocumentCard from '@/components/DocumentCard';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FaWhatsapp } from 'react-icons/fa';
import { Badge } from '@/components/ui/badge';
import { deleteDocument, getDocuments } from '@/lib/actions';
import { useAppState } from '@/contexts/app-state-context';
import { motion } from 'framer-motion';

type PurchaseEntry = {
  id?: string;
  billNo: string;
  date: string;
  growerName: string;
  purchaseFor?: 'Customer' | 'Own Stock (F.Co)';
  entries: {
    type: 'Patti' | 'Dabba';
    variety: string;
    qty: number;
    rate: number;
    total: number;
  }[];
  totals: {
    totalQty: number;
    grandTotal: number;
  };
};

const whole = (value: unknown) => Math.round(Number(value) || 0);

const normalizePurchase = (item: any, key?: string): PurchaseEntry | null => {
  const value = item?.value && typeof item.value === 'object' ? item.value : item;
  if (!value || typeof value !== 'object') return null;
  const billNo = String(value.billNo || '');
  if (!billNo) return null;

  const entries = Array.isArray(value.entries)
    ? value.entries.map((entry: any) => ({
        type: entry?.type === 'Dabba' ? 'Dabba' : 'Patti',
        variety: String(entry?.variety || entry?.description || ''),
        qty: whole(entry?.qty),
        rate: whole(entry?.rate),
        total: whole(entry?.total ?? ((Number(entry?.qty) || 0) * (Number(entry?.rate) || 0))),
      }))
    : [];

  const totalQty = whole(
    value?.totals?.totalQty ?? entries.reduce((sum: number, e: any) => sum + e.qty, 0),
  );
  const grandTotal = whole(
    value?.totals?.grandTotal ?? entries.reduce((sum: number, e: any) => sum + e.total, 0),
  );

  return {
    id: String(value.id || key || `purchase-${billNo}`),
    billNo,
    date: String(value.date || ''),
    growerName: String(value.growerName || value.customerName || 'Unknown'),
    purchaseFor: value.purchaseFor,
    entries,
    totals: { totalQty, grandTotal },
  };
};

function getYear(date: unknown): number | null {
  if (!date) return null;
  const text = String(date);
  const match = text.match(/\b(20\d{2})\b/);
  if (match) return Number(match[1]);
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
}

function readLocalPurchases(): PurchaseEntry[] {
  if (typeof window === 'undefined') return [];
  const result: PurchaseEntry[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('purchase-') || key.startsWith('supplier-purchase-')) continue;
    try {
      const purchase = normalizePurchase(JSON.parse(localStorage.getItem(key) || 'null'), key);
      if (purchase) result.push(purchase);
    } catch (error) {
      console.error('Could not parse local purchase:', key, error);
    }
  }
  return result;
}

export default function PurchaseRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { selectedYear, setSelectedYear } = useAppState();

  const [purchases, setPurchases] = React.useState<PurchaseEntry[]>([]);
  const [customers, setCustomers] = React.useState<string[]>(['All Customers']);
  const [selectedCustomer, setSelectedCustomer] = React.useState('All Customers');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('table');
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [availableYears, setAvailableYears] = React.useState<number[]>([]);

  const fetchPurchases = React.useCallback(async () => {
    setIsLoading(true);
    let loaded: PurchaseEntry[] = [];

    try {
      const result = await getDocuments('purchase-');
      if (result.success && Array.isArray(result.data)) {
        loaded = result.data
          .map((item: any) => normalizePurchase(item, item?.key))
          .filter(Boolean) as PurchaseEntry[];
      }
    } catch (error) {
      console.error('Cloud purchase register load failed:', error);
    }

    // Always merge local cache. This prevents the register from becoming empty
    // when the API is temporarily unavailable and avoids duplicate bills.
    const local = readLocalPurchases();
    const byId = new Map<string, PurchaseEntry>();
    [...loaded, ...local].forEach((purchase) => {
      byId.set(purchase.id || `purchase-${purchase.billNo}`, purchase);
    });

    const merged = Array.from(byId.values()).sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    );

    const years = new Set<number>([new Date().getFullYear()]);
    merged.forEach((purchase) => {
      const year = getYear(purchase.date);
      if (year) years.add(year);
    });

    setAvailableYears(Array.from(years).sort((a, b) => b - a));
    setPurchases(merged);
    setCustomers([
      'All Customers',
      ...Array.from(new Set(merged.map((p) => p.growerName).filter(Boolean))).sort(),
    ]);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    setUserRole(localStorage.getItem('userRole'));
    void fetchPurchases();
  }, [fetchPurchases]);

  React.useEffect(() => {
    const handler = () => void fetchPurchases();
    window.addEventListener('mongodb-synced', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('mongodb-synced', handler);
      window.removeEventListener('storage', handler);
    };
  }, [fetchPurchases]);

  const yearlyPurchases = React.useMemo(
    () => purchases.filter((p) => getYear(p.date) === selectedYear),
    [purchases, selectedYear],
  );

  const filteredPurchases = React.useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    return yearlyPurchases
      .filter((p) => selectedCustomer === 'All Customers' || p.growerName === selectedCustomer)
      .filter((p) => {
        if (!search) return true;
        return (
          p.billNo.toLowerCase().includes(search) ||
          p.growerName.toLowerCase().includes(search) ||
          (p.purchaseFor || '').toLowerCase().includes(search)
        );
      });
  }, [yearlyPurchases, selectedCustomer, searchTerm]);

  const footerTotals = React.useMemo(
    () =>
      filteredPurchases.reduce(
        (acc, purchase) => {
          acc.grandTotal += whole(purchase.totals?.grandTotal);
          purchase.entries.forEach((entry) => {
            if (entry.type === 'Patti') acc.patti += whole(entry.qty);
            if (entry.type === 'Dabba') acc.dabba += whole(entry.qty);
          });
          return acc;
        },
        { grandTotal: 0, patti: 0, dabba: 0 },
      ),
    [filteredPurchases],
  );

  const navigateToBill = (billNo: string) => router.push(`/purchase-bill/${billNo}`);

  const handleDelete = async (purchase: PurchaseEntry) => {
    if (userRole !== 'admin') {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'Only administrators can delete purchases.' });
      return;
    }
    if (!window.confirm(`Are you sure you want to delete Purchase Bill #${purchase.billNo}? This cannot be undone.`)) return;

    const key = purchase.id || `purchase-${purchase.billNo}`;
    try {
      const result = await deleteDocument(key);
      if (!result.success) throw new Error(result.error || 'Delete failed');
    } catch (error) {
      console.error('Cloud delete failed:', error);
    }

    localStorage.removeItem(key);
    localStorage.removeItem(`purchase-${purchase.billNo}`);
    await fetchPurchases();
    toast({ title: 'Purchase Bill Deleted', description: `Bill #${purchase.billNo} has been deleted.` });
  };

  const exportToPDF = () => {
    if (!filteredPurchases.length) return;
    const doc = new jsPDF();
    doc.text(`Purchase Register - ${selectedCustomer} (${selectedYear})`, 14, 15);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 14, 22);

    autoTable(doc, {
      head: [['Date', 'Bill No.', 'Customer', 'Patti', 'Dabba', 'Grand Total']],
      body: filteredPurchases.map((p) => [
        new Date(p.date).toLocaleDateString('en-GB'),
        p.billNo,
        p.growerName,
        p.entries.filter((e) => e.type === 'Patti').reduce((s, e) => s + whole(e.qty), 0),
        p.entries.filter((e) => e.type === 'Dabba').reduce((s, e) => s + whole(e.qty), 0),
        `Rs. ${whole(p.totals.grandTotal)}`,
      ]),
      foot: [['Total', '', '', footerTotals.patti, footerTotals.dabba, `Rs. ${footerTotals.grandTotal}`]],
      startY: 30,
      theme: 'striped',
    });
    doc.save(`Purchase-Register-${selectedCustomer}-${selectedYear}.pdf`);
  };

  const exportToExcel = () => {
    const data = filteredPurchases.map((p) => ({
      Date: new Date(p.date).toLocaleDateString('en-GB'),
      'Bill No.': p.billNo,
      Customer: p.growerName,
      Patti: p.entries.filter((e) => e.type === 'Patti').reduce((s, e) => s + whole(e.qty), 0),
      Dabba: p.entries.filter((e) => e.type === 'Dabba').reduce((s, e) => s + whole(e.qty), 0),
      'Grand Total': whole(p.totals.grandTotal),
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.sheet_add_aoa(sheet, [['Total', '', '', footerTotals.patti, footerTotals.dabba, footerTotals.grandTotal]], { origin: -1 });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Purchases');
    XLSX.writeFile(workbook, `Purchase-Register-${selectedCustomer}-${selectedYear}.xlsx`);
  };

  const handleShare = () => {
    if (selectedCustomer === 'All Customers') {
      toast({ variant: 'destructive', title: 'Select a Customer', description: 'Please select a specific customer first.' });
      return;
    }
    const message = `Salaam ${selectedCustomer},\n\nYou can view your complete account ledger with Firdous Ahmad & Company.\n\nPortal Link: ${window.location.origin}/portal/login?customer=${encodeURIComponent(selectedCustomer)}\n\nThank you for your business!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const downloadAll = async () => {
    if (!filteredPurchases.length) return;
    setIsDownloading(true);
    toast({ title: 'Bulk Download', description: `Preparing ${filteredPurchases.length} purchase bills.` });
    // Keep this action intentionally simple and safe: export the register as one PDF.
    exportToPDF();
    setIsDownloading(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">Purchase Register</CardTitle>
            <CardDescription>All customer purchase bills, loaded from MongoDB with local-cache fallback.</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>{availableYears.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent>
            </Select>
            <Badge variant="outline">{yearlyPurchases.length} bills</Badge>
            <Button variant="outline" size="icon" title="Refresh" onClick={() => void fetchPurchases()}><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" title="Toggle view" onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}>
              {viewMode === 'table' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 pt-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search bill number or customer..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="justify-between min-w-[220px]"><span className="truncate">{selectedCustomer}</span><ChevronDown className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
              {customers.map((customer) => <DropdownMenuItem key={customer} onSelect={() => setSelectedCustomer(customer)}>{customer}</DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={handleShare} className="gap-2"><FaWhatsapp className="h-4 w-4 text-green-500" />Share</Button>
          <Button variant="outline" onClick={exportToPDF} className="gap-2"><FileDown className="h-4 w-4" />PDF</Button>
          <Button variant="outline" onClick={exportToExcel} className="gap-2"><FileDown className="h-4 w-4" />Excel</Button>
          <Button variant="outline" onClick={downloadAll} disabled={isDownloading} className="gap-2"><DownloadCloud className="h-4 w-4" />Download</Button>
          <Button onClick={() => router.push('/purchases')} className="gap-2"><PlusCircle className="h-4 w-4" />Add Purchase</Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : !filteredPurchases.length ? (
          <div className="text-center py-16 text-muted-foreground">No purchases found for {selectedYear}.</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPurchases.map((purchase, index) => (
              <motion.div key={purchase.id || purchase.billNo} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                <DocumentCard type="bill" title={`Purchase #${purchase.billNo}`}>
                  <button className="w-full text-left" onClick={() => navigateToBill(purchase.billNo)}>
                    <p className="text-lg font-semibold">{purchase.growerName}</p>
                    <p className="text-sm mt-2">Date: {new Date(purchase.date).toLocaleDateString('en-GB')}</p>
                    <p className="text-sm mt-1">Qty: {whole(purchase.totals.totalQty).toLocaleString('en-IN')}</p>
                    <p className="text-2xl font-bold mt-3">₹{whole(purchase.totals.grandTotal).toLocaleString('en-IN')}</p>
                  </button>
                  <div className="flex justify-end mt-2">
                    {userRole === 'admin' && <Button variant="ghost" size="icon" onClick={() => void handleDelete(purchase)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                  </div>
                </DocumentCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead><TableHead>Bill No.</TableHead><TableHead>Customer</TableHead><TableHead>Patti</TableHead><TableHead>Dabba</TableHead><TableHead className="text-right">Grand Total</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => {
                  const patti = purchase.entries.filter((e) => e.type === 'Patti').reduce((s, e) => s + whole(e.qty), 0);
                  const dabba = purchase.entries.filter((e) => e.type === 'Dabba').reduce((s, e) => s + whole(e.qty), 0);
                  return <TableRow key={purchase.id || purchase.billNo}>
                    <TableCell>{new Date(purchase.date).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell className="font-medium">{purchase.billNo}</TableCell>
                    <TableCell>{purchase.growerName}</TableCell>
                    <TableCell>{patti}</TableCell><TableCell>{dabba}</TableCell>
                    <TableCell className="text-right font-semibold">₹{whole(purchase.totals.grandTotal).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="Open bill" onClick={() => navigateToBill(purchase.billNo)}><FilePenLine className="h-4 w-4" /></Button>
                      {userRole === 'admin' && <Button variant="ghost" size="icon" title="Delete" onClick={() => void handleDelete(purchase)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </TableCell>
                  </TableRow>;
                })}
                <TableRow className="font-bold bg-muted">
                  <TableCell colSpan={3} className="text-right">Total</TableCell>
                  <TableCell>{footerTotals.patti}</TableCell><TableCell>{footerTotals.dabba}</TableCell>
                  <TableCell className="text-right">₹{footerTotals.grandTotal.toLocaleString('en-IN')}</TableCell><TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
