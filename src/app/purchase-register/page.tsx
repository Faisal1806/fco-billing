

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
import { ChevronDown, PlusCircle, Loader2, FilePenLine, Trash2, List, LayoutGrid, Search, FileDown, DownloadCloud } from 'lucide-react';
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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FaWhatsapp } from 'react-icons/fa';
import { Badge } from '@/components/ui/badge';
import { deleteDocument } from '@/lib/actions';
import { Logo } from '@/components/logo';
import BusinessCardQR from '@/components/BusinessCardQR';
import html2canvas from 'html2canvas';

export interface PurchaseEntry {
    billNo: string;
    date: string;
    growerName: string;
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
    }
}

// A standalone component for the printable purchase bill layout
const A4PurchaseBillLayout = ({ billData }: { billData: PurchaseEntry }) => {
    const { billNo, date, growerName, entries, totals } = billData;
    return (
         <div className="w-[148mm] h-[210mm] bg-[#FDFEE2] text-black shadow-lg print:shadow-none p-4 border-2 border-green-700 flex flex-col relative font-serif">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center z-0">
               <Logo className="w-48 h-48 opacity-10" />
            </div>
            
            <div className="relative z-10 flex flex-col flex-grow">

                {/* Header */}
                <header className="text-center border-b-2 border-green-700 pb-2">
                    <div className="flex justify-between items-start">
                         <div className="text-left text-sm font-bold">
                            <p>🍎 F.Co</p>
                         </div>
                         <div className="flex-grow">
                            <div className="text-xs">
                                 <p className="font-bold">Prop: Firdous Ahmad Lone (Nadihal)</p>
                                 <p>Cell: 7006136330, 9797002164, 9906740921</p>
                            </div>
                            <h1 className="text-2xl font-bold text-green-800">FIRDOUS AHMAD & COMPANY</h1>
                            <p className="text-xs font-semibold">Fruit Merchants & Commission Agents</p>
                            <p className="text-xs">SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.</p>
                         </div>
                         <div className="text-right text-sm font-bold">
                            <p>🍎 F.Co</p>
                         </div>
                    </div>
                </header>
                
                {/* Bill Info */}
                <section className="flex justify-between items-end my-2 text-sm">
                    <div className="flex-1">
                        <p><strong>No:</strong> {billNo}</p>
                        <p><strong>M/s:</strong> {growerName}</p>
                    </div>
                    <div className="text-right">
                        <p><strong>Dated:</strong> {new Date(date).toLocaleDateString('en-GB')}</p>
                    </div>
                </section>

                {/* Table */}
                <main className="flex-grow">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-y-2 border-green-700">
                                <th className="p-1 border-x border-green-600 w-[15%]">Petti</th>
                                <th className="p-1 border-x border-green-600 w-[15%]">Dabba</th>
                                <th className="p-1 border-x border-green-600">VARIETY</th>
                                <th className="p-1 border-x border-green-600 w-[20%]">RATE</th>
                                <th className="p-1 border-x border-green-600 w-[25%]">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry, index) => (
                                <tr key={index} className="border-b border-green-600/50 h-8">
                                    <td className="p-1 border-x border-green-600 text-center">{entry.type === 'Patti' ? entry.qty : ''}</td>
                                    <td className="p-1 border-x border-green-600 text-center">{entry.type === 'Dabba' ? entry.qty : ''}</td>
                                    <td className="p-1 border-x border-green-600">{entry.variety}</td>
                                    <td className="p-1 border-x border-green-600 text-right">₹{entry.rate.toFixed(2)}</td>
                                    <td className="p-1 border-x border-green-600 text-right font-semibold">₹{entry.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </main>

                {/* Footer */}
                <footer className="mt-auto pt-2 text-sm">
                    <div className="flex justify-end">
                       <div className="w-2/5 p-1 border-2 border-green-700">
                          <div className="flex justify-between font-bold">
                            <span>G. Total</span>
                            <span>₹{totals.grandTotal.toFixed(2)}</span>
                          </div>
                       </div>
                    </div>
                    <div className="text-center text-xs mt-2">
                        <p>Your Satisfaction is our Success</p>
                        <p className="italic">If the bill is not paid within 15 days interest @ 5% will be Charged extra</p>
                    </div>
                    <div className="flex justify-between items-end mt-4">
                         <div className="text-center">
                            {/* This space is intentionally left blank for the controls on screen */}
                        </div>
                        <div className="text-center">
                            <p className="font-signature text-2xl text-gray-700 dark:text-gray-300">Faisal</p>
                            <p className="font-bold -mt-2">Sign. Of Manager</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};


export default function PurchaseRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [purchases, setPurchases] = React.useState<PurchaseEntry[]>([]);
  const [customers, setCustomers] = React.useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = React.useState('All Customers');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid');
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole'));
    }
  }, []);


  const fetchPurchases = React.useCallback(() => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
        const loadedPurchases = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('purchase-')) {
                try {
                    const purchase = JSON.parse(localStorage.getItem(key)!);
                    loadedPurchases.push(purchase);
                } catch(e) { console.error("Failed to parse purchase:", e)}
            }
        }
        setPurchases(loadedPurchases.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        const uniqueCustomers = ['All Customers', ...new Set(loadedPurchases.map(p => p.growerName))];
        setCustomers(uniqueCustomers);
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);
  
  const yearlyCount = React.useMemo(() => {
    if(!purchases) return 0;
    const currentYear = new Date().getFullYear();
    return purchases.filter(p => new Date(p.date).getFullYear() === currentYear).length;
  }, [purchases]);

  const filteredPurchases = purchases
    .filter(p => selectedCustomer === 'All Customers' || p.growerName === selectedCustomer)
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

    localStorage.removeItem(`purchase-${billNo}`); 
    fetchPurchases();
    toast({ title: "Purchase Bill Deleted", description: `Bill #${billNo} has been deleted locally.`});

    try {
        await deleteDocument('purchases', billNo);
    } catch (e) {
        console.error("Cloud delete failed but local was successful", e);
    }
  }

  const exportAllToPDFs = async () => {
    if (filteredPurchases.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Bills to Download',
        description: 'There are no bills matching your current filters.',
      });
      return;
    }
  
    setIsDownloading(true);
    toast({
      title: 'Starting Bulk Download',
      description: `Preparing to download ${filteredPurchases.length} purchase bills.`,
    });
  
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);

    for (const billData of filteredPurchases) {
      try {
        const billElement = document.createElement('div');
        tempContainer.appendChild(billElement);

        const root = require('react-dom/client').createRoot(billElement);
        await new Promise<void>((resolve) => {
            root.render(<A4PurchaseBillLayout billData={billData} />, () => {
              setTimeout(resolve, 100); 
            });
        });
        
        const canvas = await html2canvas(billElement.children[0] as HTMLElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#FDFEE2',
        });
        
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        doc.save(`PurchaseBill-${billData.billNo}_${billData.growerName}.pdf`);

        root.unmount();
        tempContainer.removeChild(billElement);

        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error("Failed to generate PDF for bill:", billData.billNo, error);
        toast({
          variant: "destructive",
          title: `Failed to Download Bill #${billData.billNo}`,
          description: "An error occurred while generating this PDF.",
        });
      }
    }
    
    document.body.removeChild(tempContainer);
    setIsDownloading(false);
    toast({
        title: 'Bulk Download Complete',
        description: `Finished downloading ${filteredPurchases.length} purchase bills.`,
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Purchase Register - ${selectedCustomer}`, 14, 15);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 14, 22);

    const tableData = filteredPurchases.map(p => [
        new Date(p.date).toLocaleDateString('en-GB'),
        p.billNo,
        p.growerName,
        p.entries.filter(e => e.type === 'Patti').reduce((acc, e) => acc + (e.qty || 0), 0),
        p.entries.filter(e => e.type === 'Dabba').reduce((acc, e) => acc + (e.qty || 0), 0),
        `Rs. ${p.totals.grandTotal.toFixed(2)}`
    ]);

    autoTable(doc, {
        head: [['Date', 'Bill No.', 'Customer', 'Patti', 'Dabba', 'Grand Total']],
        body: tableData,
        foot: [[
            'Total', '', '', footerTotals.patti, footerTotals.dabba, `Rs. ${footerTotals.grandTotal.toFixed(2)}`
        ]],
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] }
    });

    doc.save(`Purchase-Register-${selectedCustomer}.pdf`);
  };

  const exportToExcel = () => {
    const worksheetData = filteredPurchases.map(p => ({
        'Date': new Date(p.date).toLocaleDateString('en-GB'),
        'Bill No.': p.billNo,
        'Customer': p.growerName,
        'Patti': p.entries.filter(e => e.type === 'Patti').reduce((acc, e) => acc + (e.qty || 0), 0),
        'Dabba': p.entries.filter(e => e.type === 'Dabba').reduce((acc, e) => acc + (e.qty || 0), 0),
        'Grand Total': p.totals.grandTotal
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.sheet_add_aoa(worksheet, [
        ["Total", "", "", footerTotals.patti, footerTotals.dabba, footerTotals.grandTotal]
    ], { origin: -1 });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchases');
    XLSX.writeFile(workbook, `Purchase-Register-${selectedCustomer}.xlsx`);
  };
    
  const handleShare = () => {
    if (selectedCustomer === 'All Customers') {
        toast({
            variant: 'destructive',
            title: 'Select a Customer',
            description: 'Please select a specific customer from the dropdown to share their portal link.',
        });
        return;
    }

    let message = `Salaam ${selectedCustomer},\n\n`;
    message += `You can view your complete account ledger with Firdous Ahmad & Company by clicking the link below. The portal will open directly to your account.\n\n`;
    const encodedCustomerName = encodeURIComponent(selectedCustomer);
    message += `Portal Link: ${window.location.origin}/portal/login?customer=${encodedCustomerName}\n\n`;
    message += `Thank you for your business!`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-4 flex-wrap">
            <div className="flex items-center gap-4">
                <CardTitle className="flex items-center gap-2">
                    Purchase Register
                    {!isLoading && <Badge variant="outline">{yearlyCount} This Year</Badge>}
                </CardTitle>
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
                           <span className="flex-1 text-left">{selectedCustomer}</span>
                           <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {customers.map(customer => (
                             <DropdownMenuItem key={customer} onSelect={() => setSelectedCustomer(customer)}>
                                {customer}
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
                 <Button size="sm" variant="outline" className="gap-1" onClick={handleShare}>
                    <FaWhatsapp className="h-4 w-4 text-green-500" />
                    Share Portal
                 </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={exportToPDF}>
                    <FileDown className="h-3.5 w-3.5" />
                    PDF
                </Button>
                 <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={exportAllToPDFs}
                    disabled={isDownloading}
                >
                    {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DownloadCloud className="h-3.5 w-3.5" />}
                    Download All
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={exportToExcel}>
                    <FileDown className="h-3.5 w-3.5" />
                    Excel
                </Button>
                <Button size="sm" className="gap-1" onClick={() => router.push('/purchases')}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Purchase
                    </span>
                </Button>
            </div>
        </div>
        <CardDescription>Review all recorded purchases from customers.</CardDescription>
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
              <TableHead>Customer</TableHead>
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
