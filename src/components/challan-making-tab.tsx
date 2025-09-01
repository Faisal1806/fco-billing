
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
import { PlusCircle, Trash2, FilePenLine, FilePlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ScrollArea } from './ui/scroll-area';

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
  <div className="flex items-center gap-2">
    <Input type="number" placeholder="Peti" value={entry.peti || ''} onChange={(e) => onUpdate('peti', Number(e.target.value))} className="w-20" />
    <Input type="number" placeholder="Daba" value={entry.daba || ''} onChange={(e) => onUpdate('daba', Number(e.target.value))} className="w-20" />
    <Input placeholder="Kind" value={entry.kind} onChange={(e) => onUpdate('kind', e.target.value)} className="flex-1" />
    <Input placeholder="Khata" value={entry.khata} onChange={(e) => onUpdate('khata', e.target.value)} className="flex-1" />
    <Input type="number" placeholder="Rate" value={entry.rate || ''} onChange={(e) => onUpdate('rate', Number(e.target.value))} className="w-24" />
    <Input type="number" placeholder="Freight" value={entry.totalFreight || ''} onChange={(e) => onUpdate('totalFreight', Number(e.target.value))} className="w-24" />
    <Input type="number" placeholder="Advance" value={entry.advance || ''} onChange={(e) => onUpdate('advance', Number(e.target.value))} className="w-24" />
    <Input type="number" placeholder="Balance" value={entry.balance || ''} onChange={(e) => onUpdate('balance', Number(e.target.value))} className="w-24" />
    <Input type="number" placeholder="Exp." value={entry.expenditure || ''} onChange={(e) => onUpdate('expenditure', Number(e.target.value))} className="w-24" />
    <Button variant="ghost" size="icon" onClick={onRemove}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  </div>
);

export function ChallanMakingTab() {
  const { toast } = useToast();
  const router = useRouter();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

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
  const initialEntries: ChallanEntry[] = [
    { peti: 0, daba: 0, kind: '', khata: '', rate: 0, totalFreight: 0, advance: 0, balance: 0, expenditure: 0 },
  ];

  const [entries, setEntries] = React.useState<ChallanEntry[]>(initialEntries);
  const [details, setDetails] = React.useState(initialDetails);
  const [isEditing, setIsEditing] = React.useState(false);
  const [savedChallans, setSavedChallans] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (isClient) {
      const challans = [];
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('challan-')) {
              const challan = JSON.parse(localStorage.getItem(key)!);
              challans.push(challan);
          }
      }
      setSavedChallans(challans.sort((a,b) => (a.challanNo > b.challanNo) ? 1 : -1));
    }
  }, [isClient]);

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
  
  const totalPetti = entries.reduce((acc, entry) => acc + (entry.peti || 0), 0);
  const totalDabba = entries.reduce((acc, entry) => acc + (entry.daba || 0), 0);
  const totalNugs = totalPetti + totalDabba;

  const resetForm = () => {
    setDetails(initialDetails);
    setEntries(initialEntries);
    setIsEditing(false);
  };

  const handleCreateChallan = () => {
    if (!details.challanNo || !details.date || !details.toMs) {
        toast({
            variant: 'destructive',
            title: 'Missing Details',
            description: 'Please fill in Challan No., Date, and To, M/s before saving.',
        });
        return;
    }
    const challanId = details.challanNo;
    const challanData = {
        ...details,
        entries,
        totalPetti,
        totalDabba,
        totalNugs
    };
    
    localStorage.setItem(`challan-${challanId}`, JSON.stringify(challanData));
    setSavedChallans(prev => [...prev.filter(r => r.challanNo !== challanId), challanData].sort((a,b) => (a.challanNo > b.challanNo) ? 1 : -1));

    toast({
      title: isEditing ? 'Challan Updated' : 'Challan Saved',
      description: 'The challan has been successfully saved.',
    });
    router.push(`/challan/${challanId}`);
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
    setEntries(challan.entries);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleDeleteChallan = async (challanId: string) => {
    if(!window.confirm(`Are you sure you want to delete Challan #${challanId}? This action cannot be undone.`)) {
        return;
    }
    try {
        localStorage.removeItem(`challan-${challanId}`);
        setSavedChallans(prev => prev.filter(c => c.challanNo !== challanId));
        toast({
            title: "Challan Deleted",
            description: `Challan #${challanId} has been successfully deleted.`
        });
        if (details.challanNo === challanId) {
            resetForm();
        }
    } catch (error) {
        console.error("Error deleting challan:", error);
        toast({
            variant: "destructive",
            title: "Delete Failed",
            description: "Could not delete the challan."
        });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="text-center flex-1">
                        <h2 className="text-2xl font-bold">F.Co - FIRDOUS AHMAD & COMPANY</h2>
                        <p className="text-sm text-muted-foreground">Fruit Merchants & Commission Agents</p>
                        <p className="text-xs text-muted-foreground">SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.</p>
                         <p className="text-xs text-muted-foreground">Prop: Firdous Ahmad Lone (Nadihal) | Cell: 7006136330, 9797002164, 9906740921 | Email: lone07936@gmail.com</p>
                    </div>
                     {isEditing && (
                        <Button variant="outline" size="sm" onClick={resetForm} className="gap-2">
                            <FilePlus className="h-4 w-4" />
                            New Challan
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="space-y-2">
                        <Label>Challan No.</Label>
                        <Input value={details.challanNo} onChange={e => handleDetailChange('challanNo', e.target.value)} disabled={isEditing} />
                    </div>
                    <div className="space-y-2">
                        <Label>Dated</Label>
                        <Input type="date" value={details.date} onChange={e => handleDetailChange('date', e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2">
                        <Label>To, M/s</Label>
                        <Input placeholder="Consignee Name" value={details.toMs} onChange={e => handleDetailChange('toMs', e.target.value)} />
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
                    <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                        <Label className="w-20">Peti</Label>
                        <Label className="w-20">Daba</Label>
                        <Label className="flex-1">Kind</Label>
                        <Label className="flex-1">Khata</Label>
                        <Label className="w-24">Rate</Label>
                        <Label className="w-24">Freight</Label>
                        <Label className="w-24">Advance</Label>
                        <Label className="w-24">Balance</Label>
                        <Label className="w-24">Exp.</Label>
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
                    <Button variant="outline" size="sm" className="gap-1" onClick={addSlot}>
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
            <CardFooter className="flex justify-center">
                <Button onClick={handleCreateChallan} className="w-full max-w-sm">{isEditing ? 'Update & View Challan' : 'Save & View Challan'}</Button>
            </CardFooter>
        </Card>
        <Card className="md:col-span-1 h-fit">
            <CardHeader>
                <h3 className="text-lg font-medium">Recent Challans</h3>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <div className="space-y-2">
                        {savedChallans.map(challan => (
                            <div key={challan.challanNo} className="flex justify-between items-center p-2 border rounded-md">
                                <div>
                                    <p className="font-medium">Challan #{challan.challanNo}</p>
                                    <p className="text-sm text-muted-foreground">{challan.toMs}</p>
                                    <p className="text-sm text-muted-foreground">{new Date(challan.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center">
                                    <Button variant="ghost" size="icon" onClick={() => loadChallanForEdit(challan)}>
                                        <FilePenLine className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteChallan(challan.challanNo)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                         {savedChallans.length === 0 && <p className="text-sm text-muted-foreground text-center">No recent challans found.</p>}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
}
