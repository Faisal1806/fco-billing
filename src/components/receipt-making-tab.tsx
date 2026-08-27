
'use client';

import * as React from 'react';
import { useAppState } from '@/contexts/app-state-context';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, FilePenLine, FilePlus, FileText, Search } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { PartySelector } from './party-selector';


type ReceiptEntry = {
  khata: string;
  kind: string;
  peti: number;
  daba: number;
  freight: string;
};

const ReceiptEntryRow = ({
  entry,
  onUpdate,
  onRemove,
}: {
  entry: ReceiptEntry;
  onUpdate: (field: keyof ReceiptEntry, value: string | number) => void;
  onRemove: () => void;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
    <Input
      placeholder="Khata ID"
      value={entry.khata}
      onChange={(e) => onUpdate('khata', e.target.value)}
      className="md:col-span-2 h-12 rounded-xl bg-white/5 border-white/10 font-bold"
    />
     <Input
      placeholder="Variety Node"
      value={entry.kind}
      onChange={(e) => onUpdate('kind', e.target.value)}
      className="md:col-span-1 h-12 rounded-xl bg-white/5 border-white/10 font-bold"
    />
    <Input
      type="number"
      placeholder="Peti"
      value={entry.peti || ''}
      onChange={(e) => onUpdate('peti', Number(e.target.value))}
      className="md:col-span-1 h-12 rounded-xl bg-white/5 border-white/10 font-black text-base"
    />
    <Input
      type="number"
      placeholder="Daba"
      value={entry.daba || ''}
      onChange={(e) => onUpdate('daba', Number(e.target.value))}
      className="md:col-span-1 h-12 rounded-xl bg-white/5 border-white/10 font-black text-base"
    />
    <Input
      placeholder="Freight Info"
      value={entry.freight}
      onChange={(e) => onUpdate('freight', e.target.value)}
      className="md:col-span-1 h-12 rounded-xl bg-white/5 border-white/10 font-bold"
    />
    <Button variant="ghost" size="icon" onClick={onRemove} className="h-10 w-10 hover:bg-rose-500/20 text-rose-500">
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
);

const SUCCESS_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export function ReceiptMakingTab() {
  const { selectedYear } = useAppState();
  const { toast } = useToast();
  const router = useRouter();

  const initialReceiptDetails = {
    no: '',
    date: '',
    customerName: '',
    ro: '', // Residence of
    freightPaid: 0,
    wattakReadyOn: '',
  };

  const initialEntries: ReceiptEntry[] = [
    { khata: '', kind: '', peti: 0, daba: 0, freight: '' },
  ];

  const [entries, setEntries] = React.useState<ReceiptEntry[]>(initialEntries);
  const [receiptDetails, setReceiptDetails] = React.useState(initialReceiptDetails);
  const [isEditing, setIsEditing] = React.useState(false);
  const [savedReceipts, setSavedReceipts] = React.useState<any[]>([]);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const playSuccessSound = () => {
    const audio = new Audio(SUCCESS_SOUND_URL);
    audio.play().catch(e => console.log("Sound play blocked", e));
  };
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
        setUserRole(localStorage.getItem('userRole'));
    }
    fetchReceipts();
  }, []);

  const fetchReceipts = () => {
    let maxNo = 0;
    const receipts = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('receipt-')) {
            const receipt = JSON.parse(localStorage.getItem(key)!);
            receipts.push(receipt);
            const currentNo = parseInt(receipt.no, 10);
            if (!isNaN(currentNo) && currentNo > maxNo) {
                maxNo = currentNo;
            }
        }
    }
    setSavedReceipts(receipts.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    if (!isEditing) {
        setReceiptDetails(prev => ({ ...prev, no: (maxNo + 1).toString() }));
    }
  };
  
  const yearlyCount = React.useMemo(() => {
    if(!savedReceipts) return 0;
    const currentYear = new Date().getFullYear();
    return savedReceipts.filter(r => r?.date ? Number(String(r.date).split(/[-/]/).find(p => p.length === 4)) === selectedYear : false).length;
  }, [savedReceipts]);

  const filteredReceipts = React.useMemo(() => {
    if (!searchTerm) return savedReceipts;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return savedReceipts.filter(receipt => 
      receipt.no?.toLowerCase().includes(lowerCaseSearch) ||
      receipt.customerName?.toLowerCase().includes(lowerCaseSearch)
    );
  }, [savedReceipts, searchTerm]);


  const handleEntryUpdate = (
    index: number,
    field: keyof ReceiptEntry,
    value: string | number
  ) => {
    setEntries((prevEntries) => {
      const newEntries = [...prevEntries];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return newEntries;
    });
  };

  const handleDetailChange = (field: keyof typeof receiptDetails, value: string | number) => {
    setReceiptDetails(prev => ({...prev, [field]: value}));
  }

  const addSlot = () => {
    setEntries((prev) => [...prev, { khata: '', kind: '', peti: 0, daba: 0, freight: '' }]);
  };

  const removeSlot = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const totalNugs = entries.reduce((acc, entry) => acc + (Number(entry.peti) || 0) + (Number(entry.daba) || 0), 0);

  const resetForm = () => {
    setReceiptDetails(initialReceiptDetails);
    setEntries(initialEntries);
    setIsEditing(false);
    fetchReceipts(); 
  };

  const handleSaveReceipt = async () => {
    if (!receiptDetails.no || !receiptDetails.date || !receiptDetails.customerName) {
        toast({
            variant: 'destructive',
            title: 'Missing Details',
            description: 'Please fill in No., Date, and Customer Name before saving.',
        });
        return;
    }
    const receiptId = receiptDetails.no;
    const receiptData = {
        ...receiptDetails,
        entries: entries.filter(e => e.khata || e.peti > 0 || e.daba > 0),
        totalNugs,
    };
    
    localStorage.setItem(`receipt-${receiptId}`, JSON.stringify(receiptData));
    playSuccessSound();
    
    fetchReceipts(); 
    setIsEditing(true);

    toast({
      title: isEditing ? 'Receipt Updated!' : 'Receipt Saved!',
      description: 'The goods receipt has been successfully indexed in the terminal.',
      isSuccess: !isEditing, 
    });
  };

  const handleViewReceipt = () => {
      if (!isEditing || !receiptDetails.no) {
          toast({ variant: 'destructive', title: 'Cannot View', description: 'Please save the receipt first.'});
          return;
      }
      router.push(`/receipt/${receiptDetails.no}`);
  };

  const handleWhatsAppShare = () => {
    if (!receiptDetails.customerName || !receiptDetails.no) return;
    
    const pageUrl = `${window.location.origin}/receipt/${receiptDetails.no}?source=qr`;

    let msg = `*F.Co Billing System*\n`;
    msg += `Receipt No: ${receiptDetails.no}\n`;
    msg += `Grower: ${receiptDetails.customerName}\n`;
    msg += `Total Boxes: ${totalNugs}\n`;
    msg += `Date: ${new Date(receiptDetails.date).toLocaleDateString('en-GB')}\n\n`;
    msg += `View Full Receipt: ${pageUrl}\n\n`;
    msg += `Thank you for your business\n`;
    msg += `*Firdous Ahmad & Company*`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const loadReceiptForEdit = (receipt: any) => {
    resetForm();
    setReceiptDetails({
      no: receipt.no,
      date: receipt.date,
      customerName: receipt.customerName,
      ro: receipt.ro,
      freightPaid: receipt.freightPaid,
      wattakReadyOn: receipt.wattakReadyOn,
    });
    setEntries(receipt.entries && Array.isArray(receipt.entries) && receipt.entries.length > 0 ? receipt.entries : initialEntries);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    if(userRole !== 'admin') {
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to delete receipts.' });
        return;
    }

    if(!window.confirm(`Are you sure you want to delete Receipt #${receiptId}? This action cannot be undone.`)) {
        return;
    }
    
    localStorage.removeItem(`receipt-${receiptId}`);

    fetchReceipts();
    toast({
        title: "Receipt Deleted",
        description: `Receipt #${receiptId} has been successfully deleted.`
    });
    
    if (receiptDetails.no === receiptId) {
        resetForm();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <Card className="md:col-span-2 glass-panel rounded-[3rem] border-white/5 overflow-hidden shadow-2xl">
            <CardHeader className="bg-white/[0.03] border-b border-white/5 p-10">
                <div className="flex justify-between items-center">
                    <div className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">🍎 F.Co INWARD</div>
                    <div className="text-center flex-1">
                        <h2 className="text-2xl font-black tracking-tighter uppercase">GOODS RECEIPT TERMINAL</h2>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1">Inward Logistics Manifest Engine</p>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">F.Co INWARD 🍎</div>
                </div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Receipt Index No.</Label>
                        <div className="flex items-center gap-2">
                        <Input value={receiptDetails.no} onChange={e => handleDetailChange('no', e.target.value)} disabled={isEditing} className="h-14 rounded-2xl bg-white/5 border-white/10 font-black text-xl bg-white/5 border-white/10" />
                         {isEditing && (
                            <Button variant="outline" size="icon" onClick={resetForm} className="h-14 w-14 rounded-2xl border-white/10 hover:bg-white/5" title="Initialize New Session">
                                <FilePlus className="h-5 w-5 text-accent" />
                            </Button>
                        )}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Entry Timestamp</Label>
                        <Input type="date" value={receiptDetails.date} onChange={e => handleDetailChange('date', e.target.value)} className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold" />
                    </div>
                    <div className="col-span-2 md:col-span-1 space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Grower Party Node</Label>
                        <PartySelector value={receiptDetails.customerName} onChange={(val) => handleDetailChange('customerName', val)} filter="grower" />
                    </div>
                    <div className="space-y-3 col-span-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Residence Details (R/o)</Label>
                        <Input placeholder="Identify residence node..." value={receiptDetails.ro} onChange={e => handleDetailChange('ro', e.target.value)} className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold" />
                    </div>
                </div>
                
                <Separator className="bg-white/5" />

                <div className="space-y-6">
                    <div className="hidden md:grid grid-cols-6 items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4">
                        <Label className="md:col-span-2">KHATA LOG</Label>
                        <Label className="md:col-span-1">VARIETY</Label>
                        <Label className="md:col-span-1">PETI</Label>
                        <Label className="md:col-span-1">DABBA</Label>
                        <Label className="md:col-span-1">FREIGHT</Label>
                    </div>
                    <div className="space-y-3">
                        {entries.map((entry, index) => (
                        <ReceiptEntryRow
                            key={index}
                            entry={entry}
                            onUpdate={(field, value) => handleEntryUpdate(index, field, value)}
                            onRemove={() => removeSlot(index)}
                        />
                        ))}
                    </div>
                    <Button variant="outline" size="sm" className="h-12 rounded-xl gap-2 font-black text-[10px] tracking-widest border-white/10 bg-white/5 hover:bg-white/10" onClick={addSlot}>
                        <PlusCircle className="h-4 w-4 text-accent" />
                        INSERT INWARD ROW
                    </Button>
                </div>

                <Separator className="bg-white/5" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Freight Paid Ledger</Label>
                            <Input className="h-14 rounded-2xl bg-white/5 border-white/10 text-right font-black text-base text-accent" type="number" value={receiptDetails.freightPaid || ''} onChange={(e) => handleDetailChange('freightPaid', Number(e.target.value))} />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Watak Release Protocol</Label>
                            <Input placeholder="Set ready date..." value={receiptDetails.wattakReadyOn} onChange={e => handleDetailChange('wattakReadyOn', e.target.value)} className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold" />
                        </div>
                    </div>

                    <div className="flex flex-col justify-center items-end bg-accent/5 rounded-[2.5rem] border border-accent/10 p-10">
                        <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-2">Total Inward Load</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black text-white tracking-tighter">{totalNugs}</span>
                            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Units</span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-10 pt-0">
                <div className="flex justify-center gap-6 w-full">
                    <Button onClick={handleSaveReceipt} className="flex-1 h-16 rounded-2xl gap-3 bg-accent text-black font-black tracking-widest text-xs hover:bg-accent/90 shadow-[0_0_30px_rgba(34,197,94,0.3)]">{isEditing ? 'UPDATE RECEIPT NODE' : 'INDEX GOOD RECEIPT'}</Button>
                    <Button onClick={handleViewReceipt} variant="secondary" className="flex-1 h-16 rounded-2xl gap-3 font-black text-xs tracking-widest glass-panel hover:bg-white/10" disabled={!isEditing}>
                        <FileText className="h-5 w-5 text-accent" /> VIEW MANIFEST
                    </Button>
                    <Button onClick={handleWhatsAppShare} variant="outline" className="flex-1 h-16 rounded-2xl gap-3 bg-green-500/10 border-green-500/20 text-green-400 font-black text-xs tracking-widest hover:bg-green-500/20" disabled={!isEditing}>
                        <FaWhatsapp className="h-5 w-5" /> WHATSAPP SHARE
                    </Button>
                </div>
            </CardFooter>
        </Card>

        <Card className="md:col-span-1 h-fit glass-panel rounded-[3rem] border-white/5 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5">
                 <div className="flex items-center justify-between gap-6">
                    <div>
                        <CardTitle className="text-xl font-black tracking-tight uppercase">Recent Loads</CardTitle>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">{yearlyCount} Manifests Active</p>
                    </div>
                    <div className="relative w-full max-w-[150px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                        <Input 
                            placeholder="Search..." 
                            className="pl-10 h-12 rounded-xl bg-white/5 border-white/10 font-bold text-[10px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                    <div className="divide-y divide-white/5">
                        {filteredReceipts.map(receipt => (
                            <div key={receipt.no} className="group flex justify-between items-center p-8 hover:bg-white/[0.03] transition-all">
                                <div>
                                    <p className="text-xs font-black text-accent uppercase tracking-widest mb-1">Receipt #{receipt.no}</p>
                                    <p className="text-base font-black tracking-tight text-white">{receipt.customerName}</p>
                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1">{new Date(receipt.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => loadReceiptForEdit(receipt)} className="h-10 w-10 rounded-xl hover:bg-white/10">
                                        <FilePenLine className="h-4 w-4 text-accent" />
                                    </Button>
                                    {userRole === 'admin' && (
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteReceipt(receipt.no)} className="h-10 w-10 rounded-xl hover:bg-rose-500/20">
                                        <Trash2 className="h-4 w-4 text-rose-500" />
                                    </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                         {savedReceipts.length === 0 && (
                            <div className="p-20 text-center space-y-4 opacity-30">
                                <Search className="h-12 w-12 mx-auto" />
                                <p className="text-xs font-black uppercase tracking-widest">No inward manifests indexed</p>
                            </div>
                         )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
}





