

'use client'

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Paintbrush, Palette, Upload, Rocket, Cog, DownloadCloud, Factory, BellRing } from 'lucide-react';
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
import { saveDocument } from '@/lib/actions';
import { getToken } from 'firebase/messaging';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import * as XLSX from 'xlsx';

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

    React.useEffect(() => {
        const savedStyle = localStorage.getItem('invoiceStyle');
        if (savedStyle) {
            setInvoiceStyle(savedStyle);
        }
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
            localStorage.clear();
            toast({
                title: "Factory Reset Successful",
                description: "All application data has been cleared.",
            })
            window.location.reload();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Factory Reset Failed",
                description: "Could not clear application data.",
            })
        }
    }

    const handleBackupAllData = () => {
        toast({ title: 'Generating Backup', description: 'Please wait while we gather all your data.' });

        try {
            const allData: { [key: string]: any[] } = {
                'Wataks (Invoices)': [],
                'Purchases': [],
                'Receipts': [],
                'Challans': [],
                'Pesticide_Invoices': [],
                'Products': [],
                'Accessory_Ledger': [],
                'Expenses': [],
                'Advances': [],
                'Cold_Storage': [],
                'Manual_Fertilizer_Rates': [],
                'Outside_Sales (Bikri)': [],
                'Activity_Log': [],
                'Parties': [],
            };

            const keyPrefixToSheetMap: { [key: string]: keyof typeof allData } = {
                'invoice-': 'Wataks (Invoices)',
                'purchase-': 'Purchases',
                'receipt-': 'Receipts',
                'challan-': 'Challans',
                'pesticide-invoice-': 'Pesticide_Invoices',
                'product-': 'Products',
                'accessory-ledger-': 'Accessory_Ledger',
                'expense-': 'Expenses',
                'advance-': 'Advances',
                'cs-': 'Cold_Storage',
                'manual-fertilizer-rates-': 'Manual_Fertilizer_Rates',
                'bikri-': 'Outside_Sales (Bikri)',
                'activityLogs': 'Activity_Log',
                'party-': 'Parties',
            };
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;

                if (key === 'activityLogs') {
                    const logs = localStorage.getItem(key);
                    if (logs) allData['Activity_Log'] = JSON.parse(logs);
                    continue;
                }

                const matchingPrefix = Object.keys(keyPrefixToSheetMap).find(prefix => key.startsWith(prefix));
                if (matchingPrefix) {
                    const sheetName = keyPrefixToSheetMap[matchingPrefix];
                    const item = localStorage.getItem(key);
                    if (item) allData[sheetName].push(JSON.parse(item));
                }
            }

            const wb = XLSX.utils.book_new();

            for (const sheetName in allData) {
                if (allData[sheetName].length > 0) {
                    const flattenedData = allData[sheetName].map((item: any) => {
                       const flatItem: {[key: string]: any} = {};
                       for(const prop in item){
                           if(typeof item[prop] === 'object' && item[prop] !== null && !Array.isArray(item[prop])){
                               for(const nestedProp in item[prop]){
                                   flatItem[`${prop}_${nestedProp}`] = item[prop][nestedProp];
                               }
                           } else if(Array.isArray(item[prop])){
                               flatItem[prop] = JSON.stringify(item[prop]);
                           } else {
                               flatItem[prop] = item[prop];
                           }
                       }
                       return flatItem;
                    });
                    const ws = XLSX.utils.json_to_sheet(flattenedData);
                    XLSX.utils.book_append_sheet(wb, ws, sheetName.replace(/_/g, ' '));
                }
            }

            if (wb.SheetNames.length === 0) {
                toast({ variant: 'destructive', title: 'No Data Found', description: 'There is no data to back up.' });
                return;
            }

            XLSX.writeFile(wb, `FCO-Backup-${new Date().toISOString().split('T')[0]}.xlsx`);

            toast({ title: 'Backup Successful', description: 'Your data has been exported to an Excel file.' });

        } catch (error) {
            console.error("Backup failed:", error);
            toast({ variant: 'destructive', title: 'Backup Failed', description: 'An unexpected error occurred during backup.' });
        }
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
                const fcmToken = await getToken(messaging, { vapidKey: 'BDrkE0XgA5wWlPz9sUeS_gZ4-N9xY6kIuX0eY3oD2hM0c4b1Z7n8R6J4k9sQ1xZ5m4w3j6p9yIuQ8c4jGkY' }); 
                
                if (fcmToken) {
                    await saveDocument('fcm-tokens', fcmToken, { token: fcmToken, enabledAt: new Date().toISOString() });
                    toast({
                        title: 'Notifications Enabled',
                        description: 'You will now receive push notifications.',
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
                            <TabsTrigger value="data">Data &amp; Backup</TabsTrigger>
                            <TabsTrigger value="notifications">Notifications</TabsTrigger>
                            <TabsTrigger value="reset">Factory Reset</TabsTrigger>
                        </TabsList>
                        <TabsContent value="data" className="pt-6">
                             <h3 className="font-semibold text-lg mb-2">Data Portability & Backup</h3>
                            <p className="text-sm text-muted-foreground mb-4">Export all your application data into a single Excel file for backup or use in other applications.</p>
                            <Button onClick={handleBackupAllData} className="gap-2">
                                <DownloadCloud className="h-4 w-4" />
                                Backup All Data to Excel
                            </Button>
                        </TabsContent>
                         <TabsContent value="notifications" className="pt-6">
                            <h3 className="font-semibold text-lg mb-2">Push Notifications</h3>
                            <p className="text-sm text-muted-foreground mb-4">Enable push notifications to receive real-time updates from the app, such as low stock alerts or large sale notifications.</p>
                            <Button onClick={handleEnableNotifications} className="gap-2">
                                <BellRing className="h-4 w-4" />
                                Enable Notifications
                            </Button>
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

