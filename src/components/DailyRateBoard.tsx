'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Download, Share2, Camera, Calendar, Loader2, Eraser } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { Logo } from './logo';

interface RateEntry {
    id: string;
    name: string;
    minRate: number;
    maxRate: number;
}

const STORAGE_KEY = 'manual-daily-rates';

export default function DailyRateBoard() {
    const { toast } = useToast();
    const boardRef = useRef<HTMLDivElement>(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [entries, setEntries] = useState<RateEntry[]>([]);
    const [newItem, setNewItem] = useState({ name: '', min: '', max: '' });
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.date === date) {
                    setEntries(parsed.entries);
                }
            } catch (e) {
                console.error("Failed to load saved rates", e);
            }
        }
    }, [date]);

    const saveToLocal = (newEntries: RateEntry[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            date,
            entries: newEntries
        }));
    };

    const handleAddEntry = () => {
        if (!newItem.name || !newItem.min || !newItem.max) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill in name and both rates.' });
            return;
        }
        const entry: RateEntry = {
            id: Date.now().toString(),
            name: newItem.name,
            minRate: Number(newItem.min),
            maxRate: Number(newItem.max)
        };
        const updated = [...entries, entry];
        setEntries(updated);
        saveToLocal(updated);
        setNewItem({ name: '', min: '', max: '' });
    };

    const handleRemoveEntry = (id: string) => {
        const updated = entries.filter(e => e.id !== id);
        setEntries(updated);
        saveToLocal(updated);
    };

    const handleClear = () => {
        if (window.confirm("Are you sure you want to clear today's rate board?")) {
            setEntries([]);
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    const downloadAsImage = async () => {
        if (!boardRef.current) return;
        setIsGenerating(true);
        toast({ title: "Generating Image", description: "Please wait while we prepare your rate list..." });

        try {
            const canvas = await html2canvas(boardRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });
            const link = document.createElement('a');
            link.download = `FCo-Rates-${date}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast({ title: "Image Saved", description: "The rate list has been downloaded to your device." });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Export Failed", description: "Could not generate image." });
        } finally {
            setIsGenerating(false);
        }
    };

    const shareAsText = () => {
        const dateStr = new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        let text = `*DAILY MARKET RATES - ${dateStr}*\n`;
        text += `*FIRDOUS AHMAD & COMPANY, SOPORE*\n\n`;
        text += `| Fruit Variety | Rate Range |\n`;
        text += `| :--- | :--- |\n`;
        
        entries.forEach(e => {
            text += `- ${e.name}: *₹${e.minRate} - ₹${e.maxRate}*\n`;
        });

        text += `\n_Your Satisfaction is our Success_`;
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="space-y-6">
            <Card className="print-hidden border-primary/20 bg-card/40 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Today's Market Rate Entry
                    </CardTitle>
                    <CardDescription>Enter the minimum and maximum rates for fruits today.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-1">
                            <Label>Fruit Name / Variety</Label>
                            <Input 
                                placeholder="e.g. Red Delicious" 
                                value={newItem.name} 
                                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddEntry()}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label>Min Rate</Label>
                                <Input 
                                    type="number" 
                                    placeholder="0" 
                                    value={newItem.min} 
                                    onChange={(e) => setNewItem({...newItem, min: e.target.value})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Rate</Label>
                                <Input 
                                    type="number" 
                                    placeholder="0" 
                                    value={newItem.max} 
                                    onChange={(e) => setNewItem({...newItem, max: e.target.value})} 
                                />
                            </div>
                        </div>
                        <Button onClick={handleAddEntry} className="gap-2">
                            <PlusCircle className="h-4 w-4" /> Add to List
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={downloadAsImage} disabled={entries.length === 0 || isGenerating} className="gap-2">
                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                            Save as Image
                        </Button>
                        <Button variant="outline" onClick={shareAsText} disabled={entries.length === 0} className="gap-2">
                            <FaWhatsapp className="h-4 w-4 text-green-500" />
                            Share on WhatsApp
                        </Button>
                    </div>
                    <Button variant="ghost" onClick={handleClear} disabled={entries.length === 0} className="text-destructive hover:bg-destructive/10 gap-2">
                        <Eraser className="h-4 w-4" /> Clear All
                    </Button>
                </CardFooter>
            </Card>

            {/* The Actual Board that will be captured as an image */}
            <div className="flex justify-center">
                <div 
                    ref={boardRef} 
                    className="w-full max-w-2xl bg-white text-black p-8 rounded-lg shadow-2xl border-4 border-green-700 font-serif"
                    style={{ minHeight: '600px' }}
                >
                    <header className="text-center border-b-4 border-green-700 pb-4 mb-6">
                        <div className="flex justify-center mb-2">
                            <Logo className="h-16 w-16 text-green-800" />
                        </div>
                        <h1 className="text-3xl font-black text-green-800 tracking-tighter uppercase">Firdous Ahmad & Company</h1>
                        <p className="text-sm font-bold text-gray-600">Fruit Merchants & Commission Agents, Sopore Mandi</p>
                        <p className="text-xs text-gray-500 mt-1">Ph: 7006136330, 9797002164 | Shop No. 13, Sopore</p>
                    </header>

                    <div className="flex justify-between items-center mb-6">
                        <div className="bg-green-100 px-4 py-2 rounded-full border border-green-200">
                            <span className="text-green-800 font-bold uppercase tracking-widest text-sm">Official Daily Rates</span>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase font-bold">Dated</p>
                            <p className="text-xl font-black text-green-900">
                                {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <Table className="border-collapse">
                        <TableHeader>
                            <TableRow className="bg-green-700 hover:bg-green-700">
                                <TableHead className="text-white font-bold uppercase py-4">Fruit Variety</TableHead>
                                <TableHead className="text-white font-bold uppercase py-4 text-right">Min Rate</TableHead>
                                <TableHead className="text-white font-bold uppercase py-4 text-right">Max Rate</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.length > 0 ? entries.map((e, i) => (
                                <TableRow key={e.id} className={i % 2 === 0 ? 'bg-green-50/50' : 'bg-white'}>
                                    <TableCell className="font-bold py-4 text-lg border-b border-green-100">{e.name}</TableCell>
                                    <TableCell className="text-right py-4 font-mono text-xl border-b border-green-100">₹{e.minRate}</TableCell>
                                    <TableCell className="text-right py-4 font-mono text-xl font-bold border-b border-green-100">₹{e.maxRate}</TableCell>
                                    <TableCell className="print-hidden p-0 w-8 border-b border-green-100">
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveEntry(e.id)} className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-20 text-gray-400 italic">
                                        No rates entered for this date.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <footer className="mt-12 text-center border-t-2 border-dashed border-green-200 pt-6">
                        <p className="text-green-800 font-bold italic">"Your Satisfaction is our Success"</p>
                        <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest">Powered by F.Co App | Sopore Mandi intelligence</p>
                    </footer>
                </div>
            </div>
        </div>
    );
}
