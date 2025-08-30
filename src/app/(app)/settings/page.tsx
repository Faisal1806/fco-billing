'use client'

import { LanguageSwitcher } from "@/components/language-switcher";
import { ProfileForm } from "@/components/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";

export default function SettingsPage() {
    const { t } = useLanguage();

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
        </div>
    )
}
