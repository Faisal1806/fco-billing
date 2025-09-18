
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, FilePenLine, FilePlus, FileText, Wand2, Upload, Camera, Sparkles, CheckCircle, ExternalLink, AlertTriangle, Loader2, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ScrollArea } from './ui/scroll-area';
import { extractReceiptFromImage, ReceiptExtractOutput } from '@/ai/flows/extract-receipt-flow';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useApiKey } from '@/hooks/use-api-key';

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
  <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
    <Input
      placeholder="Khata"
      value={entry.khata}
      onChange={(e) => onUpdate('khata', e.target.value)}
      className="md:col-span-2"
    />
     <Input
      placeholder="Kind"
      value={entry.kind}
      onChange={(e) => onUpdate('kind', e.target.value)}
      className="md:col-span-1"
    />
    <Input
      type="number"
      placeholder="Peti"
      value={entry.peti || ''}
      onChange={(e) => onUpdate('peti', Number(e.target.value))}
      className="md:col-span-1"
    />
    <Input
      type="number"
      placeholder="Daba"
      value={entry.daba || ''}
      onChange={(e) => onUpdate('daba', Number(e.target.value))}
      className="md:col-span-1"
    />
    <Input
      placeholder="Freight"
      value={entry.freight}
      onChange={(e) => onUpdate('freight', e.target.value)}
      className="md:col-span-1"
    />
    <Button variant="ghost" size="icon" onClick={onRemove}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  </div>
);

export function ReceiptMakingTab() {
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
  
  // AI State
  const { apiKey, setApiKey, isApiKeySet } = useApiKey();
  const [tempApiKey, setTempApiKey] = React.useState('');
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [extractedData, setExtractedData] = React.useState<ReceiptExtractOutput | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
        setUserRole(localStorage.getItem('userRole'));
    }
  }, []);

  const fetchReceipts = () => {
    const receipts = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('receipt-')) {
            const receipt = JSON.parse(localStorage.getItem(key)!);
            receipts.push(receipt);
        }
    }
    setSavedReceipts(receipts.sort((a,b) => (a.no > b.no) ? 1 : -1));
  };
  
  React.useEffect(() => {
    fetchReceipts();
  }, []);
  
   React.useEffect(() => {
    if(isCameraOpen){
        setCapturedImage(null);
        const getCameraPermission = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({video: { facingMode: "environment" }});
            setHasCameraPermission(true);

            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
          }
        };
        getCameraPermission();
        
        return () => {
            if(videoRef.current && videoRef.current.srcObject){
                 const stream = videoRef.current.srcObject as MediaStream;
                 stream.getTracks().forEach(track => track.stop());
            }
        }
    }
  }, [isCameraOpen]);

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
    setSelectedImage(null);
    setImagePreview(null);
    setExtractedData(null);
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
    
    fetchReceipts(); // Re-fetch to update list
    setIsEditing(true);

    toast({
      title: isEditing ? 'Receipt Updated' : 'Receipt Saved',
      description: 'The receipt has been successfully saved to this device.',
    });
  };

  const handleViewReceipt = () => {
      if (!isEditing || !receiptDetails.no) {
          toast({ variant: 'destructive', title: 'Cannot View', description: 'Please save the receipt first.'});
          return;
      }
      router.push(`/receipt/${receiptDetails.no}`);
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
    setEntries(receipt.entries.length > 0 ? receipt.entries : initialEntries);
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
  
    const handleFileSelect = (file: File | null) => {
      if(file){
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
            setExtractedData(null);
        };
        reader.readAsDataURL(file);
      }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(event.target.files?.[0] || null);
  };
  
  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(dataUrl);
    }
  };
  
  const handleUseCapturedPhoto = () => {
      if(capturedImage){
          fetch(capturedImage)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], `receipt-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                handleFileSelect(file);
                setIsCameraOpen(false);
            })
      }
  }

  const handleExtract = async () => {
        if (!isApiKeySet) {
            toast({
                variant: 'destructive',
                title: 'API Key Required',
                description: 'Please set your Gemini API key before using AI extraction.',
            });
            return;
        }
        if (!imagePreview) {
            toast({ variant: 'destructive', title: 'No Image', description: 'Please upload an image first.' });
            return;
        }
        setIsExtracting(true);
        setExtractedData(null);
        try {
            const result = await extractReceiptFromImage({ photoDataUri: imagePreview, apiKey });
            setExtractedData(result);
            toast({ title: 'Extraction Successful', description: 'Review the extracted data and apply it to the form.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'AI Extraction Failed', description: (error as Error).message });
            console.error(error);
        } finally {
            setIsExtracting(false);
        }
  };
  
  const applyExtractedData = () => {
        if (!extractedData) return;
        setReceiptDetails({
            no: extractedData.no,
            date: extractedData.date,
            customerName: extractedData.customerName,
            ro: extractedData.ro || '',
            freightPaid: extractedData.freightPaid || 0,
            wattakReadyOn: extractedData.wattakReadyOn || '',
        });

        const newRows = extractedData.entries.map(entry => ({
            ...entry,
        }));
        
        setEntries(newRows.length > 0 ? newRows : initialEntries);
        toast({ title: 'Form Populated', description: 'The form has been filled with the extracted data.' });
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="text-sm font-bold">🍎 F.Co</div>
                    <div className="text-center flex-1">
                        <h2 className="text-2xl font-bold">F.Co - FIRDOUS AHMAD & COMPANY</h2>
                        <p className="text-sm text-muted-foreground">Goods Receipt</p>
                    </div>
                    <div className="text-sm font-bold">🍎 F.Co</div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Wand2 className="text-primary"/> AI-Powered Receipt Entry</CardTitle>
                        <CardDescription>Upload a photo of a handwritten receipt or use your camera to automatically fill the form.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!isApiKeySet ? (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Gemini API Key Not Set</AlertTitle>
                                <AlertDescription>
                                    To use the AI extraction feature, please set your Google Gemini API key. You can get a free key from Google AI Studio.
                                </AlertDescription>
                                <div className="flex items-center gap-2 mt-4">
                                    <Input
                                        type="password"
                                        placeholder="Paste your API Key here"
                                        value={tempApiKey}
                                        onChange={(e) => setTempApiKey(e.target.value)}
                                    />
                                    <Button onClick={() => {
                                        setApiKey(tempApiKey);
                                        toast({ title: "API Key Saved", description: "Your Gemini API key has been saved in your browser." });
                                    }}>
                                        Save Key
                                    </Button>
                                    <Button variant="link" asChild>
                                        <a href="https://aistudio.google.com/keys" target="_blank" rel="noopener noreferrer">Get a Key <ExternalLink className="h-3 w-3 ml-1"/></a>
                                    </Button>
                                </div>
                            </Alert>
                        ) : (
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
                                    <Button onClick={() => fileInputRef.current?.click()} className="w-full gap-2"><Upload className="h-4 w-4" /> Upload Photo</Button>
                                    <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full gap-2"><Camera className="h-4 w-4" /> Use Camera</Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-3xl">
                                            <DialogHeader><DialogTitle>Capture Receipt Photo</DialogTitle></DialogHeader>
                                            {hasCameraPermission === false ? (
                                                 <Alert variant="destructive"><AlertTitle>Camera Access Denied</AlertTitle><AlertDescription>Please enable camera permissions in your browser settings.</AlertDescription></Alert>
                                            ) : capturedImage ? (
                                                 <>
                                                    <Image src={capturedImage} alt="Captured Receipt" width={640} height={480} className="rounded-md w-full" />
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => setCapturedImage(null)}>Retake</Button>
                                                        <Button onClick={handleUseCapturedPhoto}>Use this Photo</Button>
                                                    </DialogFooter>
                                                 </>
                                            ) : (
                                                <>
                                                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay playsInline muted />
                                                    <DialogFooter><Button onClick={handleTakePhoto}>Take Photo</Button></DialogFooter>
                                                </>
                                            )}
                                            <canvas ref={canvasRef} className="hidden"></canvas>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                {imagePreview && (
                                    <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                        <Image src={imagePreview} alt="Receipt Preview" layout="fill" objectFit="contain" />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <Button onClick={handleExtract} disabled={!imagePreview || isExtracting} className="w-full gap-2">
                                    {isExtracting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4" />}
                                    {isExtracting ? 'Analyzing...' : 'Extract Data with AI'}
                                </Button>
                                {extractedData && (
                                    <Alert>
                                        <AlertTitle className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Extraction Complete</AlertTitle>
                                        <AlertDescription>
                                            <p>Successfully extracted data for Receipt #{extractedData.no}.</p>
                                        </AlertDescription>
                                        <Button onClick={applyExtractedData} className="w-full mt-4">Apply to Form</Button>
                                    </Alert>
                                )}
                            </div>
                        </div>
                        )}
                    </CardContent>
                </Card>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>No.</Label>
                        <div className="flex items-center gap-2">
                        <Input value={receiptDetails.no} onChange={e => handleDetailChange('no', e.target.value)} disabled={isEditing} />
                         {isEditing && (
                            <Button variant="outline" size="icon" onClick={resetForm} title="Create a new receipt">
                                <FilePlus className="h-4 w-4" />
                            </Button>
                        )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Dated</Label>
                        <Input type="date" value={receiptDetails.date} onChange={e => handleDetailChange('date', e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label>M/s</Label>
                        <Input placeholder="Customer Name" value={receiptDetails.customerName} onChange={e => handleDetailChange('customerName', e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2">
                        <Label>R/o</Label>
                        <Input placeholder="Residence of" value={receiptDetails.ro} onChange={e => handleDetailChange('ro', e.target.value)} />
                    </div>
                </div>
                
                <Separator />

                <div className="space-y-4">
                <div className="space-y-2">
                    <div className="hidden md:grid grid-cols-6 items-center gap-2 text-sm text-muted-foreground">
                        <Label className="md:col-span-2">KHATA</Label>
                        <Label className="md:col-span-1">KIND</Label>
                        <Label className="md:col-span-1">PETI</Label>
                        <Label className="md:col-span-1">DABA</Label>
                        <Label className="md:col-span-1">FREIGHT</Label>
                    </div>
                    {entries.map((entry, index) => (
                    <ReceiptEntryRow
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <Label>Freight Paid Rs:</Label>
                            <Input className="text-right" type="number" value={receiptDetails.freightPaid || ''} onChange={(e) => handleDetailChange('freightPaid', Number(e.target.value))} />
                        </div>
                        <div className="flex items-center gap-4">
                            <Label>Wattak Ready On:</Label>
                            <Input value={receiptDetails.wattakReadyOn} onChange={(e) => handleDetailChange('wattakReadyOn', e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2 text-sm text-right">
                        <div className="flex justify-end gap-4 items-center">
                            <span className="font-medium">Total Nugs:</span>
                            <span className="font-bold text-lg">{totalNugs}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
                <Button onClick={handleSaveReceipt} className="w-full max-w-xs">{isEditing ? 'Update Receipt' : 'Save Receipt'}</Button>
                <Button onClick={handleViewReceipt} variant="secondary" className="w-full max-w-xs gap-2" disabled={!isEditing}>
                    <FileText className="h-4 w-4" /> View Receipt
                </Button>
            </CardFooter>
        </Card>
        <Card className="md:col-span-1 h-fit">
            <CardHeader>
                <h3 className="text-lg font-medium">Recent Receipts</h3>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <div className="space-y-2">
                        {savedReceipts.map(receipt => (
                            <div key={receipt.no} className="flex justify-between items-center p-2 border rounded-md">
                                <div>
                                    <p className="font-medium">Receipt #{receipt.no}</p>
                                    <p className="text-sm text-muted-foreground">{receipt.customerName}</p>
                                    <p className="text-sm text-muted-foreground">{new Date(receipt.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center">
                                    <Button variant="ghost" size="icon" onClick={() => loadReceiptForEdit(receipt)}>
                                        <FilePenLine className="h-4 w-4" />
                                    </Button>
                                    {userRole === 'admin' && (
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteReceipt(receipt.no)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                         {savedReceipts.length === 0 && <p className="text-sm text-muted-foreground text-center">No recent receipts found.</p>}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
}
