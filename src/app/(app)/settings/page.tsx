
'use client'

import * as React from 'react';
import { LanguageSwitcher } from "@/components/language-switcher";
import { ProfileForm } from "@/components/profile-form";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
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
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { Factory, BellRing, Palette, CloudUpload, Paintbrush, FileText, Settings2, PlusCircle, Trash2 } from 'lucide-react';
import { getClientMessaging } from '@/lib/firebase';
import { getToken } from 'firebase/messaging';
import { saveDocument } from '@/lib/actions';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';

type CustomField = {
    id: number;
    label: string;
    placeholder: string;
};

export default function SettingsPage() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [customFields, setCustomFields] = React.useState<CustomField[]>([
        { id: 1, label: 'Vehicle No.', placeholder: 'e.g., JK05X 1234' },
        { id: 2, label: 'Broker Name', placeholder: 'e.g., John Doe' }
    ]);

    const addCustomField = () => {
        setCustomFields(prev => [...prev, { id: Date.now(), label: '', placeholder: ''}]);
    };

    const removeCustomField = (id: number) => {
        setCustomFields(prev => prev.filter(field => field.id !== id));
    };


    const handleFactoryReset = () => {
        try {
            localStorage.clear();
            toast({
                title: "Factory Reset Successful",
                description: "All application data has been cleared.",
            })
            // Optional: reload the page to reflect changes
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
            
            if (key.startsWith('invoice-')) {
                collectionName = 'invoices';
                docId = key.replace('invoice-', '');
            } else if (key.startsWith('purchase-')) {
                collectionName = 'purchases';
                docId = key.replace('purchase-', '');
            } else if (key.startsWith('receipt-')) {
                collectionName = 'receipts';
                docId = key.replace('receipt-', '');
            } else if (key.startsWith('challan-')) {
                collectionName = 'challans';
                docId = key.replace('challan-', '');
            } else if (key.startsWith('pesticide-invoice-')) {
                collectionName = 'pesticide-invoices';
                docId = key.replace('pesticide-invoice-', '');
            } else if (key.startsWith('product-')) {
                collectionName = 'products';
                docId = key.replace('product-', '');
            } else if (key.startsWith('accessory-ledger-')) {
                collectionName = 'accessory-ledgers';
                docId = key.replace('accessory-ledger-', '');
            } else if (key.startsWith('expense-')) {
                collectionName = 'expenses';
                docId = key.replace('expense-', '');
            }


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
                description: `${successCount} records synced, but ${errorCount} failed. Check the console for details.`,
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
                // IMPORTANT: Replace 'YOUR_VAPID_KEY_HERE' with your actual VAPID key from your Firebase project settings
                const fcmToken = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY_HERE' }); 
                
                if (fcmToken) {
                    console.log('FCM Token:', fcmToken);
                    // TODO: Send this token to your server to store it for sending notifications
                    await saveDocument('fcm-tokens', fcmToken, { token: fcmToken, enabledAt: new Date().toISOString() });
                    toast({
                        title: 'Notifications Enabled',
                        description: 'You will now receive push notifications once setup is complete.',
                    });
                } else {
                     toast({
                        variant: 'destructive',
                        title: 'Token Error',
                        description: 'Could not get the notification token. Please try again.',
                    });
                }

            } else if (permission === 'denied') {
                 toast({
                    variant: 'destructive',
                    title: 'Permission Denied',
                    description: 'You have blocked notifications. Please enable them in your browser settings.',
                });
            } else {
                toast({
                    title: 'Permission Ignored',
                    description: 'Notification permission request was dismissed.',
                });
            }
        } catch (error) {
            console.error('Error getting FCM token:', error);
            toast({
                variant: 'destructive',
                title: 'Notification Error',
                description: 'An error occurred while enabling notifications.',
            });
        }
    };

    const ColorButton = ({ color }: { color: string }) => (
        <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            style={{ backgroundColor: color }}
        >
            <span className="sr-only">Set theme to {color}</span>
        </Button>
    )


    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t('language')}</CardTitle>
                    <CardDescription>
                        Choose the language for the application interface.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2">
                        <LanguageSwitcher />
                        <span className="text-sm text-muted-foreground">
                            {t('language') === 'Language' ? 'English' : 'اردو'}
                        </span>
                    </div>
                </CardContent>
            </Card>

            <ProfileForm />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Paintbrush className="h-5 w-5" /> Appearance &amp; Customization</CardTitle>
                    <CardDescription>
                        Change invoice styles, choose color themes, manage custom fields, and tailor the app to your brand.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="multiple" className="w-full space-y-4">
                        <AccordionItem value="item-1" className="border rounded-lg px-4">
                            <AccordionTrigger className="text-lg font-semibold"><FileText className="h-5 w-5 mr-3 text-primary" />Invoice & Bill Styles</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Invoice Template</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <Button variant="outline">Classic</Button>
                                        <Button variant="outline">Modern</Button>
                                        <Button variant="outline">Textured</Button>
                                        <Button variant="outline">Urdu/English</Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Select a pre-designed layout for your documents.</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch id="watermark-switch" />
                                    <Label htmlFor="watermark-switch">Add Faint Logo Watermark to Documents</Label>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                         <AccordionItem value="item-2" className="border rounded-lg px-4">
                            <AccordionTrigger className="text-lg font-semibold"><Palette className="h-5 w-5 mr-3 text-primary" />Color Theme & Branding</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Primary Accent Color</Label>
                                     <div className="flex items-center gap-2">
                                        <ColorButton color="#22c55e" /> {/* green */}
                                        <ColorButton color="#ef4444" /> {/* red */}
                                        <ColorButton color="#3b82f6" /> {/* blue */}
                                        <ColorButton color="#f97316" /> {/* orange */}
                                        <ColorButton color="#14b8a6" /> {/* teal */}
                                     </div>
                                    <p className="text-xs text-muted-foreground">Change the main color for buttons and highlights across the app.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Company Logo</Label>
                                    <Input type="file" />
                                    <p className="text-xs text-muted-foreground">Upload your company logo. Appears on bills and headers.</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                         <AccordionItem value="item-3" className="border rounded-lg px-4">
                            <AccordionTrigger className="text-lg font-semibold"><Settings2 className="h-5 w-5 mr-3 text-primary" />Header, Footer & Custom Fields</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Footer Text</Label>
                                    <Input defaultValue="Your Satisfaction is Our Success – Subject to Sopore Jurisdiction Only" />
                                    <p className="text-xs text-muted-foreground">This text will appear at the bottom of your documents.</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch id="qr-code-switch" checked />
                                    <Label htmlFor="qr-code-switch">Show QR Code in Footer</Label>
                                </div>
                                <div className="pt-4 mt-4 border-t">
                                     <h4 className="font-medium mb-2">Custom Document Fields</h4>
                                     <p className="text-xs text-muted-foreground mb-4">Add or remove custom text fields that will appear on your documents.</p>
                                     <div className="space-y-2">
                                        {customFields.map(field => (
                                            <div key={field.id} className="flex items-center gap-2">
                                                <Input defaultValue={field.label} placeholder="Field Label (e.g., Transport)" />
                                                <Input defaultValue={field.placeholder} placeholder="Placeholder Text (e.g., Transport Name)" />
                                                <Button variant="ghost" size="icon" onClick={() => removeCustomField(field.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                     </div>
                                      <Button variant="outline" size="sm" className="mt-2 gap-1" onClick={addCustomField}>
                                        <PlusCircle className="h-4 w-4" /> Add Field
                                     </Button>
                                 </div>
                            </AccordionContent>
                        </AccordionItem>

                    </Accordion>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Cloud Data Sync</CardTitle>
                    <CardDescription>
                        First-time setup: Upload all data saved on this device to the cloud. Run this on each of your devices (phone, laptop) once to sync everything.
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
    )
}
