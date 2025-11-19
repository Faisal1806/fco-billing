

'use client'

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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import DocumentCard from '@/components/DocumentCard';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Badge } from '@/components/ui/badge';

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
      grossSale: number;
      commissionAmount: number;
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
    { name: 'Mohd. Akbar Lone (Lama)', address: 'R/o Nadihal Bla.' },
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

  const [wataks, setWataks] = React.useState<WatakEntry[]>([]);
  const [growers, setGrowers] = React.useState<string[]>([]);
  const [selectedGrower, setSelectedGrower] = React.useState('All Growers');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>('grid');
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [partyNameMap, setPartyNameMap] = React.useState<Map<string, string>>(new Map());

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole'));
    }
    fetchWataks();
  }, []);

  const fetchWataks = () => {
    setIsLoading(true);
    if(typeof window !== 'undefined') {
        const items = [];
        const growerMap = new Map<string, string>(); // Map from canonical name -> canonical name
        
        const addPartyToMap = (name: string) => {
             const canonical = getCanonicalName(name);
             if (!growerMap.has(canonical)) {
                growerMap.set(canonical, name);
            }
        };

        defaultGrowers.forEach(p => addPartyToMap(p.name));

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('party-')) {
                try {
                    addPartyToMap(JSON.parse(localStorage.getItem(key)!).name);
                } catch(e) { console.error("Failed to parse party:", e); }
            }
        }
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('invoice-')) {
                try {
                    const watak = JSON.parse(localStorage.getItem(key)!);
                    items.push(watak);
                    // Also ensure any name from an invoice is considered for mapping,
                    // in case it wasn't in the parties list
                    addPartyToMap(watak.customerName);
                } catch(e) {
                    console.error("Failed to parse watak from local storage", e);
                }
            }
        }
        setWataks(items.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setPartyNameMap(growerMap);
        const uniqueGrowers = ['All Growers', ...Array.from(growerMap.values()).sort()];
        setGrowers(uniqueGrowers);
    }
    setIsLoading(false);
  }

  const yearlyCount = React.useMemo(() => {
    if(!wataks) return 0;
    const currentYear = new Date().getFullYear();
    return wataks.filter(w => new Date(w.date).getFullYear() === currentYear).length;
  }, [wataks]);


  React.useEffect(() => {
    fetchWataks();
  }, [toast]);

  const filteredWataks = wataks
    .filter(w => {
        if (selectedGrower === 'All Growers' && !searchTerm) return true;
        const canonicalName = partyNameMap.get(getCanonicalName(w.customerName)) || w.customerName;
        if (selectedGrower !== 'All Growers' && canonicalName !== selectedGrower) return false;
        if (searchTerm) {
             const lowerCaseSearch = searchTerm.toLowerCase();
             return (
                canonicalName.toLowerCase().includes(lowerCaseSearch) ||
                w.sNo.toLowerCase().includes(lowerCaseSearch) ||
                (w.watakNo && w.watakNo.toLowerCase().includes(lowerCaseSearch))
            );
        }
        return true;
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
    doc.text(`Sales Register - ${selectedGrower}`, 14, 15);
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
        head: [['Date', 'Invoice No.', 'Watak No.', 'Khata (Grower)', 'Patti', 'Dabba', 'Gross Sale', 'Total Exp.', 'Net Sale']],
        body: tableData,
        foot: [[
            'Total', '', '', '', footerTotals.pattiQty, footerTotals.dabbaQty, `Rs. ${footerTotals.grossSale.toFixed(2)}`, `Rs. ${footerTotals.totalExpenses.toFixed(2)}`, `Rs. ${footerTotals.netSale.toFixed(2)}`
        ]],
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] }
    });

    doc.save(`Sales-Register-${selectedGrower}.pdf`);
  };

  const exportAllToPDFs = async () => {
    let growerToDownload = selectedGrower;

    if (selectedGrower === 'All Growers' && searchTerm) {
        const searchedNames = new Set(filteredWataks.map(w => partyNameMap.get(getCanonicalName(w.customerName)) || w.customerName));
        if (searchedNames.size === 1) {
            growerToDownload = Array.from(searchedNames)[0];
        }
    }
    
    if (growerToDownload === 'All Growers' || filteredWataks.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Select a Grower',
        description: 'You must select a specific grower with invoices to use this feature.',
      });
      return;
    }

    setIsDownloading(true);
    toast({
      title: 'Starting Bulk Download',
      description: `Preparing to download ${filteredWataks.length} invoices for ${growerToDownload}.`,
    });

    for (let i = 0; i < filteredWataks.length; i++) {
      const billData = filteredWataks[i];
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a5'
        });
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 10;

        doc.setFont('helvetica');

        // Header
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('🍎 F.Co App', margin, margin);
        doc.text('🍎 F.Co App', pageWidth - margin, margin, { align: 'right' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('Prop: Firdous Ahmad Lone (Nadihal)', pageWidth / 2, margin - 2, { align: 'center' });
        doc.text('Cell: 7006136330, 9797002164, 9906740921', pageWidth / 2, margin + 1, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#166534');
        doc.text('FIRDOUS AHMAD & COMPANY', pageWidth / 2, margin + 6, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text('Fruit Merchants & Commission Agents', pageWidth / 2, margin + 10, { align: 'center' });
        doc.setFontSize(6);
        doc.text('SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.', pageWidth / 2, margin + 13, { align: 'center' });
        doc.setLineWidth(0.5);
        doc.setDrawColor('#16a34a');
        doc.line(margin, margin + 15, pageWidth - margin, margin + 15);

        // Bill Info
        let billInfoY = margin + 22;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`M/s: ${billData.customerName}`, margin, billInfoY);
        if (billData.khata) {
            billInfoY += 5;
            doc.text(`Khata: ${billData.khata}`, margin, billInfoY);
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Bill No: ${billData.sNo}`, pageWidth - margin, margin + 22, { align: 'right' });
        doc.text(`Date: ${new Date(billData.date).toLocaleDateString('en-GB')}`, pageWidth - margin, margin + 26, { align: 'right' });
        if(billData.date2) {
             doc.text(`Date 2: ${new Date(billData.date2).toLocaleDateString('en-GB')}`, pageWidth - margin, margin + 30, { align: 'right' });
        }
        if(billData.watakNo) {
            doc.text(`Watak No: ${billData.watakNo}`, pageWidth - margin, margin + 34, { align: 'right' });
        }

        // Table
        const tableData = billData.entries.map(e => [
            e.type,
            e.variety,
            e.qty.toString(),
            e.isForwarded ? 'Forwarded' : `₹${e.rate.toFixed(2)}`,
            e.isForwarded ? 'Forwarded' : `₹${(e.total).toFixed(2)}`
        ]);
        autoTable(doc, {
            head: [['TYPE', 'VARIETY', 'QTY', 'RATE', 'GROSS']],
            body: tableData,
            startY: billInfoY + 8,
            theme: 'grid',
            headStyles: { fillColor: '#dcfce7', textColor: '#166534', fontStyle: 'bold', halign: 'center', lineColor: '#15803d', lineWidth: 0.1 },
            styles: { fontSize: 8, cellPadding: 1.5, font: 'helvetica', lineColor: '#15803d', lineWidth: 0.1 },
            columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } }
        });

        const finalY = (doc as any).lastAutoTable.finalY;
        
        // Totals
        const summaryX = pageWidth / 2 + 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Total Quantity: ${billData.totals.totalQty} (Patti: ${billData.totals.pattiQty}, Dabba: ${billData.totals.dabbaQty})`, margin, finalY + 8);
        const expenseLines = [
            { label: 'Gross Sale:', value: `₹${billData.totals.grossSale.toFixed(2)}` }, { label: 'Freight:', value: `- ₹${billData.freight.toFixed(2)}` },
            { label: 'Labour:', value: `- ₹${billData.totals.labour.toFixed(2)}` }, { label: 'Association:', value: `- ₹${billData.totals.association.toFixed(2)}` },
            { label: 'Security:', value: `- ₹${billData.totals.security.toFixed(2)}` }, { label: 'Commission:', value: `- ₹${billData.totals.commissionAmount.toFixed(2)}` }
        ];
        let currentY = finalY + 8;
        doc.setFont('helvetica', 'normal');
        expenseLines.forEach(line => { doc.text(line.label, summaryX, currentY, { align: 'left' }); doc.text(line.value, pageWidth - margin, currentY, { align: 'right' }); currentY += 4; });
        doc.setLineWidth(0.2);
        doc.line(summaryX, currentY, pageWidth - margin, currentY); currentY += 4;
        doc.setFont('helvetica', 'bold');
        doc.text('Total Exp:', summaryX, currentY, { align: 'left' });
        doc.text(`- ₹${billData.totals.totalExpenses.toFixed(2)}`, pageWidth - margin, currentY, { align: 'right' }); currentY += 4;
        doc.line(summaryX, currentY, pageWidth - margin, currentY); currentY += 5;
        doc.setFontSize(12);
        doc.text('Net Sale:', summaryX, currentY, { align: 'left' });
        doc.text(`₹${billData.totals.netSale.toFixed(2)}`, pageWidth - margin, currentY, { align: 'right' });

        doc.save(`Invoice-${billData.sNo}_${billData.customerName}.pdf`);
        
        // Give browser a moment to process the download
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
          console.error("Failed to generate PDF for invoice:", billData.sNo, error);
          toast({
            variant: "destructive",
            title: `Failed to Download Invoice #${billData.sNo}`,
            description: "An error occurred while generating this PDF.",
          });
      }
    }

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
    XLSX.writeFile(workbook, `Sales-Register-${selectedGrower}.xlsx`);
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
  
  const isDownloadAllDisabled = (selectedGrower === 'All Growers' && !searchTerm) || isDownloading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                  <CardTitle className="flex items-center gap-2">
                      Sales Register
                      {!isLoading && <Badge variant="outline">{yearlyCount} This Year</Badge>}
                  </CardTitle>
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
                  {filteredWataks.map((watak) => {
                      const canonicalName = partyNameMap.get(getCanonicalName(watak.customerName)) || watak.customerName;
                      return (
                      <div key={watak.id} onClick={() => navigateToBill(watak.sNo)} className="cursor-pointer">
                          <DocumentCard type="watak" title={`Invoice #${watak.watakNo || watak.sNo}`}>
                              <p className="text-lg font-semibold">{canonicalName}</p>
                              {watak.customerUrdu && <p className="font-urdu text-xl mt-1">{watak.customerUrdu}</p>}
                              <p className="text-sm mt-2">Date: {new Date(watak.date).toLocaleDateString()}</p>
                              <p className="text-2xl font-bold mt-4">₹{watak.totals.netSale.toFixed(2)}</p>
                          </DocumentCard>
                      </div>
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
                <TableRow key={watak.id}>
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
                </TableRow>
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
                    <p>No sales have been recorded yet.</p>
                    <p className="text-sm">Your recent wataks will appear here once you create them.</p>
                </div>
            )}
        </CardContent>
      </Card>

    </div>
  );
}
