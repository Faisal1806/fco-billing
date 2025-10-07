
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, FilePenLine, FilePlus, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ScrollArea } from './ui/scroll-area';
import { saveDocument, deleteDocument } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import { PartySelector } from './party-selector';

type ChallanEntry = {
  peti: number;
  daba: number;
  kind: string;
  khata: string;
  rate: number;
  totalFreight: number;
  advance: number;
  balance: number;
  expenditure: number;
};

const ChallanEntryRow = ({
  entry,
  onUpdate,
  onRemove,
}: {
  entry: ChallanEntry;
  onUpdate: (field: keyof ChallanEntry, value: string | number) => void;
  onRemove: () => void;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-10 gap-2 items-center">
    <Input type="number" placeholder="Peti" value={entry.peti || ''} onChange={(e) => onUpdate('peti', Number(e.target.value))} className="md:col-span-1" />
    <Input type="number" placeholder="Daba" value={entry.daba || ''} onChange={(e) => onUpdate('daba', Number(e.target.value))} className="md:col-span-1" />
    <Input placeholder="Kind" value={entry.kind} onChange={(e) => onUpdate('kind', e.target.value)} className="md:col-span-2" />
    <Input placeholder="Khata" value={entry.khata} onChange={(e) => onUpdate('khata', e.target.value)} className="md:col-span-1" />
    <Input type="number" placeholder="Rate" value={entry.rate || ''} onChange={(e) => onUpdate('rate', Number(e.target.value))} className="md:col-span-1" />
    <Input type="number" placeholder="Freight" value={entry.totalFreight || ''} onChange={(e) => onUpdate('totalFreight', Number(e.target.value))} className="md:col-span-1" />
    <Input type="number" placeholder="Advance" value={entry.advance || ''} onChange={(e) => onUpdate('advance', Number(e.target.value))} className="md:col-span-1" />
    <Input type="number" placeholder="Balance" value={entry.balance || ''} onChange={(e) => onUpdate('balance', Number(e.target.value))} className="md:col-span-1" />
    <Input type="number" placeholder="Exp." value={entry.expenditure || ''} onChange={(e) => onUpdate('expenditure', Number(e.target.value))} className="md:col-span-1" />
    <Button variant="ghost" size="icon" onClick={onRemove}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  </div>
);

const normalizeForId = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function ChallanMakingTab() {
  const { toast, dismiss } = useToast();
  const router = useRouter();

  const initialDetails = {
    challanNo: '',
    date: '',
    toMs: '',
    vehicleNo: '',
    company: '',
    driverName: '',
    tollTax: 0,
    payOnlyFreight: 0,
  };
  const initialEntries: ChallanEntry[] = Array.from({length: 5}, () => (
    { peti: 0, daba: 0, kind: '', khata: '', rate: 0, totalFreight: 0, advance: 0, balance: 0, expenditure: 0 }
  ));

  const [entries, setEntries] = React.useState<ChallanEntry[]>(initialEntries);
  const [details, setDetails] = React.useState(initialDetails);
  const [isEditing, setIsEditing] = React.useState(false);
  const [savedChallans, setSavedChallans] = React.useState<any[]>([]);
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole'));
    }
  }, []);

  const fetchChallans = () => {
    const challans = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('challan-')) {
            try {
                const challan = JSON.parse(localStorage.getItem(key)!);
                challans.push(challan);
            } catch(e) {
                console.error("Failed to parse challan from local storage", e);
            }
        }
    }
    setSavedChallans(challans.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  
  React.useEffect(() => {
    fetchChallans();
  }, []);

  const yearlyCount = React.useMemo(() => {
    if(!savedChallans) return 0;
    const currentYear = new Date().getFullYear();
    return savedChallans.filter(c => new Date(c.date).getFullYear() === currentYear).length;
  }, [savedChallans]);

  const handleEntryUpdate = (
    index: number,
    field: keyof ChallanEntry,
    value: string | number
  ) => {
    setEntries((prevEntries) => {
      const newEntries = [...prevEntries];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return newEntries;
    });
  };

  const handleDetailChange = (field: keyof typeof details, value: string | number) => {
    setDetails(prev => ({...prev, [field]: value}));
  }

  const addSlot = () => {
    setEntries((prev) => [...prev, { peti: 0, daba: 0, kind: '', khata: '', rate: 0, totalFreight: 0, advance: 0, balance: 0, expenditure: 0 }]);
  };

  const removeSlot = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };
  
  const totalPetti = entries.reduce((acc, entry) => acc + (Number(entry.peti) || 0), 0);
  const totalDabba = entries.reduce((acc, entry) => acc + (Number(entry.daba) || 0), 0);
  const totalNugs = totalPetti + totalDabba;

  const resetForm = () => {
    setDetails(initialDetails);
    setEntries(initialEntries);
    setIsEditing(false);
  };

  const handleSaveChallan = async () => {
    if (!details.challanNo || !details.date || !details.toMs) {
        toast({
            variant: 'destructive',
            title: 'Missing Details',
            description: 'Please fill in Delivery Note No., Date, and To, M/s before saving.',
        });
        return;
    }
    // Create a unique ID from party name and challan number
    const partyIdPart = normalizeForId(details.toMs);
    const challanId = `${partyIdPart}-${details.challanNo}`;

    const challanData = {
        id: challanId,
        ...details,
        entries: entries.filter(e => e.kind || e.khata || e.peti > 0 || e.daba > 0),
        totalPetti,
        totalDabba,
        totalNugs
    };
    
    localStorage.setItem(`challan-${challanId}`, JSON.stringify(challanData));
    
    const { id } = toast({
      lottie: '/animations/bill_saved.json',
      title: isEditing ? 'Delivery Note Updated!' : 'Delivery Note Saved!',
      description: 'The delivery note has been successfully saved.',
    });
    setTimeout(() => dismiss(id), 2000);

    fetchChallans(); // Re-fetch to update list
    setIsEditing(true);
  };

   const handleViewChallan = () => {
      if (!isEditing || !details.challanNo || !details.toMs) {
          toast({ variant: 'destructive', title: 'Cannot View', description: 'Please save the delivery note first.'});
          return;
      }
      const partyIdPart = normalizeForId(details.toMs);
      const challanId = `${partyIdPart}-${details.challanNo}`;
      router.push(`/challan/${encodeURIComponent(challanId)}`);
  };

  const loadChallanForEdit = (challan: any) => {
    setDetails({
      challanNo: challan.challanNo,
      date: challan.date,
      toMs: challan.toMs,
      vehicleNo: challan.vehicleNo,
      company: challan.company,
      driverName: challan.driverName,
      tollTax: challan.tollTax,
      payOnlyFreight: challan.payOnlyFreight,
    });
    setEntries(challan.entries.length > 0 ? challan.entries : initialEntries);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleDeleteChallan = async (challan: any) => {
    if(userRole !== 'admin') {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to delete delivery notes.' });
      return;
    }
    if(!window.confirm(`Are you sure you want to delete Delivery Note #${challan.challanNo} for ${challan.toMs}? This action cannot be undone.`)) {
        return;
    }
    
    localStorage.removeItem(`challan-${challan.id}`);

    try {
        await deleteDocument('challans', challan.id);
        toast({
            title: "Delivery Note Deleted",
            description: `Delivery Note #${challan.challanNo} has been successfully deleted from local and cloud storage.`
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Cloud Delete Failed",
            description: "Could not delete delivery note from cloud, but it was removed locally."
        });
    }

    fetchChallans(); // Re-fetch to update list
    if (details.challanNo === challan.challanNo && details.toMs === challan.toMs) {
        resetForm();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
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
                     {isEditing && (
                        <Button variant="outline" size="sm" onClick={resetForm} className="gap-2 ml-4">
                            <FilePlus className="h-4 w-4" />
                            New Delivery Note
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="space-y-2">
                        <Label>Delivery Note No.</Label>
                        <Input value={details.challanNo} onChange={e => handleDetailChange('challanNo', e.target.value)} disabled={isEditing} />
                    </div>
                    <div className="space-y-2">
                        <Label>Dated</Label>
                        <Input type="date" value={details.date} onChange={e => handleDetailChange('date', e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2">
                        <Label>To, M/s (Customer / Outside Party)</Label>
                        <PartySelector value={details.toMs} onChange={(val) => handleDetailChange('toMs', val)} filter="customer" disabled={isEditing} />
                    </div>
                     <div className="space-y-2">
                        <Label>Vehicle No.</Label>
                        <Input placeholder="Vehicle Number" value={details.vehicleNo} onChange={e => handleDetailChange('vehicleNo', e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label>Company</Label>
                        <Input placeholder="Transport Company" value={details.company} onChange={e => handleDetailChange('company', e.target.value)} />
                    </div>
                     <div className="space-y-2 col-span-2">
                        <Label>Name of Driver</Label>
                        <Input placeholder="Driver's Name" value={details.driverName} onChange={e => handleDetailChange('driverName', e.target.value)} />
                    </div>
                </div>
                
                <Separator />

                <div className="space-y-4">
                <div className="space-y-2">
                    <div className="hidden md:grid grid-cols-10 items-center gap-2 text-sm text-muted-foreground">
                        <Label className="md:col-span-1">Peti</Label>
                        <Label className="md:col-span-1">Daba</Label>
                        <Label className="md:col-span-2">Kind</Label>
                        <Label className="md:col-span-1">Khata</Label>
                        <Label className="md:col-span-1">Rate</Label>
                        <Label className="md:col-span-1">Freight</Label>
                        <Label className="md:col-span-1">Advance</Label>
                        <Label className="md:col-span-1">Balance</Label>
                        <Label className="md:col-span-1">Exp.</Label>
                        <div className="w-10"></div>
                    </div>
                    {entries.map((entry, index) => (
                    <ChallanEntryRow
                        key={index}
                        entry={entry}
                        onUpdate={(field, value) => handleEntryUpdate(index, field, value)}
                        onRemove={() => removeSlot(index)}
                    />
                    ))}
                    <Button variant="outline" size="sm" className="gap-1 mt-2" onClick={addSlot}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    Add Item
                    </Button>
                </div>
                </div>

                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-4 font-medium">
                    <div>Total Petti: {totalPetti}</div>
                    <div>Total Dabba: {totalDabba}</div>
                    <div>Total Nugs: {totalNugs}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    <div className="flex items-center gap-4">
                        <Label>All toll tax paid in cash Rs:</Label>
                        <Input className="text-right" type="number" value={details.tollTax || ''} onChange={(e) => handleDetailChange('tollTax', Number(e.target.value))} />
                    </div>
                     <div className="flex items-center gap-4">
                        <Label>Pay only Freight Rs:</Label>
                        <Input className="text-right" type="number" value={details.payOnlyFreight || ''} onChange={(e) => handleDetailChange('payOnlyFreight', Number(e.target.value))} />
                    </div>
                </div>

            </CardContent>
            <CardFooter className="flex justify-center gap-4">
                 <Button onClick={handleSaveChallan} className="w-full max-w-xs">{isEditing ? 'Update Note' : 'Save Note'}</Button>
                <Button onClick={handleViewChallan} variant="secondary" className="w-full max-w-xs gap-2" disabled={!isEditing}>
                    <FileText className="h-4 w-4" /> View Note
                </Button>
            </CardFooter>
        </Card>
        <Card className="lg:col-span-1 h-fit">
            <CardHeader>
                <h3 className="text-lg font-medium flex items-center gap-2">
                    Recent Delivery Notes
                    <Badge variant="secondary">{yearlyCount} This Year</Badge>
                </h3>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <div className="space-y-2">
                        {savedChallans.map(challan => (
                            <div key={challan.id} className="flex justify-between items-center p-2 border rounded-md">
                                <div>
                                    <p className="font-medium">Note #{challan.challanNo}</p>
                                    <p className="text-sm text-muted-foreground">{challan.toMs}</p>
                                    <p className="text-sm text-muted-foreground">{new Date(challan.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center">
                                    <Button variant="ghost" size="icon" onClick={() => loadChallanForEdit(challan)}>
                                        <FilePenLine className="h-4 w-4" />
                                    </Button>
                                    {userRole === 'admin' && (
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteChallan(challan)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                         {savedChallans.length === 0 && <p className="text-sm text-muted-foreground text-center">No recent delivery notes found.</p>}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
}
