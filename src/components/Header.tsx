
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ThemeSwitcher } from './theme-switcher';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { SidebarContent } from './Sidebar';


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
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <SidebarContent isMobile={true}/>
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        {/* The title can be managed via a context or prop if needed */}
      </div>
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
             <span className="sr-only">Logout</span>
        </Button>
      </div>
    </>
  );
}
