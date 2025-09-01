
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';

interface Rate {
    id: string;
    category: string;
    variety: string;
    rate: string;
}

const STORAGE_KEY_PREFIX = 'daily-rate-list-';

const getStorageKey = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return `${STORAGE_KEY_PREFIX}${dateString}`;
};

export default function EditableRateList() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [rates, setRates] = useState<Rate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        const storageKey = getStorageKey(currentDate);
        const storedRates = localStorage.getItem(storageKey);
        if (storedRates) {
            setRates(JSON.parse(storedRates));
        } else {
            setRates([]);
        }
        setIsLoading(false);
    }, [currentDate]);

    const handleSave = () => {
        const storageKey = getStorageKey(currentDate);
        localStorage.setItem(storageKey, JSON.stringify(rates));
        toast({
            title: 'Rates Saved',
            description: `The rate list for ${currentDate.toLocaleDateString()} has been saved.`,
        });
    };
    
    const handleAddRate = () => {
        const newRate: Rate = {
            id: crypto.randomUUID(),
            category: '',
            variety: '',
            rate: '',
        };
        setRates([...rates, newRate]);
    };

    const handleUpdateRate = (id: string, field: keyof Omit<Rate, 'id'>, value: string) => {
        setRates(
            rates.map(rate => (rate.id === id ? { ...rate, [field]: value } : rate))
        );
    };

    const handleRemoveRate = (id: string) => {
        setRates(rates.filter(rate => rate.id !== id));
    };

    const handleDateChange = (days: number) => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setDate(newDate.getDate() + days);
            return newDate;
        });
    };

    const handleShare = () => {
        const dateString = currentDate.toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        
        let shareText = `*Daily Rate List - ${dateString}*\n`;
        shareText += `*FIRDOUS AHMAD & COMPANY*\n\n`;

        const groupedRates: {[key: string]: Rate[]} = rates.reduce((acc, rate) => {
            const category = rate.category || 'Uncategorized';
            if (!acc[category]) acc[category] = [];
            acc[category].push(rate);
            return acc;
        }, {} as {[key: string]: Rate[]});

        for (const category in groupedRates) {
            shareText += `*${category.toUpperCase()}*\n`;
            groupedRates[category].forEach(rate => {
                if (rate.variety && rate.rate) {
                   shareText += `- ${rate.variety}: *₹${rate.rate}*\n`;
                }
            });
            shareText += '\n';
        }
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
    };
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-2xl font-bold text-primary">
                            📝 Editable Daily Rate List
                        </CardTitle>
                        <CardDescription>
                            Manage and share your daily market rates.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleDateChange(-1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold">{currentDate.toLocaleDateString('en-CA')}</span>
                        <Button variant="outline" size="icon" onClick={() => handleDateChange(1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Variety</TableHead>
                            <TableHead>Rate (e.g., 500-600)</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rates.map(rate => (
                            <TableRow key={rate.id}>
                                <TableCell>
                                    <Input
                                        placeholder="e.g., Apples"
                                        value={rate.category}
                                        onChange={(e) => handleUpdateRate(rate.id, 'category', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        placeholder="e.g., Red Delicious"
                                        value={rate.variety}
                                        onChange={(e) => handleUpdateRate(rate.id, 'variety', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        placeholder="e.g., 800-900"
                                        value={rate.rate}
                                        onChange={(e) => handleUpdateRate(rate.id, 'rate', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveRate(rate.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="mt-4 flex justify-between">
                     <Button variant="outline" onClick={handleAddRate} className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Add Rate
                    </Button>
                    <div className="flex gap-2">
                        <Button onClick={handleSave} className="gap-2">
                            <Save className="h-4 w-4" />
                            Save
                        </Button>
                        <Button variant="secondary" onClick={handleShare} className="gap-2">
                            <FaWhatsapp className="h-4 w-4 text-green-500" />
                            Share List
                        </Button>
                    </div>
                </div>
                {rates.length === 0 && !isLoading && (
                     <div className="text-center text-muted-foreground mt-6 py-12 border-2 border-dashed rounded-lg">
                        <p>No rates found for this date.</p>
                        <p className="text-sm">Click "Add Rate" to get started.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
