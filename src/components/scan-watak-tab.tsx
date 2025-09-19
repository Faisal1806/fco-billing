
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Sparkles, AlertCircle } from 'lucide-react';
import { extractWatakFromImage, WatakExtractOutput } from '@/ai/flows/extract-watak-flow';
import { useApiKey } from '@/hooks/use-api-key';

interface ScanWatakTabProps {
    setBillMakingTab: () => void;
}

export function ScanWatakTab({ setBillMakingTab }: ScanWatakTabProps) {
    const { toast } = useToast();
    const { apiKey, isApiKeySet, setApiKey } = useApiKey();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const fileToDataUri = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleScan = async () => {
        if (!imageFile) {
            toast({ variant: 'destructive', title: 'No Image Selected', description: 'Please select an image file to scan.' });
            return;
        }
        if (!isApiKeySet) {
            toast({ variant: 'destructive', title: 'API Key Required', description: 'Please set your Gemini API key to use AI features.' });
            setShowApiKeyInput(true);
            return;
        }

        setIsScanning(true);
        try {
            const photoDataUri = await fileToDataUri(imageFile);
            const result: WatakExtractOutput = await extractWatakFromImage({ photoDataUri, apiKey });
            
            localStorage.setItem('scannedWatakData', JSON.stringify(result));

            toast({
                title: 'Scan Successful!',
                description: 'Watak data has been extracted. Please review and save in the "Sales Invoices" tab.',
            });

            setBillMakingTab();

        } catch (error) {
            console.error('Error scanning Watak:', error);
            toast({ variant: 'destructive', title: 'Scan Failed', description: 'The AI could not extract data from the image. Please try again or enter manually.' });
        } finally {
            setIsScanning(false);
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>Scan Watak (Sales Invoice) with AI</CardTitle>
                <CardDescription>Upload a photo of a handwritten or printed Watak, and let AI automatically extract the information for you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {!isApiKeySet && (
                     <div className="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5"/>
                        <span className="font-medium">First-time Setup:</span> You need a Gemini API Key to use this AI feature. It's free and easy to get.
                        <Button variant="link" className="p-0 h-auto" onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}>Get API Key</Button>
                        <Button variant="secondary" size="sm" onClick={() => setShowApiKeyInput(true)}>Set Key</Button>
                    </div>
                )}
                 {showApiKeyInput && (
                    <div className="flex items-center gap-2">
                        <Input 
                            type="password"
                            placeholder="Paste your Gemini API Key here"
                            onChange={e => setApiKey(e.target.value)}
                        />
                        <Button onClick={() => {
                            setShowApiKeyInput(false);
                            toast({ title: "API Key Saved", description: "You can now use the AI scanning features." });
                        }}>Save Key</Button>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="watak-image">Upload Watak Image</Label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="watak-image" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                           {imagePreview ? (
                                <img src={imagePreview} alt="Watak preview" className="object-contain h-full w-full rounded-lg" />
                           ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP</p>
                            </div>
                           )}
                            <Input id="watak-image" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                        </label>
                    </div> 
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleScan} disabled={!imageFile || isScanning || !isApiKeySet} className="w-full max-w-md mx-auto">
                    {isScanning ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Scanning...
                        </>
                    ) : (
                         <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Scan and Extract Data
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
