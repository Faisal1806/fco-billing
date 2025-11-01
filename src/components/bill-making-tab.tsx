
'use client';

import * as React from 'react';
import { useMemo, useRef, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Separator } from './ui/separator';
import { PlusCircle, Trash2, FilePenLine, FilePlus, Share, FileText, ChevronsUpDown, Check, Search } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { ScrollArea } from './ui/scroll-area';
import Lottie from 'lottie-react';
import type { WatakExtractOutput } from '@/ai/flows/extract-watak-flow';
import { useApiKey } from '@/hooks/use-api-key';
import { Badge } from '@/components/ui/badge';
import { PartySelector } from './party-selector';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from '@/lib/utils';
import { saveDocument, deleteDocument } from '@/lib/actions';
import { Checkbox } from './ui/checkbox';


type Row = {
  type: 'Patti' | 'Dabba';
  qty: number;
  variety: string;
  rate: number;
  isForwarded: boolean;
};

const emptyRow: Row = { type: 'Patti', qty: 0, variety: '', rate: 0, isForwarded: false };
const initialRows: Row[] = Array.from({ length: 5 }, () => ({ ...emptyRow }));


export function BillMakingTab() {
  const [sNo, setSNo] = useState('');
  const [ms, setMs] = useState('');                 // M/S (customer)
  const [khata, setKhata] = useState('');           // Khata Name
  const [watakNo, setWatakNo] = useState('');   // Watak No
  const [date, setDate] = useState('');
  const [date2, setDate2] = useState('');
  const [freight, setFreight] = useState<number>(0);
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [selectedReceiptNo, setSelectedReceiptNo] = useState('');


  // App State
  const { toast } = useToast();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableReceipts, setAvailableReceipts] = useState<any[]>([]);
  const [receiptPopoverOpen, setReceiptPopoverOpen] = useState(false);
  const [usedReceiptsMap, setUsedReceiptsMap] = useState<Map<string, string>>(new Map());
  const [loaderAnimation, setLoaderAnimation] = useState(null);
  const [savedWataks, setSavedWataks] = useState<any[]>([]);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');


  // Voice Input State
  const { apiKey, isApiKeySet } = useApiKey();
  
  const fetchBillsAndReceipts = () => {
      const bills = [];
      const receipts = [];
      const usedNos = new Map<string, string>();

      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('invoice-')) {
              try {
                  const bill = JSON.parse(localStorage.getItem(key)!);
                  bills.push(bill);
                  if (bill.linkedReceiptNo) {
                      usedNos.set(bill.linkedReceiptNo, bill.sNo);
                  }
              } catch(e) {
                  console.error("Failed to parse bill from local storage", e);
              }
          }
          if (key && key.startsWith('receipt-')) {
               try {
                  const receipt = JSON.parse(localStorage.getItem(key)!);
                  receipts.push(receipt);
              } catch(e) {
                  console.error("Failed to parse receipt from local storage", e);
              }
          }
      }
      setSavedWataks(bills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setAvailableReceipts(receipts.sort((a,b) => (a.no > b.no) ? 1 : -1));
      setUsedReceiptsMap(usedNos);
    };

  const yearlyCount = useMemo(() => {
    if(!savedWataks) return 0;
    const currentYear = new Date().getFullYear();
    return savedWataks.filter(w => new Date(w.date).getFullYear() === currentYear).length;
  }, [savedWataks]);
  
  const filteredWataks = useMemo(() => {
      if (!searchTerm) return savedWataks;
      const lowerCaseSearch = searchTerm.toLowerCase();
      return savedWataks.filter(watak => 
        watak.sNo?.toLowerCase().includes(lowerCaseSearch) ||
        watak.watakNo?.toLowerCase().includes(lowerCaseSearch) ||
        watak.customerName?.toLowerCase().includes(lowerCaseSearch)
      );
  }, [savedWataks, searchTerm]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
        setUserRole(localStorage.getItem('userRole'));
    }

    fetch('/animations/forms/fco_loader.json')
        .then(res => res.json())
        .then(data => setLoaderAnimation(data));

    fetchBillsAndReceipts();

    // Check for scanned data
    const scannedDataJSON = localStorage.getItem('scannedWatakData');
    if (scannedDataJSON) {
        try {
            const scannedData: WatakExtractOutput = JSON.parse(scannedDataJSON);
            
            const newRows = scannedData.entries.map(e => ({
                type: e.type,
                qty: e.qty,
                variety: e.variety,
                rate: e.rate,
                isForwarded: false
            }));
            
            setSNo(scannedData.sNo);
            setDate(scannedData.date);
            setMs(scannedData.customerName);
            setWatakNo(scannedData.watakNo);
            setKhata(scannedData.khata || '');
            setFreight(scannedData.freight || 0);
            setRows(newRows.length > 0 ? newRows : initialRows);
            
            toast({
                title: "Data Populated from Scan",
                description: "Review the extracted data and save the invoice.",
            });
            
            setIsEditing(false); // Treat as new bill
        } catch (e) {
            console.error("Error parsing scanned data", e);
            toast({ variant: 'destructive', title: "Error", description: "Could not parse the scanned data." });
        } finally {
            localStorage.removeItem('scannedWatakData');
        }
    }

  }, [toast]);

  const selectedReceipt = useMemo(() => {
    return availableReceipts.find(r => r.no === selectedReceiptNo);
  }, [selectedReceiptNo, availableReceipts]);

  const isReceiptUsed = usedReceiptsMap.has(selectedReceiptNo) && usedReceiptsMap.get(selectedReceiptNo) !== sNo;
  const formDisabled = isReceiptUsed;

  useEffect(() => {
    if (selectedReceipt && !isEditing) {
        setMs(selectedReceipt.customerName);
        setDate(selectedReceipt.date);
        
        const newRows: Row[] = [];
        selectedReceipt.entries.forEach((entry: any) => {
            if (entry.peti > 0) {
                newRows.push({ type: 'Patti', variety: entry.kind, qty: entry.peti, rate: 0, isForwarded: false });
            }
            if (entry.daba > 0) {
                newRows.push({ type: 'Dabba', variety: entry.kind, qty: entry.daba, rate: 0, isForwarded: false });
            }
        });

        if(newRows.length > 0) {
            setRows(newRows);
        } else {
            setRows(initialRows);
        }
        
        if (!isReceiptUsed) {
            toast({ title: "Invoice Populated", description: `Loaded details from Receipt #${selectedReceipt.no}. Please enter the rates.` });
        }
    }
  }, [selectedReceipt, isEditing, isReceiptUsed, toast]);

  // --- Calculations (ALL from your spec) ---
  const totals = useMemo(() => {
    const totalQty = rows.reduce((s, r) => s + (Number(r.qty) || 0), 0);
    const pattiQty = rows
      .filter(r => r.type === 'Patti')
      .reduce((s, r) => s + (Number(r.qty) || 0), 0);
    const dabbaQty = rows
      .filter(r => r.type === 'Dabba')
      .reduce((s, r) => s + (Number(r.qty) || 0), 0);

    const rowGross = rows.map(r => (r.isForwarded ? 0 : (Number(r.qty) || 0) * (Number(r.rate) || 0)));
    const totalGrossSale = rowGross.reduce((s, v) => s + v, 0);

    // Expenses by formula
    const labour = totalQty * 3;
    const association = totalQty * 0.1;
    const security = totalQty * 0.9;
    const commission = Math.floor(totalGrossSale * 0.12);

    const totalExp = commission + labour + association + security + (Number(freight) || 0);
    const netSale = totalGrossSale - totalExp;

    return {
      pattiQty,
      dabbaQty,
      totalQty,
      totalGrossSale,
      commission,
      labour,
      association,
      security,
      totalExp,
      netSale,
      rowGross,
    };
  }, [rows, freight]);

  const updateRow = (i: number, patch: Partial<Row>) => {
    setRows(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], ...patch };
      // if forwarded, zero out the rate
      if (patch.isForwarded === true) {
          copy[i].rate = 0;
      }
      return copy;
    });
  };

  const addRow = () => setRows(prev => [...prev, { ...emptyRow }]);
  const removeRow = (i: number) =>
    setRows(prev => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

    const resetForm = () => {
        setSNo('');
        setMs('');
        setKhata('');
        setWatakNo('');
        setDate('');
        setDate2('');
        setFreight(0);
        setRows(initialRows);
        setIsEditing(false);
        setSelectedReceiptNo('');
    };


  const saveBill = async () => {
     if (!sNo || !date || !ms) {
        toast({
            variant: 'destructive',
            title: 'Missing Details',
            description: 'Please fill in Invoice No, Date, and Customer Name before saving.',
        });
        return;
    }

    setIsSubmitting(true);
    const billId = sNo;
    const billData = {
      id: billId,
      sNo,
      date,
      date2,
      customerName: ms,
      khata,
      watakNo,
      freight: Number(freight) || 0,
      entries: rows.filter(r => r.qty > 0).map(r => ({
        type: r.type,
        qty: Number(r.qty),
        variety: r.variety,
        rate: Number(r.rate),
        isForwarded: r.isForwarded,
        total: r.isForwarded ? 0 : Number(r.qty) * Number(r.rate)
      })),
      totals: {
        pattiQty: totals.pattiQty,
        dabbaQty: totals.dabbaQty,
        totalQty: totals.totalQty,
        grossSale: Number(totals.totalGrossSale.toFixed(2)),
        commissionAmount: Number(totals.commission.toFixed(2)),
        labour: Number(totals.labour.toFixed(2)),
        association: Number(totals.association.toFixed(2)),
        security: Number(totals.security.toFixed(2)),
        totalExpenses: Number(totals.totalExp.toFixed(2)),
        netSale: Number(totals.netSale.toFixed(2)),
      },
      linkedReceiptNo: selectedReceiptNo,
    };
    
    localStorage.setItem(`invoice-${billId}`, JSON.stringify(billData));
    
    try {
        await saveDocument('invoices', billId, billData);
        toast({
            title: isEditing ? 'Invoice Updated & Synced' : 'Invoice Saved & Synced',
            description: 'The invoice has been successfully saved to the cloud.',
            isSuccess: true,
        });
    } catch(error) {
        console.error("Error saving to cloud", error);
        toast({
            variant: 'destructive',
            title: 'Cloud Sync Failed',
            description: 'Could not save the invoice to the cloud. It is saved locally.',
        });
    }
    
    fetchBillsAndReceipts();
    setIsEditing(true); // Ensure form stays in editing mode for the current bill
    setIsSubmitting(false);
  };

  const navigateToPrint = () => {
    if (!isEditing || !sNo) {
        toast({ variant: 'destructive', title: 'Cannot View', description: 'Please save the invoice first to generate a printable version.'});
        return;
    }
    router.push(`/invoice/${sNo}`);
  };

  const handleShare = () => {
    if (!isEditing || !sNo) {
      toast({ variant: 'destructive', title: 'Cannot Share', description: 'Please save the invoice first.' });
      return;
    }
    const message = `Dear ${ms}, Invoice No. ${watakNo || sNo}, Net Sale ₹${totals.netSale.toFixed(2)}. Thank you – F.Co`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  
    const loadWatakForEdit = (watak: any) => {
        setSNo(watak.sNo);
        setMs(watak.customerName);
        setKhata(watak.khata || '');
        setWatakNo(watak.watakNo || '');
        setDate(watak.date);
        setDate2(watak.date2 || '');
        setFreight(watak.freight || 0);
        const loadedRows = watak.entries.map((e: any) => ({
            type: e.type,
            qty: e.qty,
            variety: e.variety,
            rate: e.rate,
            isForwarded: e.isForwarded || false,
        }));

        setRows(loadedRows.length > 0 ? loadedRows : initialRows);
        setSelectedReceiptNo(watak.linkedReceiptNo || '');
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteWatak = async (sNo: string) => {
        if(userRole !== 'admin') {
            toast({ variant: "destructive", title: "Permission Denied" });
            return;
        }
        if(!window.confirm(`Are you sure you want to delete Invoice #${sNo}? This cannot be undone.`)) return;

        localStorage.removeItem(`invoice-${sNo}`);
        
        try {
            await deleteDocument('invoices', sNo);
            toast({ title: "Invoice Deleted", description: `Invoice #${sNo} has been deleted from local and cloud storage.`});
        } catch (error) {
            toast({ variant: "destructive", title: "Cloud Delete Failed", description: `Invoice #${sNo} was removed locally but failed to delete from the cloud.`});
        }
        
        fetchBillsAndReceipts();
        if(sNo === sNo) { // if the deleted invoice is the one being edited
            resetForm();
        }
    };
  
  return (
    <>
    <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div className="text-sm font-bold">🍎 F.Co</div>
                <div className="text-center flex-1">
                    <h2 className="text-2xl font-bold">F.Co - FIRDOUS AHMAD & COMPANY</h2>
                    <p className="text-sm text-muted-foreground">Fruit Merchants & Commission Agents</p>
                    <p className="text-xs text-muted-foreground">SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.</p>
                    <p className="text-xs text-muted-foreground">Prop: Firdous Ahmad Lone (Nadihal) | Cell: 7006136330, 9797002164, 9906740921 | Email: lone07936@gmail.com</p>
                </div>
                <div className="text-sm font-bold">🍎 F.Co</div>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
             {/* Header fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end p-4 border rounded-md bg-muted/50">
                <div className="md:col-span-2">
                    <Label>Load Details from Goods Receipt</Label>
                    <Popover open={receiptPopoverOpen} onOpenChange={setReceiptPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={receiptPopoverOpen}
                          className="w-full justify-between"
                        >
                          {selectedReceiptNo
                            ? `Receipt #${selectedReceiptNo} - ${availableReceipts.find(r => r.no === selectedReceiptNo)?.customerName}`
                            : "Select a receipt to auto-fill..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search receipt no. or name..." />
                          <CommandList>
                            <CommandEmpty>No receipt found.</CommandEmpty>
                            <CommandGroup>
                              {availableReceipts.map((r) => {
                                const isUsed = usedReceiptsMap.has(r.no);
                                const usedForInvoice = usedReceiptsMap.get(r.no);
                                return (
                                <CommandItem
                                  key={r.no}
                                  value={`${r.no} ${r.customerName} ${new Date(r.date).toLocaleDateString()}`}
                                  onSelect={() => {
                                    setSelectedReceiptNo(r.no);
                                    setReceiptPopoverOpen(false);
                                  }}
                                  className={cn('cursor-pointer')}
                                  disabled={isUsed && sNo !== usedForInvoice}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedReceiptNo === r.no ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  Receipt #{r.no} - {r.customerName}
                                  {isUsed && <span className="ml-auto text-xs text-destructive">(Used in Invoice #{usedForInvoice})</span>}
                                </CommandItem>
                              )})}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                     {isReceiptUsed && (
                        <Badge variant="destructive" className="mt-2">
                            Watak already made for Invoice #{usedReceiptsMap.get(selectedReceiptNo)}. Form is in view-only mode.
                        </Badge>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 items-end">
                <div className="md:col-span-2">
                    <Label>Invoice No</Label>
                    <div className="flex items-center gap-2">
                        <Input value={sNo} onChange={e => setSNo(e.target.value)} disabled={isEditing || isReceiptUsed} />
                         {(isEditing || isReceiptUsed) && (
                            <Button variant="outline" size="icon" onClick={resetForm} title="Create a new invoice">
                                <FilePlus className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
                 <div>
                    <Label>Date</Label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} disabled={formDisabled} />
                </div>
                 <div>
                    <Label>Date 2 (Optional)</Label>
                    <Input type="date" value={date2} onChange={e => setDate2(e.target.value)} disabled={formDisabled} />
                </div>
                <div className="col-span-2 md:col-span-1">
                    <Label>M/S (Grower)</Label>
                    <PartySelector value={ms} onChange={setMs} filter="grower" disabled={formDisabled} />
                </div>
                <div>
                    <Label>Khata</Label>
                    <Input value={khata} onChange={e => setKhata(e.target.value)} disabled={formDisabled} />
                </div>
                <div>
                    <Label>Watak No</Label>
                    <Input value={watakNo} onChange={e => setWatakNo(e.target.value)} disabled={formDisabled} />
                </div>
            </div>

            <Separator />
            
            {/* Table */}
            <div>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Variety</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Forward</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {rows.map((r, i) => (
                        <TableRow key={i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>
                            <Select value={r.type} onValueChange={(value: Row['type']) => updateRow(i, { type: value })} disabled={formDisabled}>
                            <SelectTrigger className="w-28">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Patti">Patti</SelectItem>
                                <SelectItem value="Dabba">Dabba</SelectItem>
                            </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell>
                            <Input
                            placeholder="Variety (e.g., A2/5)"
                            value={r.variety}
                            onChange={e => updateRow(i, { variety: e.target.value })}
                            disabled={formDisabled}
                            />
                        </TableCell>
                        <TableCell>
                            <Input
                            type="number"
                            className="w-24 text-right"
                            value={r.qty || ''}
                            onChange={e => updateRow(i, { qty: Number(e.target.value) || 0 })}
                            disabled={formDisabled}
                            />
                        </TableCell>
                         <TableCell className="text-center">
                            <Checkbox 
                                checked={r.isForwarded} 
                                onCheckedChange={(checked) => updateRow(i, { isForwarded: !!checked })}
                                disabled={formDisabled}
                            />
                        </TableCell>
                        <TableCell>
                            <Input
                            type="number"
                            className="w-24 text-right"
                            value={r.rate || ''}
                            onChange={e => updateRow(i, { rate: Number(e.target.value) || 0 })}
                            disabled={formDisabled || r.isForwarded}
                            />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                            {r.isForwarded ? <Badge variant="secondary">Forwarded</Badge> : (totals.rowGross[i] || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => removeRow(i)} disabled={formDisabled}>
                                <Trash2 className="text-red-600 h-4 w-4" />
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={8}>
                                 <Button onClick={addRow} variant="outline" size="sm" className="mt-2" disabled={formDisabled}>
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Add Row
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>

             <Separator />

            {/* Totals & Expenses */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                <div className="space-y-1">
                    <h3 className="font-bold mb-2">Quantity</h3>
                    <div>🧺 Total Patti: <b>{totals.pattiQty}</b></div>
                    <div>🍱 Total Dabba: <b>{totals.dabbaQty}</b></div>
                    <div className="font-bold">📦 Total Quantity: <b>{totals.totalQty}</b></div>
                </div>

                <div className="space-y-2">
                     <h3 className="font-bold mb-2">Expenses</h3>
                    <div>Labour (Qty×3): <b>{totals.labour.toFixed(2)}</b></div>
                    <div>Association (Qty×0.1): <b>{totals.association.toFixed(2)}</b></div>
                    <div>Security (Qty×0.9): <b>{totals.security.toFixed(2)}</b></div>
                    <div className="flex items-center gap-2">
                    <Label>Freight:</Label>
                    <Input
                        type="number"
                        className="w-28 text-right"
                        value={freight || ''}
                        onChange={e => setFreight(Number(e.target.value))}
                        disabled={formDisabled}
                    />
                    </div>
                </div>

                <div className="space-y-1 bg-muted p-3 rounded-md">
                    <h3 className="font-bold mb-2">Financial Summary</h3>
                    <div>💰 Gross Sale: <b>{totals.totalGrossSale.toFixed(2)}</b></div>
                    <div>Commission (12%): <b>{totals.commission.toFixed(2)}</b></div>
                    <div className="font-bold">📉 Total Exp: <b>{totals.totalExp.toFixed(2)}</b></div>
                    <div className="text-lg font-bold mt-2 border-t pt-2">🧾 Net Sale: <b>{totals.netSale.toFixed(2)}</b></div>
                </div>
            </div>

        </CardContent>
        <CardFooter>
            <div className="flex w-full justify-center flex-wrap gap-3">
                <Button onClick={saveBill} className="flex-1 min-w-[150px]" disabled={isSubmitting || formDisabled}>
                    {isSubmitting && loaderAnimation ? (
                      <Lottie animationData={loaderAnimation} loop={true} style={{ width: 24, height: 24 }} className="mr-2"/>
                    ) : null}
                    {isEditing ? 'Update Invoice' : 'Save Invoice'}
                </Button>
                <Button onClick={navigateToPrint} variant="secondary" className="flex-1 min-w-[150px] gap-2" disabled={!isEditing}>
                   <FileText className="h-4 w-4" /> Print/View Invoice
                </Button>
                 <Button onClick={handleShare} variant="outline" className="flex-1 min-w-[150px] gap-2" disabled={!isEditing}>
                   <FaWhatsapp className="h-4 w-4 text-green-500" /> Share on WhatsApp
                </Button>
            </div>
        </CardFooter>
    </Card>
    
    <Card className="mt-6">
        <CardHeader>
            <div className="flex items-center justify-between gap-4">
               <div className="flex items-center gap-2">
                <CardTitle>Recent Invoices (Wataks)</CardTitle>
                <Badge variant="secondary">{yearlyCount} This Year</Badge>
               </div>
               <div className="relative w-full max-w-sm">
                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input 
                    placeholder="Search by Invoice No, Watak No, or Name..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>
            <CardDescription>A list of your most recently created invoices.</CardDescription>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-96">
                <div className="space-y-2">
                    {filteredWataks.length > 0 ? (
                        filteredWataks.map((watak) => (
                            <div key={watak.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted">
                                <div>
                                    <p className="font-semibold">Invoice #{watak.sNo} {watak.watakNo && `(Watak #${watak.watakNo})`}</p>
                                    <p className="text-sm text-muted-foreground">{watak.customerName}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(watak.date).toLocaleDateString()}</p>
                                    <p className="font-mono mt-1">Net Sale: ₹{watak.totals.netSale.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center">
                                    <Button variant="ghost" size="icon" onClick={() => loadWatakForEdit(watak)}>
                                        <FilePenLine className="h-4 w-4" />
                                    </Button>
                                    {userRole === 'admin' && (
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteWatak(watak.sNo)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-10">No saved invoices found for your search.</p>
                    )}
                </div>
            </ScrollArea>
        </CardContent>
    </Card>
    </>
  );
}

    
