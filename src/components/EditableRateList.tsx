
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ManualRate {
    id: string;
    category: string;
    variety: string;
    rate: string;
}

interface EditableRateListProps {
    storageKeyPrefix: string;
    title: string;
    defaultRates: ManualRate[];
}

export default function EditableRateList({ storageKeyPrefix, title, defaultRates }: EditableRateListProps) {
    const { toast } = useToast();
    const [rates, setRates] = useState<ManualRate[]>([]);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient) {
            let loadedRates: ManualRate[] = [];
            let hasSavedData = false;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(storageKeyPrefix)) {
                    hasSavedData = true;
                    loadedRates.push(JSON.parse(localStorage.getItem(key)!));
                }
            }
            if (!hasSavedData) {
                // If no saved data, load defaults and save them
                defaultRates.forEach(rate => {
                    localStorage.setItem(`${storageKeyPrefix}${rate.id}`, JSON.stringify(rate));
                });
                setRates(defaultRates);
            } else {
                setRates(loadedRates.sort((a,b) => a.id.localeCompare(b.id)));
            }
        }
    }, [isClient, storageKeyPrefix, defaultRates]);

    const handleUpdate = (id: string, field: keyof ManualRate, value: string) => {
        const newRates = rates.map(r => r.id === id ? { ...r, [field]: value } : r);
        setRates(newRates);
    };
    
    const handleSave = () => {
        rates.forEach(rate => {
            if (rate.id && rate.category && rate.variety && rate.rate) {
                 localStorage.setItem(`${storageKeyPrefix}${rate.id}`, JSON.stringify(rate));
            }
        });
        toast({ title: 'Rates Saved', description: 'Your manual rates have been updated.' });
    };

    const addRate = () => {
        const newId = `manual-${Date.now()}`;
        setRates([...rates, { id: newId, category: '', variety: '', rate: '' }]);
    };
    
    const removeRate = (id: string) => {
        localStorage.removeItem(`${storageKeyPrefix}${id}`);
        setRates(rates.filter(r => r.id !== id));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">
                    📝 {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Variety/Item</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rates.map(rate => (
                             <TableRow key={rate.id}>
                                <TableCell>
                                    <Input 
                                        placeholder="e.g., Fungicide, State"
                                        value={rate.category} 
                                        onChange={e => handleUpdate(rate.id, 'category', e.target.value)} 
                                    />
                                </TableCell>
                                <TableCell>
                                     <Input 
                                        placeholder="e.g., Mancozeb, American"
                                        value={rate.variety} 
                                        onChange={e => handleUpdate(rate.id, 'variety', e.target.value)} 
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        placeholder="e.g., 550-600"
                                        value={rate.rate} 
                                        onChange={e => handleUpdate(rate.id, 'rate', e.target.value)} 
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => removeRate(rate.id)}>
                                        <Trash2 className="text-red-500 h-4 w-4"/>
                                    </Button>
                                </TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="mt-4 flex justify-between">
                    <Button variant="outline" size="sm" onClick={addRate} className="gap-2">
                        <PlusCircle className="h-4 w-4" /> Add Rate
                    </Button>
                    <Button onClick={handleSave}>Save Manual Rates</Button>
                </div>
            </CardContent>
        </Card>
    );
}

