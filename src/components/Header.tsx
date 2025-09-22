
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ThemeSwitcher } from './theme-switcher';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import Link from 'next/link';
import { sidebarSections } from './Sidebar';


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
        <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
             <span className="sr-only">Logout</span>
        </Button>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {sidebarSections.map((section, index) => (
                    <React.Fragment key={section.title}>
                        {index > 0 && <DropdownMenuSeparator />}
                        <DropdownMenuLabel>{section.title}</DropdownMenuLabel>
                        <DropdownMenuGroup>
                            {section.items.map(item => (
                                <Link href={item.href} passHref key={item.name}>
                                    <DropdownMenuItem>
                                        <item.icon className="h-4 w-4 mr-2" />
                                        {item.name}
                                    </DropdownMenuItem>
                                </Link>
                            ))}
                        </DropdownMenuGroup>
                    </React.Fragment>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
