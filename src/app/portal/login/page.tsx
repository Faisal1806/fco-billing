
'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Loader2 } from 'lucide-react';
import { addLog } from '@/lib/logger';

function CustomerLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState('');
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);

  const handleLogin = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your name.');
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'A name is required to view your ledger.',
      });
      setIsAutoLoggingIn(false);
      return;
    }

    let ledgerExists = false;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('invoice-') || key.startsWith('purchase-') || key.startsWith('party-'))) {
            try {
                const doc = JSON.parse(localStorage.getItem(key)!);
                const party = doc.customerName || doc.growerName || doc.name;
                if (party && party.toLowerCase() === trimmedName.toLowerCase()) {
                    ledgerExists = true;
                    break;
                }
            } catch (e) {
                console.error("Failed to parse document for login check", e);
            }
        }
    }

    if (ledgerExists) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('customerName', trimmedName);
        }
        addLog('Portal Login', `Customer "${trimmedName}" logged in successfully.`);
        router.push('/portal/dashboard');
        toast({
            title: 'Login Successful',
            description: `Welcome, ${trimmedName}!`,
        });
    } else {
        setError('No ledger found for this name. Please check the spelling.');
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'No transactions found for this name.',
        });
        setIsAutoLoggingIn(false);
        // If auto-login fails, clear the bad query param to allow manual login
        router.replace('/portal/login');
    }
  };

  useEffect(() => {
    const customerQuery = searchParams.get('customer');
    if (customerQuery) {
        setIsAutoLoggingIn(true);
        // Use a small timeout to allow the UI to show the loading state
        setTimeout(() => handleLogin(customerQuery), 500);
    }
  }, [searchParams]);
  
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
          handleLogin(customerName);
      }
  }

  if (isAutoLoggingIn) {
      return (
          <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-lg text-muted-foreground">Logging you in automatically...</p>
          </div>
      )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="text-center">
                 <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                    className="mx-auto bg-primary text-primary-foreground p-3 rounded-full w-fit mb-4"
                >
                   <User className="h-8 w-8" />
                </motion.div>
                <CardTitle className="text-2xl">Customer Portal Login</CardTitle>
                <CardDescription>Enter your full registered name to view your ledger. In the future, this will use an OTP.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="customerName">Your Full Name</Label>
                    <Input 
                        id="customerName"
                        placeholder="Enter your name as it appears on bills"
                        value={customerName}
                        onChange={(e) => {
                            setCustomerName(e.target.value);
                            setError('');
                        }}
                        onKeyPress={handleKeyPress}
                    />
                 </div>
                 {error && <p className="text-sm text-red-500 animate-pulse">{error}</p>}
                  <Button onClick={() => handleLogin(customerName)} className="w-full">
                    View My Ledger
                </Button>
            </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
      </div>
    }>
      <CustomerLoginPageContent />
    </Suspense>
  );
}
