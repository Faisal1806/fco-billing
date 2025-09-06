'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { toast } = useToast();

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('customerName');
        }
        toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
        router.push('/portal/login');
    };

  return (
    <div className="min-h-screen bg-muted/40">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
             <Link href="/portal/dashboard" className="flex items-center gap-2 font-semibold text-foreground">
              <Logo className="h-8 w-8" />
              <span className="">F.Co Customer Portal</span>
            </Link>
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4 justify-end">
                <ThemeSwitcher />
                <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
    </div>
  );
}
