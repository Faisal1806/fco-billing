
'use client'

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Paintbrush, Palette, Upload, Rocket, Cog, DownloadCloud, Factory, BellRing, UploadCloud, FileDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyInfoForm } from "@/components/profile-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getClientMessaging } from '@/lib/firebase';
import { saveDocument, sendPushNotification } from '@/lib/actions';
import { getToken } from 'firebase/messaging';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import * as XLSX from 'xlsx';
import { Label } from '@/components/ui/label';

const InvoicePreview = ({ title, colors, children }: {
    title: string,
    colors: string,
    children: React.ReactNode,
}) => (
    <Card className="w-full h-full flex flex-col">
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{children}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
            <div className={`relative w-full h-48 rounded-md border-2 border-dashed p-2 flex flex-col ${colors}`}>
                 <div className="text-center font-bold text-lg">INVOICE</div>
                 <div className="flex-grow flex items-center justify-center text-xs">
                    <p>...content...</p>
                </div>
                <div className="text-center text-[8px] p-1 bg-black/10 rounded-b-md">Footer Text</div>
            </div>
        </CardContent>
    </Card>
);


export default function SettingsPage() {
    const { toast } = useToast();
    const [invoiceStyle, setInvoiceStyle] = React.useState('classic');
    const [fcmTokens, setFcmTokens] = React.useState<string[]>([]);
     const [isSending, setIsSending] = React.useState(false);
     const [isUploading, setIsUploading] = React.useState(false);

    React.useEffect(() => {
        const savedStyle = localStorage.getItem('invoiceStyle');
        if (savedStyle) {
            setInvoiceStyle(savedStyle);
        }
        
        const fetchTokens = async () => {
            const tokensRaw = localStorage.getItem('fcm-tokens');
            if (tokensRaw) {
                try {
                    const tokensData = JSON.parse(tokensRaw);
                     if (Array.isArray(tokensData)) {
                        setFcmTokens(tokensData.map(t => t.token));
                    }
                } catch {}
            }
        };
        fetchTokens();
    }, []);

    const handleStyleChange = (style: string) => {
        setInvoiceStyle(style);
        localStorage.setItem('invoiceStyle', style);
        toast({
            title: "Style Updated",
            description: `Invoice style set to ${style}.`,
        })
    };
    
    const handleFactoryReset = () => {
        try {
            const adminRole = localStorage.getItem('userRole');
            localStorage.clear();
            if (adminRole) {
                localStorage.setItem('userRole', adminRole);
            }
            toast({
                title: "Factory Reset Successful",
                description: "All application data has been cleared.",
            })
            // A short delay before reload can help ensure the toast is visible
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Factory Reset Failed",
                description: "Could not clear application data.",
            })
        }
    }

    const handleBackupDataJson = () => {
        toast({ title: 'Generating Backup', description: 'Please wait...' });
        try {
            const backupData: { [key: string]: any } = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    try {
                        // Attempt to parse JSON, if it fails, store as string
                        backupData[key] = JSON.parse(localStorage.getItem(key)!);
                    } catch {
                        backupData[key] = localStorage.getItem(key)!;
                    }
                }
            }

            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `FCO-Backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast({ title: 'Backup Successful', description: 'Your data has been saved to a JSON file.' });
        } catch (error) {
            console.error("JSON Backup failed:", error);
            toast({ variant: 'destructive', title: 'Backup Failed', description: 'Could not generate JSON backup.' });
        }
    };
    
    const handleBackupDataExcel = () => {
        toast({ title: 'Generating Excel Backup', description: 'Please wait...' });
        try {
            const data: { [key: string]: any[] } = {
                'Invoices': [], 'Purchases': [], 'Receipts': [], 'Challans': [], 'Pesticide_Invoices': [],
                'Parties': [], 'Products': [], 'Advances': [], 'Cold_Storage': [], 'Bikris': [], 'Accessories': []
            };

            const keyMap: { [key: string]: string } = {
                'invoice-': 'Invoices', 'purchase-': 'Purchases', 'receipt-': 'Receipts', 'challan-': 'Challans',
                'pesticide-invoice-': 'Pesticide_Invoices', 'party-': 'Parties', 'product-': 'Products',
                'advance-': 'Advances', 'cs-': 'Cold_Storage', 'bikri-': 'Bikris', 'accessory-ledger-': 'Accessories'
            };

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    for (const prefix in keyMap) {
                        if (key.startsWith(prefix)) {
                            try {
                                data[keyMap[prefix]].push(JSON.parse(localStorage.getItem(key)!));
                            } catch {}
                            break;
                        }
                    }
                }
            }

            const wb = XLSX.utils.book_new();

            for (const sheetName in data) {
                if (data[sheetName].length > 0) {
                    // Flatten nested objects like 'totals' and 'entries'
                    const flatData = data[sheetName].map(item => {
                        const flatItem: {[key:string]: any} = {};
                        for (const prop in item) {
                            if (typeof item[prop] === 'object' && item[prop] !== null) {
                                if (Array.isArray(item[prop])) {
                                    flatItem[prop] = JSON.stringify(item[prop]);
                                } else {
                                    for (const subProp in item[prop]) {
                                        flatItem[`${prop}.${subProp}`] = item[prop][subProp];
                                    }
                                }
                            } else {
                                flatItem[prop] = item[prop];
                            }
                        }
                        return flatItem;
                    });
                    const ws = XLSX.utils.json_to_sheet(flatData);
                    XLSX.utils.book_append_sheet(wb, ws, sheetName);
                }
            }

            XLSX.writeFile(wb, `FCO-Excel-Backup-${new Date().toISOString().split('T')[0]}.xlsx`);

            toast({ title: 'Excel Backup Successful', description: 'Your data has been saved to an Excel file.' });

        } catch (error) {
            console.error("Excel Backup failed:", error);
            toast({ variant: 'destructive', title: 'Excel Backup Failed', description: 'Could not generate Excel file.' });
        }
    };


    const handleImportDataJson = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonString = e.target?.result as string;
                const backupData = JSON.parse(jsonString);

                if (typeof backupData !== 'object' || backupData === null) {
                    throw new Error("Invalid backup file format.");
                }
                
                const adminRole = localStorage.getItem('userRole');
                localStorage.clear();
                if (adminRole) {
                    localStorage.setItem('userRole', adminRole);
                }

                for (const key in backupData) {
                    if (Object.prototype.hasOwnProperty.call(backupData, key)) {
                         const value = typeof backupData[key] === 'object' 
                            ? JSON.stringify(backupData[key]) 
                            : backupData[key];
                        localStorage.setItem(key, value);
                    }
                }

                toast({ title: "Import Successful", description: "All data has been restored. The app will now reload." });
                setTimeout(() => window.location.reload(), 2000);

            } catch (error) {
                console.error("JSON Import failed:", error);
                toast({ variant: 'destructive', title: 'Import Failed', description: 'The backup file seems to be corrupted or invalid.' });
            }
        };
        reader.readAsText(file);
    };


    const handleEnableNotifications = async () => {
        const messaging = getClientMessaging();
        if (!messaging) {
            toast({
                variant: 'destructive',
                title: 'Unsupported Browser',
                description: 'Push notifications are not supported on this browser or environment.',
            });
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const fcmToken = await getToken(messaging);
                
                if (fcmToken) {
                    await saveDocument('fcm-tokens', fcmToken, { token: fcmToken, enabledAt: new Date().toISOString() });
                    // Also save to local state for immediate use
                     if (!fcmTokens.includes(fcmToken)) {
                        setFcmTokens([...fcmTokens, fcmToken]);
                    }
                    toast({
                        title: 'Notifications Enabled',
                        description: 'You will now receive push notifications on this device.',
                    });
                } else {
                     toast({ variant: 'destructive', title: 'Token Error', description: 'Could not get notification token. Is your service worker set up?' });
                }
            } else {
                 toast({ variant: 'destructive', title: 'Permission Denied', description: 'Please enable notifications in your browser settings.' });
            }
        } catch (error) {
            console.error('Error getting FCM token:', error);
            toast({ variant: 'destructive', title: 'Notification Error', description: `An error occurred: ${(error as Error).message}` });
        }
    };

    const handleSendTestNotification = async () => {
        setIsSending(true);
        if (fcmTokens.length === 0) {
            toast({ variant: 'destructive', title: 'No Tokens', description: 'No devices have enabled notifications yet. Enable them first.'});
            setIsSending(false);
            return;
        }
        try {
            await sendPushNotification({
                title: 'F.Co Test Notification',
                body: 'If you can see this, your notifications are working correctly!',
                tokens: fcmTokens,
                url: '/dashboard'
            });
            toast({ title: 'Test Sent', description: 'Check your device for a notification.'});
        } catch (error) {
             toast({ variant: 'destructive', title: 'Test Failed', description: 'Could not send test notification.'});
        } finally {
            setIsSending(false);
        }
    }
    
    const handleUploadToCloud = async () => {
        setIsUploading(true);
        toast({ title: "Starting Cloud Sync", description: "Uploading all local data to Firebase..." });

        const collectionMap: { [key: string]: string } = {
            'invoice-': 'bills', // The public invoices are in 'bills'
            'purchase-': 'purchases',
            'receipt-': 'receipts',
            'challan-': 'challans',
            'pesticide-invoice-': 'pesticide-invoices',
            'party-': 'parties',
            'product-': 'products',
            'advance-': 'advances',
            'cs-': 'cold-storage',
            'bikri-': 'bikris',
            'accessory-ledger-': 'accessory-ledger',
            'fcm-tokens-': 'fcm-tokens',
        };

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            for (const prefix in collectionMap) {
                if (key.startsWith(prefix)) {
                    const collectionName = collectionMap[prefix];
                    const docId = key.substring(prefix.length);
                    
                    try {
                        const data = JSON.parse(localStorage.getItem(key)!);
                        // Use the new saveDocument function
                        const result = await saveDocument(collectionName, data.id || docId, data);
                        if(result.success) {
                            successCount++;
                        } else {
                            errorCount++;
                        }
                    } catch (e) {
                        errorCount++;
                        console.error(`Failed to parse or upload item: ${key}`, e);
                    }
                    break; 
                }
            }
        }
        
        setIsUploading(false);
        if (errorCount > 0) {
            toast({
                variant: "destructive",
                title: "Sync Partially Failed",
                description: `${successCount} records synced, but ${errorCount} records failed. Check console for details.`,
            });
        } else {
            toast({
                title: "Cloud Sync Complete",
                description: `Successfully synced ${successCount} records to the cloud.`,
            });
        }
    };
    
    return (
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Rocket className="h-6 w-6 text-blue-500" /> Deploy to Web</CardTitle>
                    <CardDescription>Publish your application to a permanent URL on the web.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">Click the button below to start the deployment process. This will publish your app to a live, shareable URL. This is an alternative to using the command-line interface.</p>
                     <a href="https://apphosting.dev/onboarding/swiftsale-ewd7o/us-central1/main" target="_blank" rel="noopener noreferrer">
                        <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                            <Rocket className="h-4 w-4" /> Deploy to Firebase App Hosting
                        </Button>
                    </a>
                </CardContent>
                 <CardFooter>
                    <p className="text-xs text-muted-foreground">This will open a new tab to guide you through the final authentication and deployment steps.</p>
                 </CardFooter>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Paintbrush className="h-6 w-6" /> Appearance &amp; Customization</CardTitle>
                    <CardDescription>Customize the look and feel of your documents and application.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible defaultValue="styles" className="w-full">
                        <AccordionItem value="styles">
                            <AccordionTrigger className="text-lg font-semibold">Invoice & Bill Styles</AccordionTrigger>
                            <AccordionContent>
                                <Tabs value={invoiceStyle} onValueChange={handleStyleChange} className="w-full mt-2">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="classic">Classic</TabsTrigger>
                                        <TabsTrigger value="modern-dark">Modern Dark</TabsTrigger>
                                        <TabsTrigger value="modern-light">Modern Light</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="classic" className="mt-4">
                                        <InvoicePreview title="Classic Style" colors="bg-amber-50 text-black border-green-700">
                                            A traditional, clean look perfect for formal record-keeping.
                                        </InvoicePreview>
                                    </TabsContent>
                                    <TabsContent value="modern-dark" className="mt-4">
                                         <InvoicePreview title="Modern Dark Style" colors="bg-gray-800 text-white border-gray-600">
                                            A sleek, stylish dark-mode theme, great for digital sharing.
                                        </InvoicePreview>
                                    </TabsContent>
                                     <TabsContent value="modern-light" className="mt-4">
                                         <InvoicePreview title="Modern Light Style" colors="bg-gray-100 text-black border-gray-300">
                                            A clean and professional light-mode theme for a contemporary feel.
                                        </InvoicePreview>
                                    </TabsContent>
                                </Tabs>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="branding">
                             <AccordionTrigger className="text-lg font-semibold">Branding</AccordionTrigger>
                             <AccordionContent className="pt-4 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div className="space-y-4">
                                        <div>
                                            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> App Theme</h3>
                                            <p className="text-sm text-muted-foreground mb-4">Change the primary color scheme of the application.</p>
                                            <p className="text-sm text-muted-foreground">Theme switching is handled by the toggle in the sidebar.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Company Logo</h3>
                                            <p className="text-sm text-muted-foreground mb-2">Upload your company logo. Appears on bills and headers. (Coming Soon)</p>
                                            <Input type="file" disabled />
                                        </div>
                                    </div>
                                </div>
                             </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>

            <CompanyInfoForm />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Cog className="h-6 w-6" /> General Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="data">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="data">Data Sync &amp; Backup</TabsTrigger>
                            <TabsTrigger value="notifications">Notifications</TabsTrigger>
                            <TabsTrigger value="reset">Factory Reset</TabsTrigger>
                        </TabsList>
                        <TabsContent value="data" className="pt-6">
                             <h3 className="font-semibold text-lg mb-2">Data Portability & Backup</h3>
                            <p className="text-sm text-muted-foreground mb-4">Use the JSON option to transfer data between devices. Use the Excel option for archival records. The "Upload to Cloud" button manually syncs all local data to Firebase.</p>
                            <div className="flex flex-wrap gap-4">
                                 <Button onClick={handleUploadToCloud} className="gap-2 bg-green-600 hover:bg-green-700" disabled={isUploading}>
                                    <UploadCloud className="h-4 w-4" />
                                    {isUploading ? 'Syncing...' : 'Upload Local Data to Cloud'}
                                </Button>
                                <Button onClick={handleBackupDataJson} className="gap-2">
                                    <DownloadCloud className="h-4 w-4" />
                                    Download JSON Backup
                                </Button>
                                 <div className="flex items-center gap-2">
                                    <Label htmlFor="import-file-json" className="cursor-pointer">
                                        <Button asChild>
                                            <span className="gap-2"><UploadCloud className="h-4 w-4" /> Import from JSON</span>
                                        </Button>
                                    </Label>
                                    <Input id="import-file-json" type="file" className="hidden" accept=".json" onChange={handleImportDataJson}/>
                                </div>
                                <Button onClick={handleBackupDataExcel} variant="outline" className="gap-2">
                                    <FileDown className="h-4 w-4" />
                                    Backup to Excel
                                </Button>
                            </div>
                        </TabsContent>
                         <TabsContent value="notifications" className="pt-6">
                            <h3 className="font-semibold text-lg mb-2">Push Notifications</h3>
                            <p className="text-sm text-muted-foreground mb-4">Enable push notifications to receive real-time updates from the app, such as low stock alerts or new sale notifications.</p>
                            <div className="flex items-center gap-4">
                                <Button onClick={handleEnableNotifications} className="gap-2">
                                    <BellRing className="h-4 w-4" />
                                    Enable Notifications
                                </Button>
                                 <Button onClick={handleSendTestNotification} variant="secondary" className="gap-2" disabled={isSending}>
                                    <BellRing className="h-4 w-4" />
                                    {isSending ? 'Sending...' : 'Send Test Notification'}
                                </Button>
                            </div>
                        </TabsContent>
                        <TabsContent value="reset" className="pt-6">
                            <h3 className="font-semibold text-lg text-destructive mb-2">Factory Reset</h3>
                            <p className="text-sm text-muted-foreground mb-4">This will permanently delete all your data from this device's local storage. This action cannot be undone and should be used with extreme caution.</p>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="gap-2">
                                        <Factory className="h-4 w-4" />
                                        Perform Factory Reset
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete all your application data from your browser's local storage.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleFactoryReset}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

        </div>
    );
}
