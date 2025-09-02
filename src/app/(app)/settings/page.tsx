
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
import { Factory, BellRing, Palette } from 'lucide-react';
import { getClientMessaging } from '@/lib/firebase';
import { getToken } from 'firebase/messaging';


export default function SettingsPage() {
    const { t } = useLanguage();
    const { toast } = useToast();

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
                    <CardTitle>Appearance &amp; Customization</CardTitle>
                    <CardDescription>
                        Change invoice styles, choose header/footer layouts, and manage custom fields.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 text-muted-foreground">
                        <Palette className="h-6 w-6" />
                        <p>Advanced customization features are coming soon!</p>
                    </div>
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
