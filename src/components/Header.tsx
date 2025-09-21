
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Menu, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ThemeSwitcher } from './theme-switcher';
import { sidebarSections } from './Sidebar';
import Link from 'next/link';

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
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
      <div className="w-full flex-1">
        {/* The title can be managed via a context or prop if needed */}
      </div>
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
        </Button>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                 {sidebarSections.map((section) => (
                    <React.Fragment key={section.title}>
                        <DropdownMenuLabel>{section.title}</DropdownMenuLabel>
                        <DropdownMenuGroup>
                        {section.items.map((item) => {
                            const { name, href, icon: Icon } = item;
                            return (
                                <Link href={href} passHref key={name}>
                                    <DropdownMenuItem>
                                        <Icon className="mr-2 h-4 w-4" />
                                        <span>{name}</span>
                                    </DropdownMenuItem>
                                </Link>
                            )
                        })}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                    </React.Fragment>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
