
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
import { Factory } from 'lucide-react';


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
