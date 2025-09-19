
'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Sparkles, AlertCircle } from 'lucide-react';
import { extractReceiptFromImage, ReceiptExtractOutput } from '@/ai/flows/extract-receipt-flow';
import { useApiKey } from '@/hooks/use-api-key';

interface ScanReceiptTabProps {
    setReceiptTab: () => void;
}

export function ScanReceiptTab({ setReceiptTab }: ScanReceiptTabProps) {
    const { toast } = useToast();
    const { apiKey, isApiKeySet } = useApiKey();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);

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
            toast({ variant: 'destructive', title: 'API Key Required', description: 'Please set your Gemini API key in the Settings to use AI features.' });
            return;
        }

        setIsScanning(true);
        try {
            const photoDataUri = await fileToDataUri(imageFile);
            const result: ReceiptExtractOutput = await extractReceiptFromImage({ photoDataUri, apiKey });
            
            // Store the result in local storage to be picked up by the other tab
            localStorage.setItem('scannedReceiptData', JSON.stringify(result));

            toast({
                title: 'Scan Successful!',
                description: 'Receipt data has been extracted. Please review and save in the "Manual Goods Receipt" tab.',
            });

            // Switch to the manual tab
            setReceiptTab();

        } catch (error) {
            console.error('Error scanning receipt:', error);
            toast({ variant: 'destructive', title: 'Scan Failed', description: 'The AI could not extract data from the image. Please try again or enter manually.' });
        } finally {
            setIsScanning(false);
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>Scan Goods Receipt with AI</CardTitle>
                <CardDescription>Upload a photo of a handwritten or printed Goods Receipt, and let AI automatically extract the information for you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {!isApiKeySet && (
                    <div className="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5"/>
                        <span className="font-medium">API Key Needed!</span> Please go to the main Sales Invoices tab and set your Gemini API key to enable this feature.
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="receipt-image">Upload Receipt Image</Label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="receipt-image" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                           {imagePreview ? (
                                <img src={imagePreview} alt="Receipt preview" className="object-contain h-full w-full rounded-lg" />
                           ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP</p>
                            </div>
                           )}
                            <Input id="receipt-image" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
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
