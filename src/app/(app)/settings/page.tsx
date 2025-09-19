
'use client'

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Paintbrush, Palette, CheckCircle, Upload, Type, Move, QrCode, SlidersHorizontal, List, Truck, User, Phone, Box, TreePine, Banknote, Percent, Package, Pencil, Building, Snowflake, Weight, Signature, Lock, MessageSquare, Hash, FileText, DownloadCloud } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CompanyInfoForm } from "@/components/profile-form";
import { Factory, BellRing, CloudUpload } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as XLSX from 'xlsx';


const InvoicePreview = ({ title, colors, logoPosition, qrPosition, font, footer, features, children }: {
    title: string,
    colors: string,
    logoPosition: string,
    qrPosition: string,
    font: string,
    footer: string,
    features?: string[],
    children: React.ReactNode,
}) => (
    <Card className="w-full h-full flex flex-col">
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{children}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
            <div className={`relative w-full h-48 rounded-md border-2 border-dashed p-2 flex flex-col ${colors}`}>
                <div className={`absolute ${logoPosition}`}>🍎</div>
                <div className={`absolute ${qrPosition}`}>🔲</div>
                <div className={`flex-grow flex items-center justify-center text-xs ${font}`}>
                    <p>...bill content...</p>
                </div>
                <div className="text-center text-[8px] p-1 bg-black/10 rounded-b-md">{footer}</div>
            </div>
        </CardContent>
        <CardFooter className="flex-wrap gap-2">
            {features?.map(f => <Badge key={f} variant="secondary">{f}</Badge>)}
        </CardFooter>
    </Card>
);

const CustomFieldSuggestion = ({ icon, title, example, children } : { icon: React.ElementType, title: string, example: string, children: React.ReactNode }) => (
    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="p-2 bg-primary/10 rounded-md">
            <icon className="h-5 w-5 text-primary" />
        </div>
        <div>
            <h4 className="font-semibold">{title}</h4>
            <p className="text-sm text-muted-foreground">{children}</p>
            <p className="text-xs font-mono bg-muted px-2 py-1 rounded-md mt-1 inline-block">e.g., {example}</p>
        </div>
    </div>
);


export default function SettingsPage() {
    const { toast } = useToast();
    const [isSyncing, setIsSyncing] = React.useState(false);
    
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
            };
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;

                // Special case for activity log which doesn't have a prefix
                if (key === 'activityLogs') {
                    allData['Activity_Log'] = JSON.parse(localStorage.getItem(key)!);
                    continue;
                }

                const matchingPrefix = Object.keys(keyPrefixToSheetMap).find(prefix => key.startsWith(prefix));
                if (matchingPrefix) {
                    const sheetName = keyPrefixToSheetMap[matchingPrefix];
                    allData[sheetName].push(JSON.parse(localStorage.getItem(key)!));
                }
            }

            const wb = XLSX.utils.book_new();

            for (const sheetName in allData) {
                if (allData[sheetName].length > 0) {
                    // Flatten nested objects like 'totals' and 'entries' for better readability
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

            XLSX.writeFile(wb, `SwiftSale-Backup-${new Date().toISOString().split('T')[0]}.xlsx`);

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

    const ColorPill = ({ gradient, name }: { gradient: string, name: string}) => (
        <div className="flex items-center gap-2">
            <div className={`w-10 h-6 rounded-full ${gradient}`}></div>
            <span className="font-medium">{name}</span>
        </div>
    );
    
    return (
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Paintbrush className="h-6 w-6" /> Appearance &amp; Customization</CardTitle>
                    <CardDescription>This section will allow you to change invoice styles, colors, fonts, and layouts for all your documents (Bills, Wataks, Challans, Receipts).</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="multiple" defaultValue={['styles', 'fields']} className="w-full">
                        <AccordionItem value="styles">
                            <AccordionTrigger className="text-lg font-semibold">Invoice & Bill Styles</AccordionTrigger>
                            <AccordionContent>
                                <Tabs defaultValue="classic" className="w-full mt-2">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="classic">Classic Style</TabsTrigger>
                                        <TabsTrigger value="modern">Modern Style</TabsTrigger>
                                        <TabsTrigger value="urdu">Urdu-English Mix</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="classic" className="mt-4">
                                        <InvoicePreview title="Classic Style (Professional + Clean)" colors="bg-white text-black" logoPosition="top-2 left-1/2 -translate-x-1/2" qrPosition="top-2 right-2" font="font-serif" footer="Thank you for your business – F.Co" features={["Professional & Clean", "Red Headers", "Traditional Look"]}>
                                            Looks like a traditional Sopore Mandi bill. Ideal for formal record-keeping.
                                        </InvoicePreview>
                                    </TabsContent>
                                    <TabsContent value="modern" className="mt-4">
                                        <InvoicePreview title="Modern Style (Textured + Stylish)" colors="bg-gradient-to-br from-red-500 to-green-500 text-white" logoPosition="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 text-5xl" qrPosition="bottom-10 right-2" font="font-sans" footer="Your Satisfaction is Our Success – Subject to Sopore Jurisdiction Only" features={["Textured & Stylish", "Icons for items", "Great for Sharing"]}>
                                            Stylish and modern, perfect for sharing on WhatsApp or email. Uses gradients and icons for a fresh look.
                                        </InvoicePreview>
                                    </TabsContent>
                                    <TabsContent value="urdu" className="mt-4">
                                        <InvoicePreview title="Urdu-English Mix (Dual Language Print)" colors="bg-amber-50 text-black border-green-700" logoPosition="top-2 left-2" qrPosition="top-2 right-2" font="font-urdu" footer="F.Co – Fruit Merchant & Commission Agent | Sopore Mandi" features={["Bilingual Fields", "Nastaliq Font", "Beige Paper Look"]}>
                                            A bilingual design perfect for both English and Urdu-speaking customers, with elegant Nastaliq font for headings.
                                        </InvoicePreview>
                                    </TabsContent>
                                </Tabs>
                            </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="branding">
                             <AccordionTrigger className="text-lg font-semibold">Color Theme & Branding</AccordionTrigger>
                             <AccordionContent className="pt-4 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Color Gradients</h3>
                                        <p className="text-sm text-muted-foreground mb-4">Each document type gets a unique theme so you can instantly recognize it.</p>
                                        <div className="space-y-3">
                                            <ColorPill gradient="bg-gradient-to-r from-red-500 to-green-500" name="Bills" />
                                            <ColorPill gradient="bg-gradient-to-r from-blue-500 to-purple-500" name="Wataks" />
                                            <ColorPill gradient="bg-gradient-to-r from-orange-500 to-yellow-500" name="Challans" />
                                            <ColorPill gradient="bg-gradient-to-r from-gray-600 to-gray-400" name="Receipts" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Company Logo</h3>
                                            <p className="text-sm text-muted-foreground mb-2">Upload your company logo. Appears on bills and headers.</p>
                                            <Input type="file" />
                                        </div>
                                         <div>
                                            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Type className="h-5 w-5 text-primary" /> Font Style</h3>
                                            <p className="text-sm text-muted-foreground mb-2">Select the font style for your documents.</p>
                                            <Select defaultValue="sans">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="sans">Sans-serif (Modern)</SelectItem>
                                                    <SelectItem value="serif">Serif (Classic)</SelectItem>
                                                    <SelectItem value="urdu">Urdu-English Mix</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                             </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="fields">
                            <AccordionTrigger className="text-lg font-semibold">Header, Footer &amp; Custom Fields</AccordionTrigger>
                            <AccordionContent className="pt-4 space-y-6">
                                <div className="space-y-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="footerText">Footer Text</Label>
                                        <Textarea id="footerText" placeholder="e.g., Your Satisfaction is Our Success..." defaultValue="Your Satisfaction is Our Success – Subject to Sopore Jurisdiction Only" />
                                        <p className="text-xs text-muted-foreground">This text will appear at the bottom of your documents.</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Input type="checkbox" id="show-qr" defaultChecked />
                                        <Label htmlFor="show-qr" className="cursor-pointer">Show QR Code in Footer</Label>
                                    </div>
                                </div>
                                <Separator />
                                 <div>
                                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Pencil className="h-5 w-5 text-primary" /> Suggested Custom Fields</h3>
                                    <p className="text-sm text-muted-foreground mb-4">Every grower, customer, or truck has different details. These fields will appear automatically in print, PDF, or WhatsApp export.</p>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <CustomFieldSuggestion icon={Truck} title="Vehicle No." example="JK05X 1234">For tracking transport and logistics.</CustomFieldSuggestion>
                                        <CustomFieldSuggestion icon={User} title="Broker Name" example="Abdul Rashid Shah">To record the agent involved in a sale.</CustomFieldSuggestion>
                                        <CustomFieldSuggestion icon={User} title="Driver Name" example="Mohammad Yousuf">For challans and transport records.</CustomFieldSuggestion>
                                        <CustomFieldSuggestion icon={Phone} title="Contact No." example="+91 9797002164">Add a secondary contact number.</CustomFieldSuggestion>
                                        <CustomFieldSuggestion icon={Box} title="Load Type" example="Full Truck / Pickup">Specify the size of the consignment.</CustomFieldSuggestion>
                                        <CustomFieldSuggestion icon={TreePine} title="Grower's Village" example="Bomai, Sopore">For better tracking of produce origin.</CustomFieldSuggestion>
                                        <CustomFieldSuggestion icon={Banknote} title="Payment Mode" example="Cash / UPI / Credit">Record how a transaction was paid.</CustomFieldSuggestion>
                                        <CustomFieldSuggestion icon={Percent} title="Commission %" example="10%">Adjust commission for specific growers.</CustomFieldSuggestion>
                                        <CustomFieldSuggestion icon={Package} title="Packing Type" example="5 Layer Box">Detail the specific packaging used.</CustomFieldSuggestion>
                                        <CustomFieldSuggestion icon={Pencil} title="Delivery Remarks" example="Handle with care">Add special instructions for delivery.</CustomFieldSuggestion>
                                    </div>
                                 </div>
                                <Separator />
                                 <div>
                                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-primary" /> Extra Optional Custom Fields</h3>
                                    <p className="text-sm text-muted-foreground mb-4">Enable these for more advanced scenarios like GST billing, cold storage, or transport management. You can toggle them ON/OFF per template.</p>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <CustomFieldSuggestion icon={FileText} title="GST / Tax No." example="01ABCDE1234F1Z5">For customers outside J&K or for future compliance.</CustomFieldSuggestion>
                                        <CustomFieldSuggestion icon={Building} title="Consignee Name" example="To M/S XYZ Traders, Delhi">Party name at the destination market.</CustomFieldSuggestion>
                                        <CustomFieldSuggestion icon={Truck} title="Transport Agency" example="ABC Transport Pvt Ltd">The name of the transport company used.</CustomFieldSuggestion>
                                        <CustomFieldSuggestion icon={Lock} title="Seal/Invoice No." example="SEAL-5921">Transport company's unique seal or invoice number.</CustomFieldSuggestion>
                                        <CustomFieldSuggestion icon={Snowflake} title="Cold Store No." example="C-14, Chamber 5">Track produce stored in local cold storage facilities.</CustomFieldSuggestion>
                                        <CustomFieldSuggestion icon={Banknote} title="Loading/Unloading Charges" example="500.00">Option to show these charges separately on the bill.</CustomFieldSuggestion>
                                        <CustomFieldSuggestion icon={Weight} title="Weight Slip No." example="T-889-A">Reference number from mandi weighing slips (Taar/Net).</CustomFieldSuggestion>
                                        <CustomFieldSuggestion icon={MessageSquare} title="Payment Remarks" example="Advance ₹20,000 received">Add notes about advance payments or khata status.</CustomFieldSuggestion>
                                        <CustomFieldSuggestion icon={Signature} title="Digital Signature Space" example="Enable a blank space">Add space for digital or scanned signatures.</CustomFieldSuggestion>
                                        <CustomFieldSuggestion icon={Hash} title="UPI Payment Reference" example="UPI Ref: 4165...">Optional field to show UPI transaction ID on bills.</CustomFieldSuggestion>
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
                    <CardTitle>Data Portability & Backup</CardTitle>
                    <CardDescription>
                        Export all your application data into a single Excel file for backup or use in other applications.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Button onClick={handleBackupAllData} className="gap-2" disabled={isSyncing}>
                        <DownloadCloud className="h-4 w-4" />
                        Backup All Data to Excel
                    </Button>
                </CardContent>
                 <CardFooter>
                    <p className="text-xs text-muted-foreground">A restore feature will be added in a future update.</p>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>
                        Enable push notifications to receive real-time updates about your business.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleEnableNotifications} className="gap-2">
                        <BellRing className="h-4 w-4" />
                        Enable Notifications
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Factory Reset</CardTitle>
                    <CardDescription>
                        This will permanently delete all your data from this device's local storage. This action cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>
        </div>
    );
}
