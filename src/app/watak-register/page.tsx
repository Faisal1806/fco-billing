
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
import { ChevronDown, PlusCircle, Loader2, FilePenLine, Trash2, List, LayoutGrid, Search, FileDown } from 'lucide-react';
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
    watakNo: string;
    customerName: string;
    customerUrdu?: string;
    entries: {
        peti: number;
        daba: number;
        variety: string;
        rate: number;
        type: 'Patti' | 'Dabba';
        qty: number;
        total: number;
    }[];
    totals: {
      pattiQty: number;
      dabbaQty: number;
      totalQty: number;
      grossSale: number;
      totalExpenses: number;
      netSale: number;
    }
    freight: number;
}

const normalizeName = (name: string): string => {
    if (!name) return '';
    return name
        .toUpperCase()
        .replace(/R\/O.*$/i, '') // Remove address part
        .replace(/\(.*\)/, '') // Remove anything in parentheses like (LAMA)
        .replace(/\b(MOHAMMAD|MOHD|MD|GH)\b/g, 'MOHAMMAD')
        .replace(/\b(AHMAD|AH)\b/g, 'AHMAD')
        .replace(/S\/P|B\/P|K\/P|®/g, '') // Remove suffixes
        .replace(/[\.\,\']/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
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
    { name: 'GH. Mohiuddin Lone (Potty)', address: 'R/o Nadihal Bla.' },
    { name: 'Majoor Ahmad Lone ®', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Akbar Lone (Lama)', address: 'R/o Nadihal Bla.' },
    { name: 'Jaana ® B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Rayees Rajab ®', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Nabi Lone', address: 'R/o Nadihal Bla.' },
    { name: 'Hilal Ahmad Wani', address: 'R/o Nadihal Bla.' },
    { name: 'Javid Ahmad Sheikh', address: 'R/o Shanoo, Mawer Handwara' },
    { name: 'Manzoor Ah. Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Farooq Ahmad Lone (Lama)', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Ashraf wani', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Yousuf Lone B/P', address: 'R/o Nadihal Bla.' },
    { name: 'Mohd. Yousuf Lone (Waza)', address: 'R/o Nadihal Bla.' },
    { name: 'Farooq Ahmad Bhat', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Nabi Wani', address: 'R/o Nadihal Bla.' },
    { name: 'GH. Mohiuddin Lone ®', address: 'R/o Nadihal Baramulla' },
    { name: 'Bashir Ah. Lone B/P', address: 'R/o Nadihal Bla.' }
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
        const growerMap = new Map<string, string>();
        
        defaultGrowers.forEach(p => {
             const normalized = normalizeName(p.name);
             if (!growerMap.has(normalized)) {
                growerMap.set(normalized, p.name);
            }
        });


        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('invoice-')) {
                try {
                    const watak = JSON.parse(localStorage.getItem(key)!);
                    items.push(watak);
                    const normalized = normalizeName(watak.customerName);
                    if (!growerMap.has(normalized)) {
                        growerMap.set(normalized, watak.customerName);
                    }
                } catch(e) {
                    console.error("Failed to parse watak from local storage", e);
                }
            } else if (key?.startsWith('party-')) {
                try {
                    const party = JSON.parse(localStorage.getItem(key)!);
                    const normalized = normalizeName(party.name);
                    if (!growerMap.has(normalized)) {
                        growerMap.set(normalized, party.name);
                    }
                } catch(e) {
                    console.error("Failed to parse party from local storage", e);
                }
            }
        }
        setWataks(items.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
        if (selectedGrower === 'All Growers') return true;
        const canonicalName = partyNameMap.get(normalizeName(w.customerName));
        return canonicalName === selectedGrower;
    })
    .filter(w => {
      if (!searchTerm) return true;
      const lowerCaseSearch = searchTerm.toLowerCase();
      const canonicalName = partyNameMap.get(normalizeName(w.customerName)) || w.customerName;
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
    doc.text(`Sales Register - ${selectedGrower}`, 14, 15);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 14, 22);

    const tableData = filteredWataks.map(w => {
        const canonicalName = partyNameMap.get(normalizeName(w.customerName)) || w.customerName;
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

  const exportToExcel = () => {
      const worksheetData = filteredWataks.map(w => {
        const canonicalName = partyNameMap.get(normalizeName(w.customerName)) || w.customerName;
        return {
            'Date': new Date(w.date).toLocaleDateString('en-GB'),
            'Invoice No.': w.sNo,
            'Watak No.': w.watakNo,
            'Khata (Grower)': canonicalName,
            'Peti': w.totals.pattiQty || 0,
            'Dabba': w.totals.dabbaQty || 0,
            'Gross Sale': w.totals.grossSale,
            'Total Expenses': w.totals.totalExpenses,
            'Net Sale': w.totals.netSale
        }
      });
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.sheet_add_aoa(worksheet, [
        ["Total", "", "", "", footerTotals.pattiQty, footerTotals.dabbaQty, footerTotals.grossSale, footerTotals.totalExpenses, footerTotals.netSale]
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

  return (
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
                    const canonicalName = partyNameMap.get(normalizeName(watak.customerName)) || watak.customerName;
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
              const canonicalName = partyNameMap.get(normalizeName(watak.customerName)) || watak.customerName;
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
  );
}
