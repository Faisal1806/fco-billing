
'use client'

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Paintbrush, Palette, CheckCircle, Upload, Type, Move, QrCode, SlidersHorizontal } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ProfileForm } from "@/components/profile-form";
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

    const handleSyncOldData = async () => {
        setIsSyncing(true);
        toast({
            title: "Syncing Local Data...",
            description: "Please do not close this window. This may take a moment."
        });

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            let collectionName = '';
            let docId = '';
            
            if (key.startsWith('invoice-')) { collectionName = 'invoices'; docId = key.replace('invoice-', ''); }
            else if (key.startsWith('purchase-')) { collectionName = 'purchases'; docId = key.replace('purchase-', ''); }
            else if (key.startsWith('receipt-')) { collectionName = 'receipts'; docId = key.replace('receipt-', ''); }
            else if (key.startsWith('challan-')) { collectionName = 'challans'; docId = key.replace('challan-', ''); }
            else if (key.startsWith('pesticide-invoice-')) { collectionName = 'pesticide-invoices'; docId = key.replace('pesticide-invoice-', ''); }
            else if (key.startsWith('product-')) { collectionName = 'products'; docId = key.replace('product-', ''); }
            else if (key.startsWith('accessory-ledger-')) { collectionName = 'accessory-ledgers'; docId = key.replace('accessory-ledger-', ''); }
            else if (key.startsWith('expense-')) { collectionName = 'expenses'; docId = key.replace('expense-', ''); }

            if (collectionName && docId) {
                try {
                    const data = JSON.parse(localStorage.getItem(key)!);
                    const result = await saveDocument(collectionName, docId, data);
                    if (result.success) {
                        successCount++;
                    } else {
                        errorCount++;
                        console.error(`Failed to sync item ${key} to ${collectionName}:`, result.error);
                    }
                } catch (e) {
                    console.error(`Failed to parse or sync item ${key}:`, e);
                    errorCount++;
                }
            }
        }
        
        setIsSyncing(false);
        if (errorCount > 0) {
             toast({
                variant: "destructive",
                title: "Sync Partially Failed",
                description: `${successCount} records synced, but ${errorCount} failed. Check console for details.`,
            });
        } else {
            toast({
                title: "Sync Complete!",
                description: `Successfully synced ${successCount} local records to the cloud.`,
            });
        }
    };


    const handleEnableNotifications = async () => {
        const messaging = getClientMessaging();
        if (!messaging) {
            toast({
                variant: 'destructive',
                title: 'Unsupported Browser',
                description: 'Push notifications are not supported on this browser.',
            });
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const fcmToken = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY_HERE' }); 
                
                if (fcmToken) {
                    await saveDocument('fcm-tokens', fcmToken, { token: fcmToken, enabledAt: new Date().toISOString() });
                    toast({
                        title: 'Notifications Enabled',
                        description: 'You will now receive push notifications.',
                    });
                } else {
                     toast({ variant: 'destructive', title: 'Token Error', description: 'Could not get notification token.' });
                }
            } else {
                 toast({ variant: 'destructive', title: 'Permission Denied', description: 'Please enable notifications in browser settings.' });
            }
        } catch (error) {
            console.error('Error getting FCM token:', error);
            toast({ variant: 'destructive', title: 'Notification Error', description: 'An error occurred.' });
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
                    <Tabs defaultValue="classic" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="classic">Classic Style</TabsTrigger>
                            <TabsTrigger value="modern">Modern Style</TabsTrigger>
                            <TabsTrigger value="urdu">Urdu-English Mix</TabsTrigger>
                        </TabsList>
                        <TabsContent value="classic" className="mt-4">
                             <InvoicePreview title="Classic Style" colors="bg-white text-black" logoPosition="top-2 left-1/2 -translate-x-1/2" qrPosition="top-2 right-2" font="font-serif" footer="Thank you for your business – F.Co" features={["Professional & Clean", "Red Headers", "Traditional Look"]}>
                                Professional, clean, and looks like a traditional Sopore Mandi bill. Ideal for formal record-keeping.
                            </InvoicePreview>
                        </TabsContent>
                        <TabsContent value="modern" className="mt-4">
                             <InvoicePreview title="Modern Style" colors="bg-gradient-to-br from-red-500 to-green-500 text-white" logoPosition="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 text-5xl" qrPosition="bottom-10 right-2" font="font-sans" footer="Your Satisfaction is Our Success – Subject to Sopore Jurisdiction Only" features={["Textured & Stylish", "Icons for items", "Great for Sharing"]}>
                                Stylish and modern, perfect for sharing on WhatsApp or email. Uses gradients and icons for a fresh look.
                            </InvoicePreview>
                        </TabsContent>
                         <TabsContent value="urdu" className="mt-4">
                             <InvoicePreview title="Urdu-English Mix" colors="bg-amber-50 text-black border-green-700" logoPosition="top-2 left-2" qrPosition="top-2 right-2" font="font-urdu" footer="F.Co – Fruit Merchant & Commission Agent | Sopore Mandi" features={["Bilingual Fields", "Nastaliq Font", "Beige Paper Look"]}>
                                A bilingual design perfect for both English and Urdu-speaking customers, with elegant Nastaliq font for headings.
                            </InvoicePreview>
                        </TabsContent>
                    </Tabs>

                    <Separator className="my-6" />

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
                        <div>
                            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-primary" /> Customization Options</h3>
                            <p className="text-sm text-muted-foreground mb-4">Fine-tune every aspect of the app and your documents.</p>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Switch between invoice styles anytime.</li>
                                <li className="flex items-center gap-2"><Type className="h-4 w-4 text-blue-500" /> Change fonts (Serif, Sans-Serif, Nastaliq).</li>
                                <li className="flex items-center gap-2"><Upload className="h-4 w-4 text-purple-500" /> Upload your own company logo.</li>
                                <li className="flex items-center gap-2"><Move className="h-4 w-4 text-orange-500" /> Adjust margins & spacing for print.</li>
                                <li className="flex items-center gap-2"><QrCode className="h-4 w-4 text-teal-500" /> Enable or disable QR codes on documents.</li>
                                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-red-500" /> Set custom headers and footers.</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <ProfileForm />

            <Card>
                <CardHeader>
                    <CardTitle>Cloud Data Sync</CardTitle>
                    <CardDescription>
                        First-time setup: Upload all data saved on this device to the cloud. Run this on each of your devices once to sync everything.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Button onClick={handleSyncOldData} className="gap-2" disabled={isSyncing}>
                        <CloudUpload className="h-4 w-4" />
                        {isSyncing ? "Syncing..." : "Sync Local Data to Cloud"}
                    </Button>
                </CardContent>
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
                        This will permanently delete all your data, including sales, products, and expenses. This action cannot be undone.
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
