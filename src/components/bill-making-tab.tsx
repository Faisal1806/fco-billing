
'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Separator } from './ui/separator';
import { Loader2, PlusCircle, Trash2, FilePenLine, FilePlus, Share, FileText, Camera, Wand2, Sparkles, Upload, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { saveDocument, deleteDocument, getDocuments } from '@/lib/actions';
import { extractWatakFromImage, WatakExtractOutput } from '@/ai/flows/extract-watak-flow';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { uploadFile } from '@/lib/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';


type Row = {
  type: 'Patti' | 'Dabba';
  qty: number;
  variety: string;
  rate: number;
};

const emptyRow: Row = { type: 'Patti', qty: 0, variety: '', rate: 0 };
const initialRows: Row[] = Array.from({ length: 5 }, () => ({ ...emptyRow }));


export function BillMakingTab() {
  const [sNo, setSNo] = useState('');
  const [ms, setMs] = useState('');                 // M/S (customer)
  const [khata, setKhata] = useState('');           // Khata Name
  const [watakNo, setWatakNo] = useState('');   // Watak No
  const [date, setDate] = useState('');
  const [freight, setFreight] = useState<number>(0);
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [isClient, setIsClient] = React.useState(false);


  // AI Extraction State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<WatakExtractOutput | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // App State
  const { toast } = useToast();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedBills, setSavedBills] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  


  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole'));
    }
    setIsClient(true);
  }, []);

  const fetchBills = async () => {
      setIsLoading(true);
      
      const { success, data, error } = await getDocuments('invoices');
      if(success && data) {
        setSavedBills(data.sort((a,b) => (Number(a.sNo) > Number(b.sNo)) ? -1 : 1));
      } else {
        toast({variant: 'destructive', title: 'Error fetching bills', description: error})
      }
      setIsLoading(false);
  };
  
  useEffect(() => {
    if (isClient) {
      fetchBills();
    }
  }, [isClient]);
  
  useEffect(() => {
    if(isCameraOpen){
        setCapturedImage(null); // Reset previous capture
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
            // Stop camera stream when component unmounts or dialog closes
            if(videoRef.current && videoRef.current.srcObject){
                 const stream = videoRef.current.srcObject as MediaStream;
                 stream.getTracks().forEach(track => track.stop());
            }
        }
    }
  }, [isCameraOpen]);


  // --- Calculations (ALL from your spec) ---
  const totals = useMemo(() => {
    const totalQty = rows.reduce((s, r) => s + (Number(r.qty) || 0), 0);
    const pattiQty = rows
      .filter(r => r.type === 'Patti')
      .reduce((s, r) => s + (Number(r.qty) || 0), 0);
    const dabbaQty = rows
      .filter(r => r.type === 'Dabba')
      .reduce((s, r) => s + (Number(r.qty) || 0), 0);

    const rowGross = rows.map(r => (Number(r.qty) || 0) * (Number(r.rate) || 0));
    const totalGrossSale = rowGross.reduce((s, v) => s + v, 0);

    // Expenses by formula
    const labour = totalQty * 3;
    const association = totalQty * 0.1;
    const security = totalQty * 0.9;
    const commission = Math.floor(totalGrossSale * 0.12);

    const totalExp = commission + labour + association + security + (Number(freight) || 0);
    const netSale = totalGrossSale - totalExp;

    return {
      pattiQty,
      dabbaQty,
      totalQty,
      totalGrossSale,
      commission,
      labour,
      association,
      security,
      totalExp,
      netSale,
      rowGross,
    };
  }, [rows, freight]);

  const updateRow = (i: number, patch: Partial<Row>) => {
    setRows(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], ...patch };
      return copy;
    });
  };

  const addRow = () => setRows(prev => [...prev, { ...emptyRow }]);
  const removeRow = (i: number) =>
    setRows(prev => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

    const resetForm = () => {
        setSNo('');
        setMs('');
        setKhata('');
        setWatakNo('');
        setDate('');
        setFreight(0);
        setRows(initialRows);
        setIsEditing(false);
        // also reset AI state
        setSelectedImage(null);
        setImagePreview(null);
        setExtractedData(null);
        setStorageError(null);
    };


  const saveBill = async () => {
     if (!sNo || !date || !ms) {
        toast({
            variant: 'destructive',
            title: 'Missing Details',
            description: 'Please fill in Bill No, Date, and Customer Name before saving.',
        });
        return;
    }

    setIsSubmitting(true);
    const billId = sNo;
    const billData = {
      id: billId,
      sNo,
      date,
      customerName: ms,
      khata,
      watakNo,
      freight: Number(freight) || 0,
      entries: rows.filter(r => r.qty > 0).map(r => ({...r, qty: Number(r.qty), rate: Number(r.rate), total: Number(r.qty) * Number(r.rate)})),
      totals: {
        pattiQty: totals.pattiQty,
        dabbaQty: totals.dabbaQty,
        totalQty: totals.totalQty,
        grossSale: Number(totals.totalGrossSale.toFixed(2)),
        commissionAmount: Number(totals.commission.toFixed(2)),
        labour: Number(totals.labour.toFixed(2)),
        association: Number(totals.association.toFixed(2)),
        security: Number(totals.security.toFixed(2)),
        totalExpenses: Number(totals.totalExp.toFixed(2)),
        netSale: Number(totals.netSale.toFixed(2)),
      },
    };
    
    try {
        const result = await saveDocument('invoices', billId, billData);

        if (result.success) {
            toast({
              title: isEditing ? 'Watak Updated & Synced' : 'Watak Saved & Synced',
              description: `The Watak has been successfully saved to the cloud.`,
            });
        } else {
            throw new Error(result.error);
        }

    } catch (error) {
        console.error("Error saving bill to cloud:", error);
        toast({
            variant: 'destructive',
            title: 'Cloud Sync Failed',
            description: (error as Error).message,
        });
    } finally {
        fetchBills(); // Re-fetch to update the list
        setIsEditing(true); // Ensure form stays in editing mode for the current bill
        setIsSubmitting(false);
    }
  };

  const loadBillForEdit = (bill: any) => {
    resetForm(); // Clear everything first
    setSNo(bill.sNo);
    setMs(bill.customerName);
    setKhata(bill.khata || '');
    setWatakNo(bill.watakNo || '');
    setDate(bill.date);
    setFreight(bill.freight || 0);
    const loadedRows = bill.entries.map((e: any) => ({
      type: e.type || (e.peti ? 'Patti' : 'Dabba'),
      qty: e.qty || e.peti || e.daba,
      variety: e.variety,
      rate: e.rate
    }));
    setRows(loadedRows.length > 0 ? loadedRows : initialRows);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

    const handleDeleteBill = async (billId: string) => {
        if(userRole !== 'admin') {
            toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to delete bills."});
            return;
        }
        if(!window.confirm(`Are you sure you want to delete Watak #${billId}? This action cannot be undone.`)) {
            return;
        }

        try {
            await deleteDocument('invoices', billId);
            toast({
                title: "Watak Deleted",
                description: `Watak #${billId} has been successfully deleted from cloud storage.`
            });
        } catch (error) {
            console.error("Error deleting bill from cloud:", error);
            toast({
                variant: "destructive",
                title: "Cloud Delete Failed",
                description: (error as Error).message,
            })
        } finally {
            fetchBills(); // Re-fetch to update list
            if (sNo === billId) {
                resetForm();
            }
        }
    }

  const navigateToPrint = () => {
    if (!isEditing || !sNo) {
        toast({ variant: 'destructive', title: 'Cannot View', description: 'Please save the Watak first to generate a printable version.'});
        return;
    }
    router.push(`/invoice/${sNo}`);
  };

  const handleShare = () => {
    if (!isEditing || !sNo) {
      toast({ variant: 'destructive', title: 'Cannot Share', description: 'Please save the bill first.' });
      return;
    }
    const message = `Check out this Invoice (#${sNo}) for ${ms}: ${window.location.origin}/invoice/${sNo}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const handleFileSelect = (file: File | null) => {
      if(file){
        setSelectedImage(file);
        setStorageError(null);
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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // Compress image
      setCapturedImage(dataUrl);
    }
  };
  
  const handleUseCapturedPhoto = () => {
      if(capturedImage){
          // Convert data URL to File object to use with existing upload logic
          fetch(capturedImage)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], `watak-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                handleFileSelect(file);
                setIsCameraOpen(false); // Close camera dialog
            })
      }
  }


  const handleExtract = async () => {
        if (!selectedImage) {
            toast({ variant: 'destructive', title: 'No Image', description: 'Please upload an image first.' });
            return;
        }
        setIsExtracting(true);
        setExtractedData(null);
        setStorageError(null);
        try {
            const filePath = `watak-uploads/${Date.now()}-${selectedImage.name}`;
            const photoUrl = await uploadFile(selectedImage, filePath);
            const result = await extractWatakFromImage({ photoUrl });
            setExtractedData(result);
            toast({ title: 'Extraction Successful', description: 'Review the extracted data and apply it to the form.' });
        } catch (error: any) {
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('Service storage is not available')) {
                 setStorageError('Firebase Storage is not enabled or configured correctly for this project.');
            } else {
                 toast({ variant: 'destructive', title: 'AI Extraction Failed', description: errorMessage });
            }
            console.error(error);
        } finally {
            setIsExtracting(false);
        }
  };
  
  const applyExtractedData = () => {
        if (!extractedData) return;
        setSNo(extractedData.sNo);
        setDate(extractedData.date);
        setMs(extractedData.customerName);
        setWatakNo(extractedData.watakNo);
        setKhata(extractedData.khata || '');
        setFreight(extractedData.freight || 0);

        const newRows = extractedData.entries.map(entry => ({
            type: entry.type,
            qty: entry.qty,
            variety: entry.variety,
            rate: entry.rate,
        }));
        
        if (newRows.length < 5) {
             const emptyToAdd = 5 - newRows.length;
             for (let i = 0; i < emptyToAdd; i++) {
                 newRows.push({ ...emptyRow });
             }
        }
        setRows(newRows);
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
                        <p className="text-sm text-muted-foreground">Fruit Merchants & Commission Agents</p>
                        <p className="text-xs text-muted-foreground">SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.</p>
                        <p className="text-xs text-muted-foreground">Prop: Firdous Ahmad Lone (Nadihal) | Cell: 7006136330, 9797002164, 9906740921 | Email: lone07936@gmail.com</p>
                    </div>
                    <div className="text-sm font-bold">🍎 F.Co</div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Wand2 className="text-primary"/> AI-Powered Watak Entry</CardTitle>
                        <CardDescription>Upload a photo of a handwritten Watak or use your camera to automatically fill the form.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {storageError && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertTitle>Action Required: Enable Cloud Storage</AlertTitle>
                                <AlertDescription>
                                    <p className="mb-2">The AI feature needs Firebase Storage to analyze images, but it's not enabled yet. Please enable it to upload photos.</p>
                                    <ol className="list-decimal list-inside space-y-1 mt-2">
                                        <li>Click the button below to go to the Firebase Console.</li>
                                        <li>Click the **Get started** button.</li>
                                        <li>Follow the on-screen prompts to enable Storage (default settings are fine).</li>
                                        <li>Come back here and refresh the page.</li>
                                    </ol>
                                </AlertDescription>
                                <Button asChild variant="secondary" className="mt-4 w-full bg-white text-black hover:bg-white/90">
                                    <a href="https://console.firebase.google.com/project/swiftsale-ewd7o/storage" target="_blank" rel="noopener noreferrer" className="gap-2">
                                        <ExternalLink className="h-4 w-4" /> Enable Firebase Storage
                                    </a>
                                </Button>
                            </Alert>
                         )}
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        onChange={handleImageSelect}
                                        className="hidden"
                                    />
                                    <Button onClick={() => fileInputRef.current?.click()} className="w-full gap-2" disabled={!!storageError}>
                                        <Upload className="h-4 w-4" /> Upload Photo
                                    </Button>
                                    <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full gap-2" disabled={!!storageError}>
                                                <Camera className="h-4 w-4" /> Use Camera
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-3xl">
                                            <DialogHeader>
                                                <DialogTitle>Capture Watak Photo</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                {hasCameraPermission === false ? (
                                                     <Alert variant="destructive">
                                                        <AlertTitle>Camera Access Denied</AlertTitle>
                                                        <AlertDescription>Please enable camera permissions in your browser settings to use this feature.</AlertDescription>
                                                    </Alert>
                                                ) : capturedImage ? (
                                                     <>
                                                        <Image src={capturedImage} alt="Captured Watak" width={640} height={480} className="rounded-md w-full" />
                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => setCapturedImage(null)}>Retake</Button>
                                                            <Button onClick={handleUseCapturedPhoto}>Use this Photo</Button>
                                                        </DialogFooter>
                                                     </>
                                                ) : (
                                                    <>
                                                        <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay playsInline muted />
                                                        <DialogFooter>
                                                            <Button onClick={handleTakePhoto}>Take Photo</Button>
                                                        </DialogFooter>
                                                    </>
                                                )}
                                                <canvas ref={canvasRef} className="hidden"></canvas>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                {imagePreview && (
                                    <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                        <Image src={imagePreview} alt="Watak Preview" layout="fill" objectFit="contain" />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <Button onClick={handleExtract} disabled={!selectedImage || isExtracting || !!storageError} className="w-full gap-2">
                                    {isExtracting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4" />}
                                    {isExtracting ? 'Analyzing Image...' : 'Extract Data with AI'}
                                </Button>
                                {extractedData && (
                                    <Alert>
                                        <AlertTitle className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            Extraction Complete
                                        </AlertTitle>
                                        <AlertDescription>
                                            <p>Successfully extracted data for Watak #{extractedData.watakNo} for {extractedData.customerName}.</p>
                                            <p className="mt-2"><strong>{extractedData.entries.length} items</strong> found with a net sale of <strong>₹{extractedData.totals.netSale.toFixed(2)}</strong>.</p>
                                        </AlertDescription>
                                        <Button onClick={applyExtractedData} className="w-full mt-4">Apply to Form</Button>
                                    </Alert>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                 {/* Header fields */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 items-end">
                    <div className="md:col-span-2">
                        <Label>Bill No</Label>
                        <div className="flex items-center gap-2">
                            <Input value={sNo} onChange={e => setSNo(e.target.value)} disabled={isEditing} />
                             {isEditing && (
                                <Button variant="outline" size="icon" onClick={resetForm} title="Create a new bill">
                                    <FilePlus className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                     <div>
                        <Label>Date</Label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                        <Label>M/S (Customer)</Label>
                        <Input value={ms} onChange={e => setMs(e.target.value)} />
                    </div>
                    <div>
                        <Label>Khata</Label>
                        <Input value={khata} onChange={e => setKhata(e.target.value)} />
                    </div>
                    <div>
                        <Label>Watak No</Label>
                        <Input value={watakNo} onChange={e => setWatakNo(e.target.value)} />
                    </div>
                </div>

                <Separator />
                
                {/* Table */}
                <div>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Variety</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Rate</TableHead>
                            <TableHead className="text-right">Gross</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {rows.map((r, i) => (
                            <TableRow key={i}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell>
                                <Select value={r.type} onValueChange={(value: Row['type']) => updateRow(i, { type: value })}>
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Patti">Patti</SelectItem>
                                    <SelectItem value="Dabba">Dabba</SelectItem>
                                </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Input
                                placeholder="Variety (e.g., A2/5)"
                                value={r.variety}
                                onChange={e => updateRow(i, { variety: e.target.value })}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                type="number"
                                className="w-24 text-right"
                                value={r.qty || ''}
                                onChange={e => updateRow(i, { qty: Number(e.target.value) || 0 })}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                type="number"
                                className="w-24 text-right"
                                value={r.rate || ''}
                                onChange={e => updateRow(i, { rate: Number(e.target.value) || 0 })}
                                />
                            </TableCell>
                            <TableCell className="text-right">{(totals.rowGross[i] || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => removeRow(i)}>
                                    <Trash2 className="text-red-600 h-4 w-4" />
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={7}>
                                     <Button onClick={addRow} variant="outline" size="sm" className="mt-2">
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Add Row
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>

                 <Separator />

                {/* Totals & Expenses */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                    <div className="space-y-1">
                        <h3 className="font-bold mb-2">Quantity</h3>
                        <div>🧺 Total Patti: <b>{totals.pattiQty}</b></div>
                        <div>🍱 Total Dabba: <b>{totals.dabbaQty}</b></div>
                        <div className="font-bold">📦 Total Quantity: <b>{totals.totalQty}</b></div>
                    </div>

                    <div className="space-y-2">
                         <h3 className="font-bold mb-2">Expenses</h3>
                        <div>Labour (Qty×3): <b>{totals.labour.toFixed(2)}</b></div>
                        <div>Association (Qty×0.1): <b>{totals.association.toFixed(2)}</b></div>
                        <div>Security (Qty×0.9): <b>{totals.security.toFixed(2)}</b></div>
                        <div className="flex items-center gap-2">
                        <Label>Freight:</Label>
                        <Input
                            type="number"
                            className="w-28 text-right"
                            value={freight || ''}
                            onChange={e => setFreight(Number(e.target.value))}
                        />
                        </div>
                    </div>

                    <div className="space-y-1 bg-muted p-3 rounded-md">
                        <h3 className="font-bold mb-2">Financial Summary</h3>
                        <div>💰 Gross Sale: <b>{totals.totalGrossSale.toFixed(2)}</b></div>
                        <div>Commission (12%): <b>{totals.commission.toFixed(2)}</b></div>
                        <div className="font-bold">📉 Total Exp: <b>{totals.totalExp.toFixed(2)}</b></div>
                        <div className="text-lg font-bold mt-2 border-t pt-2">🔻 Net Sale: <b>{totals.netSale.toFixed(2)}</b></div>
                    </div>
                </div>

            </CardContent>
            <CardFooter>
                <div className="flex w-full justify-center flex-wrap gap-3">
                    <Button onClick={saveBill} className="flex-1 min-w-[150px]" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isEditing ? 'Update Watak' : 'Save Watak'}
                    </Button>
                    <Button onClick={navigateToPrint} variant="secondary" className="flex-1 min-w-[150px] gap-2" disabled={!isEditing}>
                       <FileText className="h-4 w-4" /> Print/View Invoice
                    </Button>
                     <Button onClick={handleShare} variant="outline" className="flex-1 min-w-[150px] gap-2" disabled={!isEditing}>
                       <Share className="h-4 w-4" /> Share
                    </Button>
                </div>
            </CardFooter>
        </Card>
        <Card className="md:col-span-1 h-fit">
            <CardHeader>
                <h3 className="text-lg font-medium">Recent Wataks</h3>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <div className="space-y-2">
                        {isLoading ? (
                             <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                             </div>
                        ) : savedBills.length > 0 ? (
                            savedBills.map(bill => (
                            <div key={bill.sNo} className="flex justify-between items-center p-2 border rounded-md">
                                <div>
                                    <p className="font-medium">Bill #{bill.sNo}</p>
                                    <p className="text-sm text-muted-foreground">{bill.customerName}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(bill.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center">
                                    <Button variant="ghost" size="icon" onClick={() => loadBillForEdit(bill)}>
                                        <FilePenLine className="h-4 w-4" />
                                    </Button>
                                    {userRole === 'admin' && (
                                     <Button variant="ghost" size="icon" onClick={() => handleDeleteBill(bill.sNo)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    )}
                                </div>
                            </div>
                            ))
                        ) : (
                           <p className="text-sm text-muted-foreground text-center p-4">No recent Wataks found.</p>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
}


