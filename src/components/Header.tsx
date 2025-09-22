
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ThemeSwitcher } from './theme-switcher';

export default function Header() {
    const router = useRouter();
    const { toast } = useToast();

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('userRole');
        }
        toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
        router.push('/login');
    };

  return (
    <>
      <div className="w-full flex-1">
        {/* The title can be managed via a context or prop if needed */}
      </div>
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </>
  );
}
