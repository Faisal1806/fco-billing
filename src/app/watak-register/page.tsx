
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { ChevronDown, PlusCircle, Loader2, FilePenLine, Trash2, List, LayoutGrid, Search, FileDown, DownloadCloud } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
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
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ClassicA4Layout } from '@/components/invoice-templates/classic-a4';
import html2canvas from 'html2canvas';
import { useAppState } from '@/contexts/app-state-context';

export interface WatakEntry {
    id: string;
    sNo: string;
    date: string;
    date2?: string;
    watakNo: string;
    customerName: string;
    customerUrdu?: string;
    khata?: string;
    entries: {
        peti?: number;
        daba?: number;
        variety: string;
        rate: number;
        type: 'Patti' | 'Dabba';
        qty: number;
        total: number;
        isForwarded?: boolean;
    }[];
    totals: {
      pattiQty: number;
      dabbaQty: number;
      totalQty: number;
      subtotal: number;
      cgst: number;
      sgst: number;
      totalTax: number;
      grossSale: number;
      commissionAmount: number;
      serviceCharges: number;
      labour: number;
      association: number;
      security: number;
      totalExpenses: number;
      netSale: number;
    }
    freight: number;
}

const getCanonicalName = (name: string): string => {
    if (!name) return '';
    return name.trim();
};


const defaultGrowers: { name: string, address: string }[] = [
    { name: 'AB. Majeed Lone S/P', address: 'R/o Nadihal Bla.' },
    { name: 'AB. Salaam Lone K/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Ayoub Khan', address: 'R/o Nadihal Bla.' },
    { name: 'Nazir Ahmad Dar (Happa)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Maqbool Dar (Happa)', address: 'R/o Nadihal Bla.' },
    { name: 'Mushtaq Ahmad Lone K/P', address: 'R/o Nadihal Bla.' },
    { name: 'Manzoor Ahmad Lone K/P', address: 'R/o Nadihal Bla.' },
    { name: 'Naseer Ahmad Bhat', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohd. Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohd. Bhat', address: 'R/o Nadihal Bla.' },
    { name: 'Nazir Ahmad Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mushtaq Ahmad Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Maqbool Baigh', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Shabaan Ahangar', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Akbar Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Tanveer Ahmad Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Shabaan Lone (Lama)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Arif Lone (Uffa)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Subhan Parry', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohiuddin Lone (Poltry)', address: 'R/o Nadihal Bla.' },
    { name: 'Majoor Ahmad Lone ®', address: 'R/o Nadihal Bla.' },
    { name: 'Jaana ® B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Rayees Rajab ®', address: 'R/o Nadihal Bla.' },
    { name: 'Hilal Ahmad Wani', address: 'R/o Nadihal Bla.' },
    { name: 'Javid Ahmad Sheikh', address: 'R/o Shanoo, Mawer Handwara' },
    { name: 'Manzoor Ah. Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Ashraf wani', address: 'R/o Nadihal Bla.' },
    { name: 'Bashir Ah. Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Yousuf Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Farooq Ahmad Lone (Lama)', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohiuddin Lone (H)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd Yousuf Lone (Waza)', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Nabi Lone', address: 'R/o Nadihal Bla.' },
    { name: 'Farooq Ahmad Bhat', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Nabi Wani', address: 'R/o Nadihal Bla.' }
];

export default function SalesRegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const years = new Set<number>();
  const { selectedYear, setSelectedYear } = useAppState();
 

  const [wataks, setWataks] = React.useState<WatakEntry[]>([]);
  const [growers, setGrowers] = React.useState<string[]>([]);
  const [selectedGrower, setSelectedGrower] = React.useState('All Growers');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>('grid');
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [partyNameMap, setPartyNameMap] = React.useState<Map<string, string>>(new Map());
  const [availableYears, setAvailableYears] = React.useState<number[]>([]);

  const fetchWataks = React.useCallback(async () => {
    setIsLoading(true);
    if(typeof window !== 'undefined') {
        const items: any[] = wataks || [];
        const growerMap = new Map<string, string>(); // Map from canonical name -> canonical name
        const itemYear = items?.[0]?.date
  ? Number(String(items?.[0]?.date).split(/[-/]/).find(part => part.length === 4))
  : null;

        const addPartyToMap = (name: string) => {
             const canonical = getCanonicalName(name);
             if (!growerMap.has(canonical)) {
                growerMap.set(canonical, name);
            }
        };

        defaultGrowers.forEach(p => addPartyToMap(p.name));

        // Fetch parties from MongoDB
        const partiesResult = await fetch('/api/documents?prefix=party-').then(r => r.json());
        if (partiesResult.success && partiesResult.data) {
            partiesResult.data.forEach((party: any) => {
                if (party.name) addPartyToMap(party.name);
            });
        }

        // Fetch invoices from MongoDB
        const invoicesResult = await fetch('/api/documents?prefix=invoice-').then(r => r.json());
        if (invoicesResult.success && invoicesResult.data) {
            invoicesResult.data.forEach((watak: any) => {
                if (watak.date && Number(String(watak.date).split(/[-/]/).find((p: string) => p.length === 4)) === selectedYear) {
                    items.push(watak);
                    if (watak.customerName) addPartyToMap(watak.customerName);
                }
            });
        }
        setWataks(items.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setPartyNameMap(growerMap);
        const uniqueGrowers = ['All Growers', ...Array.from(growerMap.values())].sort();
        setGrowers(uniqueGrowers);
    }
    setIsLoading(false);
  }, [selectedYear]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole'));
    }
    fetchWataks();
  }, [fetchWataks]);

  const yearlyCount = React.useMemo(() => {
    if(!wataks) return 0;
    return wataks.length;
  }, [wataks]);


  const filteredWataks = wataks
    .filter(w => {
        if (selectedGrower === 'All Growers') return true;
        const canonicalName = partyNameMap.get(getCanonicalName(w.customerName)) || w.customerName;
        return canonicalName === selectedGrower;
    }).filter(w => {
        if (!searchTerm) return true;
        const lowerCaseSearch = searchTerm.toLowerCase();
        const canonicalName = partyNameMap.get(getCanonicalName(w.customerName)) || w.customerName;
        return (
            canonicalName.toLowerCase().includes(lowerCaseSearch) ||
            w.sNo.toLowerCase().includes(lowerCaseSearch) ||
            (w.watakNo && w.watakNo.toLowerCase().includes(lowerCaseSearch))
        );
    });

  const footerTotals = filteredWataks.reduce((acc, watak) => {
    acc.grossSale += watak.totals.grossSale || 0;
    acc.totalExpenses += watak.totals.totalExpenses || 0;
    acc.netSale += watak.totals.netSale || 0;
    acc.pattiQty += watak.totals.pattiQty || 0;
    acc.dabbaQty += watak.totals.dabbaQty || 0;
    return acc;
  }, { grossSale: 0, totalExpenses: 0, netSale: 0, pattiQty: 0, dabbaQty: 0 });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Sales Register - ${selectedGrower} (${selectedYear})`, 14, 15);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 14, 22);

    const tableData = filteredWataks.map(w => {
        const canonicalName = partyNameMap.get(getCanonicalName(w.customerName)) || w.customerName;
        return [
            new Date(w.date).toLocaleDateString('en-GB'),
            w.sNo,
            w.watakNo,
            canonicalName,
            w.totals.pattiQty || 0,
            w.totals.dabbaQty || 0,
            `Rs. ${w.totals.grossSale.toFixed(2)}`,
            `Rs. ${w.totals.totalExpenses.toFixed(2)}`,
            `Rs. ${w.totals.netSale.toFixed(2)}`
        ]
    });

    autoTable(doc, {
        head: [['Date', 'Invoice No.', 'Watak No.', 'Khata (Grower)', 'Peti', 'Dabba', 'Gross Sale', 'Total Exp.', 'Net Sale']],
        body: tableData,
        foot: [[
            'Total', '', '', '', footerTotals.pattiQty, footerTotals.dabbaQty, `Rs. ${footerTotals.grossSale.toFixed(2)}`, `Rs. ${footerTotals.totalExpenses.toFixed(2)}`, `Rs. ${footerTotals.netSale.toFixed(2)}`
        ]],
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] }
    });

    doc.save(`Sales-Register-${selectedGrower}-${selectedYear}.pdf`);
  };

  const exportAllToPDFs = async () => {
    if (filteredWataks.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Invoices to Download',
        description: 'There are no invoices matching your current filters.',
      });
      return;
    }
  
    setIsDownloading(true);
    toast({
      title: 'Starting Bulk Download',
      description: `Preparing to download ${filteredWataks.length} invoices. This may take a while.`,
    });
  
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '148mm';
    document.body.appendChild(tempContainer);
  
    // Dynamically import ReactDOM only on the client
    const ReactDOM = (await import('react-dom/client')).default;
    const root = ReactDOM.createRoot(tempContainer);
  
    for (const billData of filteredWataks) {
      try {
        await new Promise<void>((resolve) => {
          root.render(<ClassicA4Layout billData={billData} pageUrl={`${window.location.origin}/bill/view/${billData.sNo}?style=classic`} />);
          setTimeout(async () => {
            const canvas = await html2canvas(tempContainer.children[0] as HTMLElement, {
              scale: 2,
              useCORS: true,
              backgroundColor: '#FDFEE2',
            });
  
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            doc.save(`Invoice-${billData.sNo}_${billData.customerName}.pdf`);
            
            await new Promise(r => setTimeout(r, 300));
            resolve();
          }, 100);
        });
      } catch (error) {
        console.error("Failed to generate PDF for invoice:", billData.sNo, error);
        toast({
          variant: "destructive",
          title: `Failed to Download Invoice #${billData.sNo}`,
          description: "An error occurred while generating this PDF.",
        });
      }
    }
    
    root.unmount();
    document.body.removeChild(tempContainer);
  
    setIsDownloading(false);
    toast({
        title: 'Bulk Download Complete',
        description: `Finished downloading ${filteredWataks.length} invoices.`,
    });
  };

  const exportToExcel = () => {
      const worksheetData = filteredWataks.map(w => {
        const canonicalName = partyNameMap.get(getCanonicalName(w.customerName)) || w.customerName;
        return {
            'Date': new Date(w.date).toLocaleDateString('en-GB'),
            'Invoice No.': w.sNo,
            'Watak No.': w.watakNo,
            'Khata (Grower)': canonicalName,
            'Original Name': w.customerName,
            'Peti': w.totals.pattiQty || 0,
            'Dabba': w.totals.dabbaQty || 0,
            'Gross Sale': w.totals.grossSale,
            'Total Expenses': w.totals.totalExpenses,
            'Net Sale': w.totals.netSale
        }
      });
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.sheet_add_aoa(worksheet, [
        ["Total", "", "", "", "", footerTotals.pattiQty, footerTotals.dabbaQty, footerTotals.grossSale, footerTotals.totalExpenses, footerTotals.netSale]
    ], { origin: -1 });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales');
    XLSX.writeFile(workbook, `Sales-Register-${selectedGrower}-${selectedYear}.xlsx`);
  };

  const handleShare = () => {
    if (selectedGrower === 'All Growers') {
        toast({
            variant: 'destructive',
            title: 'Select a Grower',
            description: 'Please select a specific grower from the dropdown to share their portal link.',
        });
        return;
    }

    let message = `Salaam ${selectedGrower},\n\n`;
    message += `You can view your complete account ledger with Firdous Ahmad & Company by clicking the link below. The portal will open directly to your account.\n\n`;
    const encodedCustomerName = encodeURIComponent(selectedGrower);
    const portalUrl = `${window.location.origin}/portal/login?customer=${encodedCustomerName}`;
    message += `Portal Link: ${portalUrl}\n\n`;
    message += `Thank you for your business!`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const navigateToBill = (id: string) => {
    router.push(`/invoice/${id}`);
  }

  const handleDelete = async (sNo: string) => {
    if(userRole !== 'admin') {
      toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to delete invoices."});
      return;
    }
    if(!window.confirm(`Are you sure you want to delete Invoice #${sNo}? This cannot be undone.`)) return;
    
    localStorage.removeItem(`invoice-${sNo}`);
    toast({ title: "Invoice Deleted", description: `Invoice #${sNo} has been deleted locally.`});
    fetchWataks();
  }
  
  const isDownloadAllDisabled = isDownloading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                  <CardTitle className="flex items-center gap-2">
                      Sales Register
                  </CardTitle>
                  <Select onValueChange={(value) => setSelectedYear(Number(value))} defaultValue={String(selectedYear)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a year" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableYears.map(year => (
                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {!isLoading && <Badge variant="outline">{yearlyCount} This Year ({selectedYear})</Badge>}
                  <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                          type="search"
                          placeholder="Search by Invoice No, Watak No, Name..."
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
                  <Button size="sm" onClick={handleShare} variant="outline" className="gap-1">
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
                    disabled={isDownloadAllDisabled}
                    >
                    {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DownloadCloud className="h-3.5 w-3.5" />}
                    Download All
                </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={exportToExcel}>
                      <FileDown className="h-3.5 w-3.5" />
                      Excel
                  </Button>
                  <Button size="sm" className="gap-1" onClick={() => router.push('/sales')}>
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                          Add Invoice
                      </span>
                  </Button>
              </div>
          </div>
          <CardDescription>Track and manage customer credit and sales invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
              <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
          ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredWataks.map((watak, index) => {
                      const canonicalName = partyNameMap.get(getCanonicalName(watak.customerName)) || watak.customerName;
                      return (
                      <motion.div 
                        key={watak.id} 
                        onClick={() => navigateToBill(watak.sNo)} 
                        className="cursor-pointer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ scale: 1.05, zIndex: 10 }}
                        whileTap={{ scale: 0.98 }}
                      >
                          <DocumentCard type="watak" title={`Invoice #${watak.watakNo || watak.sNo}`}>
                              <p className="text-lg font-semibold">{canonicalName}</p>
                              {watak.customerUrdu && <p className="font-urdu text-xl mt-1">{watak.customerUrdu}</p>}
                              <p className="text-sm mt-2">Date: {new Date(watak.date).toLocaleDateString()}</p>
                              <p className="text-2xl font-bold mt-4">₹{watak.totals.netSale.toFixed(2)}</p>
                          </DocumentCard>
                      </motion.div>
                  )})}
              </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice No.</TableHead>
                <TableHead>Watak No.</TableHead>
                <TableHead>Khata (Grower)</TableHead>
                <TableHead>Peti</TableHead>
                <TableHead>Dabba</TableHead>
                <TableHead className="text-right">Gross Sale</TableHead>
                <TableHead className="text-right">Total Exp.</TableHead>
                <TableHead className="text-right">Net Sale</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWataks.map((watak: WatakEntry) => {
                const canonicalName = partyNameMap.get(getCanonicalName(watak.customerName)) || watak.customerName;
                return (
                <motion.tr
                    key={watak.id}
                    className="hover:bg-muted/50 transition-colors"
                    whileHover={{ scale: 1.02, y: -2, boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }}
                >
                  <TableCell>{new Date(watak.date).toLocaleDateString('en-GB')}</TableCell>
                  <TableCell>{watak.sNo}</TableCell>
                  <TableCell>{watak.watakNo}</TableCell>
                  <TableCell className="font-medium">{canonicalName}</TableCell>
                  <TableCell>{watak.totals.pattiQty || 0}</TableCell>
                  <TableCell>{watak.totals.dabbaQty || 0}</TableCell>
                  <TableCell className="text-right">₹{watak.totals.grossSale.toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{watak.totals.totalExpenses.toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{watak.totals.netSale.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => navigateToBill(watak.sNo)}>
                      <FilePenLine className="h-4 w-4" />
                    </Button>
                    {userRole === 'admin' && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(watak.sNo)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </motion.tr>
              )})}
              <TableRow className="font-bold bg-muted">
                  <TableCell colSpan={4} className="text-right">Total</TableCell>
                  <TableCell>{footerTotals.pattiQty}</TableCell>
                  <TableCell>{footerTotals.dabbaQty}</TableCell>
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

      <Card>
        <CardHeader>
            <CardTitle>Recent Wataks</CardTitle>
            <CardDescription>A list of your 5 most recent sales invoices (wataks).</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : wataks.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice No.</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Net Sale</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {wataks.slice(0, 5).map(watak => (
                            <TableRow key={watak.id}>
                                <TableCell className="font-medium">{watak.sNo}</TableCell>
                                <TableCell>{watak.customerName}</TableCell>
                                <TableCell>{new Date(watak.date).toLocaleDateString('en-GB')}</TableCell>
                                <TableCell className="text-right font-mono">₹{watak.totals.netSale.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center text-muted-foreground mt-6 py-12 border-2 border-dashed rounded-lg">
                    <p>No sales have been recorded yet for {selectedYear}.</p>
                    <p className="text-sm">Your recent wataks will appear here once you create them.</p>
                </div>
            )}
        </CardContent>
      </Card>

    </div>
  );
}


    

    



