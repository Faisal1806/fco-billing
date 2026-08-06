'use client';

import * as React from 'react';
import { useAppState } from '@/contexts/app-state-context';
import { useMemo, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Separator } from './ui/separator';
import { PlusCircle, Trash2, FilePenLine, FilePlus, FileText, ChevronsUpDown, Check, Search, AlertCircle, Loader2, Zap, Sparkles } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { PartySelector } from './party-selector';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { cn } from '@/lib/utils';
import { saveDocument, deleteDocument, getDocuments } from '@/lib/actions';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { calculateCommissionDeductions } from '@/lib/commission';
import { calculateLabour } from '@/lib/labour';



type Row = {
  type: 'Patti' | 'Dabba';
  qty: number;
  variety: string;
  rate: number;
  isForwarded: boolean;
  taxRate: number;
};

const emptyRow: Row = { type: 'Patti', qty: 0, variety: '', rate: 0, isForwarded: false, taxRate: 0 };
const initialRows: Row[] = Array.from({ length: 5 }, () => ({ ...emptyRow }));

const SUCCESS_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export function BillMakingTab() {
  const { selectedYear } = useAppState();
  const [sNo, setSNo] = useState('');
  const [ms, setMs] = useState('');                 
  const [khata, setKhata] = useState('');           
  const [watakNo, setWatakNo] = useState('');   
  const [date, setDate] = useState('');
  const [date2, setDate2] = useState('');
  const [freight, setFreight] = useState<number>(0);
  const [postageInput, setPostageInput] = useState('8');
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [selectedReceiptNo, setSelectedReceiptNo] = useState('');
  const [quickEntry, setQuickEntry] = useState('');


  // App State
  const { toast } = useToast();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableReceipts, setAvailableReceipts] = useState<any[]>([]);
  const [receiptPopoverOpen, setReceiptPopoverOpen] = useState(false);
  const [usedReceiptsMap, setUsedReceiptsMap] = useState<Map<string, string>>(new Map());
  const [loaderAnimation, setLoaderAnimation] = useState(null);
  const [savedWataks, setSavedWataks] = useState<any[]>([]);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [fcmTokens, setFcmTokens] = useState<string[]>([]);
  const [partyCredit, setPartyCredit] = useState<{ limit: number, used: number} | null>(null);

  const playSuccessSound = () => {
    const audio = new Audio(SUCCESS_SOUND_URL);
    audio.play().catch(e => console.log("Sound play blocked", e));
  };
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchBillsAndReceipts = () => {
      const bills = [];
      const receipts = [];
      const usedNos = new Map<string, string>();

      let maxSNo = 0;

      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('invoice-')) {
              try {
                  const bill = JSON.parse(localStorage.getItem(key)!);
                  bills.push(bill);
                  if (bill.linkedReceiptNo) {
                      usedNos.set(bill.linkedReceiptNo, bill.sNo);
                  }
                  const currentSNo = parseInt(bill.sNo, 10);
                  if (!isNaN(currentSNo) && currentSNo > maxSNo) {
                      maxSNo = currentSNo;
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
      
      if (!isEditing) {
          setSNo((maxSNo + 1).toString());
      }
    };

    const fetchPartyCreditInfo = (partyName: string) => {
        if (!partyName) {
            setPartyCredit(null);
            return;
        }
        const partyKey = `party-${partyName.trim()}`;
        const partyData = localStorage.getItem(partyKey);
        
        let limit = 0;
        if (partyData) {
            try {
                limit = JSON.parse(partyData).creditLimit || 0;
            } catch (e) {
                console.error("Failed to parse party data for credit limit", e);
            }
        }
        
        let used = 0;
        for (let i = 0; i < localStorage.length; i++) {
             const key = localStorage.key(i);
             if (key?.startsWith('invoice-')) {
                 const inv = JSON.parse(localStorage.getItem(key)!);
                 if (inv.customerName === partyName) used += inv.totals.netSale;
             }
             if(key?.startsWith('advance-')) {
                 const adv = JSON.parse(localStorage.getItem(key)!);
                 if (adv.partyName === partyName && (adv.type === 'Repayment Received' || adv.type === 'Discount')) used -= adv.amount;
             }
        }
        setPartyCredit({ limit, used: Math.max(0, used) });
    };

    useEffect(() => {
        if(ms && isMounted) {
            fetchPartyCreditInfo(ms);
        } else {
            setPartyCredit(null);
        }
    }, [ms, isMounted]);


  const yearlyCount = useMemo(() => {
    if(!savedWataks) return 0;
    const currentYear = new Date().getFullYear();
    return savedWataks.filter(w => w?.date ? Number(String(w.date).split(/[-/]/).find(p => p.length === 4)) === selectedYear : false).length;
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
    if (isMounted) {
        setUserRole(localStorage.getItem('userRole'));
        setDate(new Date().toISOString().split('T')[0]);

        const fetchTokens = async () => {
            const { success, data } = await getDocuments('fcm-tokens');
            if (success && data) {
                setFcmTokens(data.map((t: any) => t.token));
            }
        };
        fetchTokens();

        fetch('/animations/forms/fco_loader.json')
            .then(res => res.json())
            .then(data => setLoaderAnimation(data));

        fetchBillsAndReceipts();
    }
  }, [isMounted]);

  const handleScanComplete = (scannedData: any) => {
    if (scannedData) {
        try {
            const newRows = scannedData.entries.map((e: any) => ({
                type: e.type,
                qty: e.qty,
                variety: e.variety,
                rate: e.rate,
                isForwarded: false,
                taxRate: 0,
            }));
            
            if (scannedData.sNo) setSNo(scannedData.sNo);
            if (scannedData.date) setDate(scannedData.date);
            if (scannedData.customerName) setMs(scannedData.customerName);
            if (scannedData.watakNo) setWatakNo(scannedData.watakNo);
            if (scannedData.khata) setKhata(scannedData.khata);
            if (scannedData.freight) setFreight(scannedData.freight);
            setRows(newRows.length > 0 ? newRows : initialRows);
            
            setIsEditing(false); 
        } catch (e) {
            console.error("Error applying scanned data", e);
            toast({ variant: 'destructive', title: "Apply Error", description: "Could not apply some of the scanned fields." });
        }
    }
  };

  const parseQuickEntry = () => {
    const input = quickEntry.trim();
    if (!input) return;

    const tokens = input.split(/\s+/);
    if (tokens.length < 3) {
        toast({ variant: 'destructive', title: 'Invalid Quick Entry', description: 'Format: [Name] [Variety] [Qty] [Rate]' });
        return;
    }

    let rate = 0;
    let qty = 0;
    let varietyParts: string[] = [];
    let nameParts: string[] = [];

    const last = tokens[tokens.length - 1];
    const secondLast = tokens[tokens.length - 2];

    if (!isNaN(Number(last)) && !isNaN(Number(secondLast))) {
        rate = Number(last);
        qty = Number(secondLast);
        nameParts = [tokens[0]];
        varietyParts = tokens.slice(1, tokens.length - 2);
    } else {
        toast({ variant: 'destructive', title: 'Parsing Error', description: 'Ensure Quantity and Rate are numbers at the end.' });
        return;
    }

    const name = nameParts.join(' ');
    const variety = varietyParts.join(' ') || 'Apple';

    setMs(name);
    const newRows = [...initialRows];
    newRows[0] = { ...emptyRow, variety, qty, rate };
    setRows(newRows);
    
    setQuickEntry('');
    toast({ title: 'Quick Entry Applied', description: `Grower: ${name}, Variety: ${variety}, Qty: ${qty}, Rate: ₹${rate}` });
  };

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
        if (Array.isArray(selectedReceipt.entries)) {
          selectedReceipt.entries.forEach((entry: any) => {
              if (entry.peti > 0) {
                  newRows.push({ ...emptyRow, type: 'Patti', variety: entry.kind, qty: entry.peti, rate: 0 });
              }
              if (entry.daba > 0) {
                  newRows.push({ ...emptyRow, type: 'Dabba', variety: entry.kind, qty: entry.daba, rate: 0 });
              }
          });
        }

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

  const totals = useMemo(() => {
    const validRows = rows.filter(r => r.qty > 0 && r.variety);
    const totalQty = validRows.reduce((s, r) => s + (Number(r.qty) || 0), 0);
    const pattiQty = validRows
      .filter(r => r.type === 'Patti')
      .reduce((s, r) => s + (Number(r.qty) || 0), 0);
    const dabbaQty = validRows
      .filter(r => r.type === 'Dabba')
      .reduce((s, r) => s + (Number(r.qty) || 0), 0);

    let subtotal = 0;
    
    const rowGross = validRows.map(r => {
        const taxableAmount = r.isForwarded ? 0 : (Number(r.qty) || 0) * (Number(r.rate) || 0);
        subtotal += taxableAmount;
        return taxableAmount;
    });

    const totalGrossSale = subtotal;

    const labour = calculateLabour(totalQty);
    const association = totalQty * 0.1;
    const security = totalQty * 0.9;
    const { commissionAmount, securityCharges } = calculateCommissionDeductions(totalGrossSale);
    const resolvedPostage = postageInput === '' ? 8 : (Number(postageInput) || 8);

    const totalExp = (Number(freight) || 0) + labour + association + security + commissionAmount + securityCharges + resolvedPostage;
    const netSale = totalGrossSale - totalExp;

    return {
      pattiQty,
      dabbaQty,
      totalQty,
      subtotal,
      cgst: 0,
      sgst: 0,
      totalTax: 0,
      totalGrossSale,
      commission: commissionAmount,
      commissionAmount,
      postage: Number(resolvedPostage.toFixed(2)),
      serviceCharges: securityCharges,
      securityCharges,
      labour,
      association,
      security,
      totalExp,
      netSale,
      rowGross,
    };
}, [rows, freight, postageInput]);

  const creditLimitExceeded = useMemo(() => {
    if (!partyCredit || partyCredit.limit === 0) return false;
    if (!isEditing) {
        return partyCredit.used + totals.netSale > partyCredit.limit;
    }
    return partyCredit.used > partyCredit.limit;
  }, [partyCredit, totals.netSale, isEditing]);

  const updateRow = (i: number, patch: Partial<Row>) => {
    setRows(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], ...patch };
      if (patch.isForwarded === true) {
          copy[i].rate = 0;
          copy[i].taxRate = 0;
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
        setDate(new Date().toISOString().split('T')[0]);
        setDate2('');
        setFreight(0);
        setPostageInput('8');
        setRows(initialRows);
        setIsEditing(false);
        setSelectedReceiptNo('');
        setPartyCredit(null);
        setQuickEntry('');
        fetchBillsAndReceipts();
    };

  const loadWatakForEdit = (watak: any) => {
    setSNo(watak.sNo);
    setMs(watak.customerName);
    setKhata(watak.khata || '');
    setWatakNo(watak.watakNo || '');
    setDate(watak.date);
    setDate2(watak.date2 || '');
    setFreight(watak.freight || 0);
    setPostageInput(watak.totals?.postage !== undefined ? String(watak.totals.postage) : '8');
    setRows(watak.entries.length > 0 ? watak.entries : initialRows);
    setSelectedReceiptNo(watak.linkedReceiptNo || '');
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteWatak = async (deletedSNo: string) => {
    if (userRole !== 'admin') {
      toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to delete invoices."});
      return;
    }
    if (!window.confirm(`Are you sure you want to delete Invoice #${deletedSNo}? This cannot be undone.`)) return;
    
    localStorage.removeItem(`invoice-${deletedSNo}`);
    try {
        await deleteDocument('bills', deletedSNo);
        toast({ title: "Invoice Deleted", description: `Invoice #${deletedSNo} has been deleted locally and from cloud.`});
    } catch (e) {
        toast({ title: "Invoice Deleted Locally", description: `Bill removed from device but cloud sync failed.`});
    }
    fetchBillsAndReceipts();
    if (deletedSNo === sNo) resetForm();
  }


  const saveBill = async () => {
     if (!sNo || !date || !ms) {
        toast({
            variant: 'destructive',
            title: 'Missing Details',
            description: 'Please fill in Invoice No, Date, and Customer Name before saving.',
        });
        return;
    }

    if (creditLimitExceeded && !isEditing) {
        toast({
            variant: 'destructive',
            title: 'Credit Limit Exceeded',
            description: `This sale would exceed the credit limit for ${ms}. Cannot save.`,
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
        taxRate: 0,
        taxableAmount: r.isForwarded ? 0 : (Number(r.qty) || 0) * (Number(r.rate) || 0),
        total: r.isForwarded ? 0 : ((Number(r.qty) || 0) * (Number(r.rate) || 0)),
      })),
      totals: {
        subtotal: Number(totals.subtotal.toFixed(2)),
        grossSale: Number(totals.totalGrossSale.toFixed(2)),
        labour: Number(totals.labour.toFixed(2)),
        association: Number(totals.association.toFixed(2)),
        security: Number(totals.security.toFixed(2)),
        commissionAmount: Number(totals.commissionAmount.toFixed(2)),
        securityCharges: Number(totals.securityCharges.toFixed(2)),
        postage: Number((totals.postage ?? 8).toFixed(2)),
        serviceCharges: Number(totals.securityCharges.toFixed(2)),
        totalExpenses: Number(totals.totalExp.toFixed(2)),
        netSale: Number(totals.netSale.toFixed(2)),
      },
      linkedReceiptNo: selectedReceiptNo,
    };
    
    localStorage.setItem(`invoice-${billId}`, JSON.stringify(billData));

    try {
        await saveDocument('bills', billData);
        playSuccessSound();

        toast({
            title: isEditing ? 'Invoice Updated' : 'Invoice Saved',
            description: 'The invoice has been successfully saved to the cloud.',
            isSuccess: true,
        });

        // if (fcmTokens.length > 0) {
        //     if (isEditing) {
        //         await sendPushNotification({
        //             title: 'Bill Updated',
        //             body: `Your Bill #${sNo} has been Updated – Check Details Again`,
        //             tokens: fcmTokens, 
        //             url: `/invoice/${sNo}`
        //         });
        //     } else {
        //         await sendPushNotification({
        //             title: 'New Bill Created',
        //             body: `New Bill Created for ${ms} – Watak No. ${watakNo || sNo}`,
        //             tokens: fcmTokens, 
        //         });
        //     }
        // }

    } catch(error) {
        console.error("Error saving to cloud", error);
        toast({
            variant: 'destructive',
            title: 'Cloud Sync Failed',
            description: 'Could not save the invoice to the cloud. It is saved locally.',
        });
    }
    
    fetchBillsAndReceipts();
    setIsEditing(true); 
    setIsSubmitting(false);
  };

  const handleWhatsAppShare = () => {
    if (!ms || !sNo) return;
    
    const invNo = watakNo || sNo;
    const varieties = rows.filter(r => r.qty > 0).map(r => r.variety).join(', ');
    const pageUrl = `${window.location.origin}/bill/view/${sNo}?style=classic`;

    let msg = `*F.Co Billing System*\n`;
    msg += `Watak No: ${invNo}\n`;
    msg += `Grower: ${ms}\n`;
    msg += `Fruit: ${varieties}\n`;
    msg += `Boxes: ${totals.totalQty}\n`;
    msg += `Net Sale: *₹${totals.netSale.toLocaleString()}*\n\n`;
    msg += `View Full Bill: ${pageUrl}\n\n`;
    msg += `Thank you for your business\n`;
    msg += `*Firdous Ahmad & Company*`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!isMounted) return null;

  return (
    <>
    <Card className="glass-panel rounded-[3rem] border-white/5 shadow-2xl overflow-hidden">
        <CardHeader className="bg-white/[0.03] border-b border-white/5 p-10">
            <div className="flex justify-between items-center">
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">🍎 F.Co TERMINAL</div>
                <div className="text-center flex-1">
                    <h2 className="text-2xl font-black tracking-tighter">FIRDOUS AHMAD & COMPANY</h2>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1">Operational Mandi Node Node-13 Sopore</p>
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">F.Co TERMINAL 🍎</div>
            </div>
        </CardHeader>
        <CardContent className="p-10 space-y-10">
            
            {/* Action Bar: Load, Scan, and Quick Entry */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-6 items-end p-8 border border-white/5 rounded-[2rem] bg-white/[0.02]">
                        <div className="flex-1 min-w-[200px]">
                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-3 block">Load Mandi Receipt</Label>
                            <Popover open={receiptPopoverOpen} onOpenChange={setReceiptPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={receiptPopoverOpen}
                                className="w-full justify-between h-14 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 text-xs font-bold"
                                >
                                {selectedReceiptNo
                                    ? `Receipt #${selectedReceiptNo}`
                                    : "Select standard receipt..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 glass-panel border-white/10 rounded-2xl overflow-hidden">
                                <Command>
                                <CommandInput placeholder="Search system logs..." className="h-12" />
                                <CommandList>
                                    <CommandEmpty className="p-4 text-center text-xs font-bold opacity-50">NO MATCHING NODES</CommandEmpty>
                                    <CommandGroup>
                                    {availableReceipts.map((r) => {
                                        const isUsed = usedReceiptsMap.has(r.no);
                                        const usedForInvoice = usedReceiptsMap.get(r.no);
                                        return (
                                        <CommandItem
                                        key={r.no}
                                        value={`${r.no} ${r.customerName}`}
                                        onSelect={() => {
                                            setSelectedReceiptNo(r.no);
                                            setReceiptPopoverOpen(false);
                                        }}
                                        className="rounded-lg mx-1 cursor-pointer"
                                        disabled={isUsed && sNo !== usedForInvoice}
                                        >
                                        <Check
                                            className={cn(
                                            "mr-2 h-4 w-4 text-accent",
                                            selectedReceiptNo === r.no ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        #{r.no} - {r.customerName}
                                        {isUsed && sNo !== usedForInvoice && <Badge variant="secondary" className="ml-auto text-[8px]">ACTIVE</Badge>}
                                        </CommandItem>
                                    )})}
                                    </CommandGroup>
                                </CommandList>
                                </Command>
                            </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex-shrink-0">
                                    
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-end">
                    <div className="flex gap-4 p-8 border border-accent/20 rounded-[2rem] bg-accent/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                            <Zap className="h-20 w-20 text-accent" />
                        </div>
                        <div className="flex-1 relative z-10">
                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-3 block flex items-center gap-2">
                                <Zap className="h-3 w-3" /> ULTRA-FAST QUICK ENTRY
                            </Label>
                            <Input 
                                placeholder="e.g. bashir apple 120 1550" 
                                value={quickEntry} 
                                onChange={e => setQuickEntry(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && parseQuickEntry()}
                                className="bg-background/50 border-accent/20 focus:border-accent h-14 rounded-2xl text-sm font-bold placeholder:opacity-30"
                            />
                        </div>
                        <Button variant="secondary" className="h-14 mt-7 bg-accent/20 hover:bg-accent/30 text-accent font-black text-[10px] tracking-[0.2em] rounded-2xl px-8" onClick={parseQuickEntry}>
                            EXECUTE
                        </Button>
                    </div>
                </div>
            </div>

            {isReceiptUsed && (
                <Alert className="bg-destructive/10 border-destructive/20 text-destructive rounded-2xl py-4 flex items-center gap-4">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-xs font-black uppercase tracking-widest">WATAK ALREADY INITIALIZED FOR THIS NODE. READ-ONLY MODE ACTIVE.</span>
                </Alert>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 items-end">
                <div className="md:col-span-2 space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Master Invoice ID</Label>
                    <div className="flex items-center gap-3">
                        <Input value={sNo} onChange={e => setSNo(e.target.value)} disabled={isEditing || isReceiptUsed} className="h-14 rounded-2xl font-black text-xl tracking-tighter" />
                         {(isEditing || isReceiptUsed) && (
                            <Button variant="outline" size="icon" onClick={resetForm} className="h-14 w-14 rounded-2xl border-white/10 hover:bg-white/5" title="Initialize New Session">
                                <FilePlus className="h-5 w-5 text-accent" />
                            </Button>
                        )}
                    </div>
                </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Mandi Date</Label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} disabled={formDisabled} className="h-14 rounded-2xl font-bold bg-white/5 border-white/10" />
                </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Adjustment Date</Label>
                    <Input type="date" value={date2} onChange={e => setDate2(e.target.value)} disabled={formDisabled} className="h-14 rounded-2xl font-bold bg-white/5 border-white/10" />
                </div>
                <div className="col-span-2 md:col-span-1 space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Grower Party</Label>
                    <PartySelector value={ms} onChange={setMs} filter="grower" disabled={formDisabled} />
                </div>
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Khata Entry</Label>
                    <Input value={khata} onChange={e => setKhata(e.target.value)} disabled={formDisabled} className="h-14 rounded-2xl bg-white/5 border-white/10" />
                </div>
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Mandi Watak No.</Label>
                    <Input value={watakNo} onChange={e => setWatakNo(e.target.value)} disabled={formDisabled} className="h-14 rounded-2xl bg-white/5 border-white/10" />
                </div>
                {partyCredit && partyCredit.limit > 0 && (
                    <div className="col-span-2 md:col-span-2 bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 space-y-4">
                        <div className="flex justify-between items-center">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Credit Security Index</Label>
                            <span className="text-[10px] font-black font-mono">₹{partyCredit.used.toLocaleString()}/₹{partyCredit.limit.toLocaleString()}</span>
                        </div>
                        <Progress value={(partyCredit.used / partyCredit.limit) * 100} className="h-2 bg-white/10" />
                         {creditLimitExceeded && !isEditing &&
                             <div className="flex items-center gap-2 text-rose-400 font-black text-[9px] uppercase tracking-widest pt-1">
                                <AlertCircle className="h-3 w-3" />
                                SESSION WILL EXCEED SECURE LIMIT
                            </div>
                        }
                    </div>
                 )}
            </div>

            <Separator className="bg-white/5" />
            
            <div className="rounded-[2.5rem] border border-white/5 overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/[0.03]">
                    <TableRow className="border-none h-16">
                        <TableHead className="w-16 text-center text-[10px] font-black uppercase tracking-widest">#</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Format</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Variety Node</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Quantity</TableHead>
                        <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">Fwd</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Unit Rate</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-10">Gross Yield</TableHead>
                        <TableHead className="w-16"></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {rows.map((r, i) => (
                        <TableRow key={i} className="border-white/5 h-20 hover:bg-white/[0.01] transition-colors">
                        <TableCell className="text-center font-black opacity-30">{i + 1}</TableCell>
                        <TableCell>
                            <Select value={r.type} onValueChange={(value: Row['type']) => updateRow(i, { type: value })} disabled={formDisabled}>
                            <SelectTrigger className="w-32 h-12 rounded-xl bg-white/5 border-white/10 font-bold text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="Patti">PATTI</SelectItem>
                                <SelectItem value="Dabba">DABBA</SelectItem>
                            </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell>
                            <Input
                            placeholder="Identify fruit variety..."
                            value={r.variety}
                            onChange={e => updateRow(i, { variety: e.target.value })}
                            disabled={formDisabled}
                            className="h-12 rounded-xl bg-white/5 border-white/10 font-bold text-sm"
                            />
                        </TableCell>
                        <TableCell>
                            <Input
                            type="number"
                            className="w-28 text-right h-12 rounded-xl bg-white/5 border-white/10 font-black text-base"
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
                                className="h-6 w-6 rounded-lg border-white/20"
                            />
                         </TableCell>
                        <TableCell>
                            <Input
                            type="number"
                            className="w-32 text-right h-12 rounded-xl bg-white/5 border-white/10 font-black text-base text-accent"
                            value={r.rate || ''}
                            onChange={e => updateRow(i, { rate: Number(e.target.value) || 0 })}
                            disabled={formDisabled || r.isForwarded}
                            />
                        </TableCell>
                        <TableCell className="text-right font-black text-sm pr-10">
                            {r.isForwarded ? <Badge variant="secondary" className="bg-white/5 text-white/40">F.NODE</Badge> : (totals.rowGross[i] || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                            <Button variant="ghost" size="icon" onClick={() => removeRow(i)} disabled={formDisabled} className="h-10 w-10 hover:bg-destructive/20 text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                    <TableFooter className="bg-white/[0.03] h-20">
                        <TableRow className="border-none">
                            <TableCell colSpan={8} className="px-6">
                                 <Button onClick={addRow} variant="outline" size="sm" className="h-12 rounded-xl gap-2 font-black text-[10px] tracking-widest border-white/10 bg-white/5 hover:bg-white/10" disabled={formDisabled}>
                                    <PlusCircle className="h-4 w-4 text-accent" />
                                    INSERT TRANSACTION ROW
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>

             <Separator className="bg-white/5" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 p-10 glass-panel rounded-[3.5rem] border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                        <div className="h-1 w-4 bg-accent rounded-full" /> PHYSICAL UNITS
                    </h3>
                    <div className="space-y-2 text-sm font-bold">
                        <div className="flex justify-between items-center opacity-60"><span>PATTI NODE</span> <span>{totals.pattiQty}</span></div>
                        <div className="flex justify-between items-center opacity-60"><span>DABBA NODE</span> <span>{totals.dabbaQty}</span></div>
                        <div className="flex justify-between items-center text-lg font-black text-white pt-2 border-t border-white/5"><span>TOTAL QUANTITY</span> <span>{totals.totalQty}</span></div>
                    </div>
                </div>

                <div className="space-y-4">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                        <div className="h-1 w-4 bg-accent rounded-full" /> MANDATED EXPENSES
                    </h3>
                    <div className="space-y-2 text-sm font-bold">
                        <div className="flex justify-between items-center opacity-60"><span>LABOUR (Q×3)</span> <span>₹{totals.labour.toLocaleString()}</span></div>
                        <div className="flex justify-between items-center opacity-60"><span>COMMISSION (12%)</span> <span>₹{totals.commission.toLocaleString()}</span></div>
                        <div className="flex justify-between items-center text-lg pt-2 border-t border-white/5">
                            <span className="opacity-60 text-xs uppercase">FREIGHT CHARGE</span>
                            <Input
                                type="number"
                                className="w-32 h-10 text-right rounded-xl bg-white/5 border-white/10 font-black text-accent"
                                value={freight || ''}
                                onChange={e => setFreight(Number(e.target.value))}
                                disabled={formDisabled}
                            />
                        </div>
                        <div className="flex justify-between items-center text-lg pt-2 border-t border-white/5">
                            <span className="opacity-60 text-xs uppercase">POSTAGE</span>
                            <Input
                                type="number"
                                className="w-32 h-10 text-right rounded-xl bg-white/5 border-white/10 font-black text-accent"
                                value={postageInput}
                                onChange={e => setPostageInput(e.target.value)}
                                disabled={formDisabled}
                                placeholder="8"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 bg-accent/5 p-8 rounded-[2.5rem] border border-accent/10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent flex items-center gap-2">
                        <div className="h-1 w-4 bg-accent rounded-full" /> SETTLEMENT FINAL
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs opacity-60 font-black"><span>GROSS SALES</span> <span>₹{totals.totalGrossSale.toLocaleString()}</span></div>
                        <div className="flex justify-between items-center text-xs opacity-60 font-black"><span>TOTAL DEDUCTIONS</span> <span className="text-rose-400">- ₹{totals.totalExp.toLocaleString()}</span></div>
                        <Separator className="bg-accent/20" />
                        <div className="flex justify-between items-end pt-2">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-accent uppercase tracking-widest">NET PAYABLE YIELD</p>
                                <p className="text-4xl font-black text-white tracking-tighter">₹{totals.netSale.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </CardContent>
        <CardFooter className="p-10 pt-0">
            <div className="flex w-full justify-center flex-wrap gap-6">
                <Button onClick={saveBill} className="flex-1 h-16 rounded-2xl gap-3 bg-accent text-black font-black tracking-widest text-xs hover:bg-accent/90 shadow-[0_0_30px_rgba(34,197,94,0.3)]" disabled={isSubmitting || formDisabled || (creditLimitExceeded && !isEditing)}>
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : <Check className="h-5 w-5" />}
                    {isEditing ? 'UPDATE MASTER RECORD' : 'SAVE TRANSACTION NODE'}
                </Button>
                <Button onClick={() => router.push(`/invoice/${sNo}`)} variant="secondary" className="flex-1 h-16 rounded-2xl gap-3 font-black text-xs tracking-widest glass-panel hover:bg-white/10" disabled={!isEditing}>
                   <FileText className="h-5 w-5 text-accent" /> GENERATE HIGH-RES INVOICE
                </Button>
                 <Button onClick={handleWhatsAppShare} variant="outline" className="flex-1 h-16 rounded-2xl gap-3 bg-green-500/10 border-green-500/20 text-green-400 font-black text-xs tracking-widest hover:bg-green-500/20" disabled={!isEditing}>
                   <FaWhatsapp className="h-5 w-5" /> INSTANT WHATSAPP SHARE
                </Button>
            </div>
        </CardFooter>
    </Card>
    
    <Card className="mt-12 glass-panel rounded-[3rem] border-white/5 overflow-hidden">
        <CardHeader className="p-10 border-b border-white/5">
            <div className="flex items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                <div className="h-10 w-1 bg-accent rounded-full" />
                <div>
                    <CardTitle className="text-xl font-black tracking-tight">TERMINAL TRANSACTION LOG</CardTitle>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Status: {yearlyCount} Records Indexed In {new Date().getFullYear()}</p>
                </div>
               </div>
               <div className="relative w-full max-w-md">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                 <Input 
                    placeholder="Search master index (Name, ID, Watak)..." 
                    className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10 font-bold text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
                <div className="divide-y divide-white/5">
                    {filteredWataks.length > 0 ? (
                        filteredWataks.map((watak) => (
                            <div key={watak.id} className="group flex justify-between items-center p-8 hover:bg-white/[0.03] transition-all">
                                <div className="flex items-center gap-8">
                                    <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center text-xs font-black text-muted-foreground group-hover:bg-accent group-hover:text-black transition-all">
                                        #{watak.sNo}
                                    </div>
                                    <div>
                                        <p className="text-lg font-black tracking-tight text-white">{watak.customerName}</p>
                                        <div className="flex items-center gap-4 mt-1">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">WATAK: {watak.watakNo || 'UNSET'}</p>
                                            <div className="h-1 w-1 bg-white/20 rounded-full" />
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{new Date(watak.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-10">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-1">NET SETTLEMENT</p>
                                        <p className="text-2xl font-black text-white tracking-tighter">₹{watak.totals?.netSale?.toLocaleString() || '0'}</p>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                        <Button variant="ghost" size="icon" onClick={() => loadWatakForEdit(watak)} className="h-12 w-12 rounded-xl hover:bg-white/10">
                                            <FilePenLine className="h-5 w-5 text-accent" />
                                        </Button>
                                        {userRole === 'admin' && (
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteWatak(watak.sNo)} className="h-12 w-12 rounded-xl hover:bg-rose-500/20">
                                                <Trash2 className="h-5 w-5 text-rose-500" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-20 text-center space-y-4 opacity-30">
                            <Search className="h-12 w-12 mx-auto" />
                            <p className="text-xs font-black uppercase tracking-widest">No matching transactional nodes found in memory</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </CardContent>
    </Card>
    </>
  );
}





