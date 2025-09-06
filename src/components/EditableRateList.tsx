
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { categorizePesticide } from '@/ai/flows/categorize-pesticide-flow';
import { getDocuments, saveDocument, deleteDocument } from '@/lib/actions';

interface ManualRate {
    id: string;
    category: string;
    variety: string;
    rate: string;
}

interface EditableRateListProps {
    storageKeyPrefix: string; // This will now be used as the collection name
    title: string;
    defaultRates: ManualRate[];
}

export default function EditableRateList({ storageKeyPrefix: collectionName, title, defaultRates }: EditableRateListProps) {
    const { toast } = useToast();
    const [rates, setRates] = useState<ManualRate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCategorizing, setIsCategorizing] = useState<string | null>(null);

    useEffect(() => {
        const fetchRates = async () => {
            setIsLoading(true);
            const result = await getDocuments(collectionName);

            if (result.success && result.data) {
                if (result.data.length === 0) {
                    // If no data in cloud, load defaults and save them
                    setRates(defaultRates);
                    // Optionally, you could pre-populate Firestore with default rates here
                    // for (const rate of defaultRates) {
                    //     await saveDocument(collectionName, rate.id, rate);
                    // }
                } else {
                    setRates(result.data.sort((a,b) => a.id.localeCompare(b.id)));
                }
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error fetching rates',
                    description: result.error || 'Could not load rates from the cloud.',
                });
                // Fallback to default rates on error
                setRates(defaultRates);
            }
            setIsLoading(false);
        };
        
        fetchRates();
    }, [collectionName, defaultRates, toast]);

    const handleUpdate = (id: string, field: keyof ManualRate, value: string) => {
        const newRates = rates.map(r => r.id === id ? { ...r, [field]: value } : r);
        setRates(newRates);
    };
    
    const handleSave = async () => {
        let successCount = 0;
        for (const rate of rates) {
            if (rate.id && rate.variety && rate.rate) {
                 const result = await saveDocument(collectionName, rate.id, rate);
                 if (result.success) {
                    successCount++;
                 }
            }
        }
        toast({ title: 'Rates Saved', description: `Successfully saved ${successCount} rates to the cloud.` });
    };

    const addRate = () => {
        const newId = `manual-${Date.now()}`;
        setRates([...rates, { id: newId, category: '', variety: '', rate: '' }]);
    };
    
    const removeRate = async (id: string) => {
        const result = await deleteDocument(collectionName, id);
        if (result.success) {
            setRates(rates.filter(r => r.id !== id));
            toast({ title: 'Rate Deleted' });
        } else {
             toast({ variant: 'destructive', title: 'Delete Failed', description: result.error });
        }
    };

    const handleAutoCategory = async (rateId: string, variety: string) => {
        if (!variety) {
            toast({ variant: 'destructive', title: 'Missing Item Name', description: 'Please enter a name before categorizing.'});
            return;
        }
        setIsCategorizing(rateId);
        try {
            const result = await categorizePesticide({ name: variety });
            handleUpdate(rateId, 'category', result.category);
            toast({ title: 'Category Identified', description: `Set category for ${variety} to "${result.category}".`});
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'AI Categorization Failed', description: 'Could not determine category.' });
        } finally {
            setIsCategorizing(null);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">
                    📝 {title}
                </CardTitle>
                <CardDescription>
                    Manually add or adjust rates for items. Use the ✨ button to let AI automatically set the category for you.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Variety/Item</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rates.map(rate => (
                             <TableRow key={rate.id}>
                                <TableCell>
                                     <Input 
                                        placeholder="e.g., Mancozeb, American"
                                        value={rate.variety} 
                                        onChange={e => handleUpdate(rate.id, 'variety', e.target.value)} 
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                    <Input 
                                        placeholder="e.g., Fungicide, State"
                                        value={rate.category} 
                                        onChange={e => handleUpdate(rate.id, 'category', e.target.value)} 
                                    />
                                    <Button size="icon" variant="ghost" onClick={() => handleAutoCategory(rate.id, rate.variety)} disabled={isCategorizing === rate.id}>
                                       {isCategorizing === rate.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-accent-foreground" />}
                                    </Button>
                                    </div>
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
                )}
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
