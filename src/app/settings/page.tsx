'use client'

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Paintbrush, Palette, Upload, Rocket, Cog, DownloadCloud, Factory, BellRing, UploadCloud, FileDown, Trash2, DatabaseZap, Cloud, ShieldCheck, Sun, Moon, Monitor, Pipette, Key, Lock, Bell } from 'lucide-react';
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
import { saveDocument, sendPushNotification, deleteDocument, getDocuments } from '@/lib/actions';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import * as XLSX from 'xlsx';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/PageHeader';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const InvoicePreview = ({ title, colors, children }: {
    title: string,
    colors: string,
    children: React.ReactNode,
}) => (
    <Card className="w-full h-full flex flex-col glass-panel">
        <CardHeader>
            <CardTitle className="text-sm font-bold">{title}</CardTitle>
            <CardDescription className="text-xs">{children}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
            <div className={`relative w-full h-32 rounded-lg border border-white/10 p-2 flex flex-col ${colors}`}>
                 <div className="text-center font-black text-[10px] tracking-widest">INVOICE</div>
                 <div className="flex-grow flex items-center justify-center text-[8px] opacity-50">
                    <p>F.CO DUMMY DATA</p>
                </div>
                <div className="text-center text-[6px] p-1 bg-black/10 rounded-b-lg">COMPUTER GENERATED</div>
            </div>
        </CardContent>
    </Card>
);

const MotionCard = motion(Card);

const accentColors = [
    { name: 'F.Co Emerald', value: '142 76% 45%', class: 'bg-[#22c55e]' },
    { name: 'Mandi Ruby', value: '0 84% 60%', class: 'bg-[#ef4444]' },
    { name: 'Sapphire Blue', value: '221 83% 53%', class: 'bg-[#3b82f6]' },
    { name: 'Amber Gold', value: '38 92% 50%', class: 'bg-[#f59e0b]' },
    { name: 'Royal Violet', value: '262 83% 58%', class: 'bg-[#8b5cf6]' },
];

export default function SettingsPage() {
    const handleRestoreJson = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];

  if (!file) return;

  try {
    const text = await file.text();

    const jsonData = JSON.parse(text);

    const response = await fetch("/api/restore-json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    });

    const result = await response.json();

    alert(result.message || "Backup restored successfully");
  } catch (error) {
    console.error(error);
    alert("Restore failed");
  }
};
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();
    const [invoiceStyle, setInvoiceStyle] = React.useState('classic');
    const [fcmTokens, setFcmTokens] = React.useState<any[]>([]);
    const [isSending, setIsSending] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [dailySummaryEnabled, setDailySummaryEnabled] = React.useState(true);
    const [activeAccent, setActiveAccent] = React.useState('142 76% 45%');

     const fetchTokens = async () => {
        const { success, data } = await getDocuments('fcm-tokens');
        if (success && data) {
            setFcmTokens(data);
        }
    };

    React.useEffect(() => {
        const savedStyle = localStorage.getItem('invoiceStyle');
        if (savedStyle) {
            setInvoiceStyle(savedStyle);
        }
        const savedAccent = localStorage.getItem('fco_accent_color');
        if (savedAccent) {
            setActiveAccent(savedAccent);
            document.documentElement.style.setProperty('--accent', savedAccent);
        }
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

    const handleAccentChange = (color: string) => {
        setActiveAccent(color);
        localStorage.setItem('fco_accent_color', color);
        document.documentElement.style.setProperty('--accent', color);
        toast({
            title: "Accent Color Updated",
            description: "System highlights have been synchronized.",
        });
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
            a.download = `FCo-Terminal-Backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast({ title: 'Backup Successful', description: 'Your database has been exported to JSON.' });
        } catch (error) {
            console.error("JSON Backup failed:", error);
            toast({ variant: 'destructive', title: 'Backup Failed', description: 'Could not generate backup.' });
        }
    };
    
    const handleBackupDataExcel = () => {
        toast({ title: 'Generating Excel Master-File', description: 'Please wait...' });
        try {
            const data: { [key: string]: any[] } = {
                'Invoices': [], 'Purchases': [], 'Receipts': [], 'Challans': [], 'Pesticide_Invoices': [],
                'Parties': [], 'Profiles': [], 'Advances': [], 'Cold_Storage': [], 'Bikris': [], 'Accessories': []
            };

            const keyMap: { [key: string]: string } = {
                'invoice-': 'Invoices', 'purchase-': 'Purchases', 'receipt-': 'Receipts', 'challan-': 'Challans',
                'pesticide-invoice-': 'Pesticide_Invoices', 'party-': 'Parties', 'product-': 'Profiles',
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

            XLSX.writeFile(wb, `FCo-Master-Ledger-${new Date().toISOString().split('T')[0]}.xlsx`);
            toast({ title: 'Excel Export Successful', description: 'Archival record created.' });

        } catch (error) {
            console.error("Excel Backup failed:", error);
            toast({ variant: 'destructive', title: 'Excel Export Failed', description: 'Could not generate archival file.' });
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

                toast({ title: "Import Successful", description: "Terminal database restored. Reloading..." });
                setTimeout(() => window.location.reload(), 2000);

            } catch (error) {
                console.error("JSON Import failed:", error);
                toast({ variant: 'destructive', title: 'Import Failed', description: 'The backup file seems to be corrupted or invalid.' });
            }
        };
        reader.readAsText(file);
    };


    const handleEnableNotifications = async () => {
        toast({
            variant: 'destructive',
            title: 'Unsupported Feature',
            description: 'Push notifications are disabled because Firebase has been removed.',
        });
    };

    const handleSendTestNotification = async () => {
        setIsSending(true);
        if (fcmTokens.length === 0) {
            toast({ variant: 'destructive', title: 'No Registered Nodes', description: 'Enable notifications on at least one device first.'});
            setIsSending(false);
            return;
        }
        try {
            await sendPushNotification({
                title: 'F.Co Terminal Signal',
                body: 'Push communication node verified and operational.',
                tokens: fcmTokens.map(t => t.token),
                url: '/dashboard'
            });
            toast({ title: 'Signal Dispatched', description: 'Test notification sent to all nodes.'});
        } catch (error) {
             toast({ variant: 'destructive', title: 'Transmission Failed', description: 'Could not send test signal.'});
        } finally {
            setIsSending(false);
        }
    }

    const handleDeleteToken = async (tokenId: string) => {
        try {
            await deleteDocument('fcm-tokens', tokenId);
            fetchTokens();
            toast({ title: 'Node Unregistered', description: 'The device has been disconnected from push services.'});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Removal Failed', description: 'Could not remove device node.'});
        }
    }
    
    const handleUploadToCloud = async () => {
        setIsUploading(true);
        setUploadProgress(0);
        toast({ title: "Master Sync Initiated", description: "Uploading terminal database to F.Co Cloud Infrastructure..." });
    
        const collectionMap: { [key: string]: string } = {
            'invoice-': 'bills',
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
            'manual-statement-': 'statements',
        };
    
        let successCount = 0;
        let errorCount = 0;
        const itemsToUpload = [];
    
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                 for (const prefix in collectionMap) {
                    if (key.startsWith(prefix)) {
                        itemsToUpload.push({ key, prefix });
                        break;
                    }
                }
            }
        }
        
        const totalItems = itemsToUpload.length;
        if (totalItems === 0) {
            toast({ title: "Database Empty", description: "No local records found to sync." });
            setIsUploading(false);
            return;
        }

        for (let i = 0; i < totalItems; i++) {
            const { key, prefix } = itemsToUpload[i];
            const collectionName = collectionMap[prefix];
            const docId = key.substring(prefix.length);
    
            try {
                const data = JSON.parse(localStorage.getItem(key)!);
                // saveDocument expects (collectionName, data)
                const payload = { ...data, id: data.id || docId };
                const result = await saveDocument(collectionName, payload);
                if (result.success) successCount++;
                else errorCount++;
            } catch (e) {
                errorCount++;
            }
            setUploadProgress(((i + 1) / totalItems) * 100);
        }
    
        setIsUploading(false);
        if (errorCount > 0) {
            toast({
                variant: "destructive",
                title: "Partial Sync Error",
                description: `${successCount} synced, ${errorCount} failed.`,
            });
        } else {
            toast({
                title: "Cloud Backup Complete",
                description: `Successfully backed up ${successCount} records to the cloud.`,
                isSuccess: true,
            });
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <PageHeader
                title="System Configuration"
                description="Manage your F.Co terminal node, cloud backups, and appearance settings."
                icon={<Cog className="h-8 w-8" />}
                imageUrl="/assets/3d/settings.png"
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Deployment Card */}
                <MotionCard 
                    whileHover={{ y: -5 }} 
                    className="glass-panel border-accent/20 bg-gradient-to-br from-accent/5 via-transparent to-transparent rounded-[2.5rem] overflow-hidden"
                >
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-black flex items-center gap-3">
                            <Rocket className="h-6 w-6 text-accent" /> DEPLOY TO INFRASTRUCTURE
                        </CardTitle>
                        <CardDescription className="text-sm font-semibold opacity-70">Push your terminal logic to a permanent, public cloud URL.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                        <p className="text-sm text-muted-foreground leading-relaxed">Publish your local terminal as a global web application accessible from any device. This enables multi-device access and persistent cloud hosting.</p>
                        <a href="https://apphosting.dev/onboarding/swiftsale-ewd7o/us-central1/main" target="_blank" rel="noopener noreferrer">
                            <Button className="w-full h-14 rounded-2xl gap-2 bg-accent text-black font-black tracking-widest hover:bg-accent/90 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                                <Rocket className="h-5 w-5" /> INITIALIZE CLOUD DEPLOYMENT
                            </Button>
                        </a>
                    </CardContent>
                </MotionCard>

                {/* Cloud Sync & Backup Card */}
                <MotionCard 
                    whileHover={{ y: -5 }} 
                    className="glass-panel border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent rounded-[2.5rem] overflow-hidden"
                >
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-black flex items-center gap-3">
                            <DatabaseZap className="h-6 w-6 text-blue-400" /> MASTER CLOUD SYNC
                        </CardTitle>
                        <CardDescription className="text-sm font-semibold opacity-70">Manual database synchronization and archival backups.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                        <div className="flex flex-col gap-4">
                            <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Cloud className="h-5 w-5 text-blue-400" />
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest">Database Backup</p>
                                        <p className="text-[10px] opacity-60">Push all local records to F.Co Cloud</p>
                                    </div>
                                </div>
                                <Button onClick={handleUploadToCloud} disabled={isUploading} className="bg-blue-500 hover:bg-blue-600 rounded-xl px-6 h-10 font-bold text-xs uppercase tracking-widest">
                                    {isUploading ? 'SYNCING...' : 'SYNC NOW'}
                                </Button>
                            </div>
                            
                            <AnimatePresence>
                                {isUploading && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest px-1">
                                            <span>Transferring Data...</span>
                                            <span>{Math.round(uploadProgress)}%</span>
                                        </div>
                                        <Progress value={uploadProgress} className="h-2 bg-blue-500/20" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid grid-cols-2 gap-4">
                                <Button onClick={handleBackupDataJson} variant="secondary" className="h-14 rounded-2xl font-bold text-xs uppercase tracking-widest gap-2 bg-white/5 border border-white/5 hover:bg-white/10">
                                    <DownloadCloud className="h-4 w-4" /> JSON BACKUP
                                </Button>
                                <Button onClick={handleBackupDataExcel} variant="secondary" className="h-14 rounded-2xl font-bold text-xs uppercase tracking-widest gap-2 bg-white/5 border border-white/5 hover:bg-white/10">
                                    <FileDown className="h-4 w-4" /> EXCEL ARCHIVE
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </MotionCard>

            </div>
<div className="mt-2">
  <input
    type="file"
    accept=".json"
    onChange={handleImportDataJson}
    className="hidden"
    id="restoreJson"
  />

  <label
    htmlFor="restoreJson"
    className="flex items-center justify-center w-full rounded-xl border border-green-500 py-3 text-green-400 cursor-pointer hover:bg-green-500/10"
  >
    Restore From JSON Backup
  </label>
</div>


            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Theme & Accent Customization */}
                <MotionCard className="glass-panel rounded-[2.5rem]">
                    <CardHeader className="p-8">
                        <CardTitle className="text-xl font-black flex items-center gap-3">
                            <Palette className="h-6 w-6 text-primary" /> THEME & ACCENT
                        </CardTitle>
                        <CardDescription className="text-sm font-semibold opacity-70">Customize the interface color and dark/light modes.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-10">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Interface Mode</Label>
                            <Tabs value={theme} onValueChange={setTheme} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 bg-white/5 h-14 rounded-2xl p-1">
                                    <TabsTrigger value="light" className="rounded-xl font-black text-[10px] tracking-widest uppercase gap-2">
                                        <Sun className="h-3 w-3" /> LIGHT
                                    </TabsTrigger>
                                    <TabsTrigger value="dark" className="rounded-xl font-black text-[10px] tracking-widest uppercase gap-2">
                                        <Moon className="h-3 w-3" /> DARK
                                    </TabsTrigger>
                                    <TabsTrigger value="system" className="rounded-xl font-black text-[10px] tracking-widest uppercase gap-2">
                                        <Monitor className="h-3 w-3" /> SYSTEM
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Signature Accent Color</Label>
                            <div className="flex flex-wrap gap-4">
                                {accentColors.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => handleAccentChange(color.value)}
                                        className={cn(
                                            "h-12 w-12 rounded-xl transition-all relative flex items-center justify-center border-2 border-transparent",
                                            color.class,
                                            activeAccent === color.value ? "scale-110 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "opacity-60 hover:opacity-100"
                                        )}
                                        title={color.name}
                                    >
                                        {activeAccent === color.value && <Pipette className="h-4 w-4 text-white" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </MotionCard>

                <CompanyInfoForm />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Visual Identity Styles */}
                <MotionCard className="glass-panel rounded-[2.5rem]">
                    <CardHeader className="p-8">
                        <CardTitle className="text-xl font-black flex items-center gap-3">
                            <Paintbrush className="h-6 w-6 text-primary" /> DOCUMENT IDENTITY
                        </CardTitle>
                        <CardDescription className="text-sm font-semibold opacity-70">Customize terminal output and invoice layouts.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                        <Tabs value={invoiceStyle} onValueChange={handleStyleChange} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-white/5 h-14 rounded-2xl p-1 mb-8">
                                <TabsTrigger value="classic" className="rounded-xl font-black text-[10px] tracking-widest uppercase">CLASSIC</TabsTrigger>
                                <TabsTrigger value="modern-dark" className="rounded-xl font-black text-[10px] tracking-widest uppercase">DARK UI</TabsTrigger>
                                <TabsTrigger value="modern-light" className="rounded-xl font-black text-[10px] tracking-widest uppercase">LIGHT UI</TabsTrigger>
                            </TabsList>
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={invoiceStyle}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {invoiceStyle === 'classic' && (
                                        <InvoicePreview title="TRADITIONAL MANDI LEDGER" colors="bg-amber-50 text-black border-green-700/30">
                                            High-fidelity print format mirroring classic manual bookkeeping records.
                                        </InvoicePreview>
                                    )}
                                    {invoiceStyle === 'modern-dark' && (
                                        <InvoicePreview title="CYBER TERMINAL DARK" colors="bg-gray-900 text-white border-white/10">
                                            Ultra-modern digital style optimized for sharing via WhatsApp and OLED screens.
                                        </InvoicePreview>
                                    )}
                                    {invoiceStyle === 'modern-light' && (
                                        <InvoicePreview title="PROFESSIONAL WHITE" colors="bg-white text-gray-900 border-gray-200">
                                            Clean, professional layout with high contrast for standard document printers.
                                        </InvoicePreview>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </Tabs>
                    </CardContent>
                </MotionCard>

                {/* Notifications & Push */}
                <MotionCard className="glass-panel rounded-[2.5rem]">
                    <CardHeader className="p-8">
                        <CardTitle className="text-xl font-black flex items-center gap-3">
                            <BellRing className="h-6 w-6 text-yellow-400" /> PUSH INFRASTRUCTURE
                        </CardTitle>
                        <CardDescription className="text-sm font-semibold opacity-70">Manage notifications and registered terminal nodes.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-8">
                        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                        <Bell className="h-4 w-4 text-accent" /> Daily Sales Summary
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-bold">Receive a push summary of total Mandi volume at 8:00 PM.</p>
                                </div>
                                <Switch checked={dailySummaryEnabled} onCheckedChange={setDailySummaryEnabled} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button onClick={handleEnableNotifications} className="h-14 rounded-2xl font-black text-xs tracking-widest gap-2">
                                <ShieldCheck className="h-4 w-4" /> ACTIVATE NODE
                            </Button>
                            <Button onClick={handleSendTestNotification} variant="secondary" className="h-14 rounded-2xl font-black text-xs tracking-widest gap-2 bg-white/5 hover:bg-white/10" disabled={isSending}>
                                {isSending ? 'TESTING...' : 'VERIFY SIGNAL'}
                            </Button>
                        </div>
                        
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Device Nodes</h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {fcmTokens.length > 0 ? fcmTokens.map((token: any) => (
                                    <div key={token.id} className="flex justify-between items-center bg-white/5 border border-white/5 p-3 rounded-xl">
                                        <p className="text-[9px] font-mono opacity-50 truncate pr-4">{token.id}</p>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteToken(token.id)} className="h-8 w-8 hover:bg-destructive/20 text-destructive">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                )) : <div className="text-center py-10 opacity-30 text-xs font-bold uppercase tracking-widest">No nodes registered</div>}
                            </div>
                        </div>
                    </CardContent>
                </MotionCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Security Section */}
                <MotionCard className="glass-panel border-accent/10 rounded-[2.5rem]">
                    <CardHeader className="p-8">
                        <CardTitle className="text-xl font-black flex items-center gap-3">
                            <Lock className="h-6 w-6 text-accent" /> SECURITY CREDENTIALS
                        </CardTitle>
                        <CardDescription className="text-sm font-semibold opacity-70">Update your terminal access key and encryption settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Master Security Key</Label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input type="password" placeholder="ENTER NEW KEY" className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 font-mono tracking-widest" />
                                </div>
                            </div>
                            <Button className="w-full h-14 rounded-2xl font-black tracking-widest uppercase bg-accent text-black hover:bg-accent/90">
                                UPDATE SECURITY NODE
                            </Button>
                        </div>
                    </CardContent>
                </MotionCard>

                {/* System Reset */}
                <MotionCard className="glass-panel border-destructive/20 rounded-[2.5rem]">
                    <CardHeader className="p-8">
                        <CardTitle className="text-xl font-black flex items-center gap-3 text-destructive">
                            <Factory className="h-6 w-6" /> FACTORY OVERRIDE
                        </CardTitle>
                        <CardDescription className="text-sm font-semibold opacity-70">Wipe entire local terminal database.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                        <p className="text-sm text-muted-foreground leading-relaxed">This action will permanently erase all local records, configuration settings, and themes. Use only when preparing a fresh terminal installation.</p>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full h-14 rounded-2xl font-black tracking-widest uppercase shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                    <Trash2 className="h-5 w-5 mr-2" /> EXECUTE MASTER WIPE
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="glass-panel rounded-[2rem] border-destructive/30">
                                <AlertDialogHeader>
                                <AlertDialogTitle className="text-2xl font-black tracking-tighter">CONFIRM DESTRUCTION</AlertDialogTitle>
                                <AlertDialogDescription className="font-medium text-muted-foreground">
                                    This will delete every single record stored on this device. This process cannot be reversed. Ensure you have a cloud backup.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-3">
                                <AlertDialogCancel className="rounded-xl font-bold border-white/10">CANCEL</AlertDialogCancel>
                                <AlertDialogAction onClick={handleFactoryReset} className="rounded-xl font-bold bg-destructive text-white">PROCEED WITH WIPE</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </MotionCard>
            </div>
        </div>
    );
}


