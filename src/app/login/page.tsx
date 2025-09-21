
'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only once when the component mounts on the client.
    setIsClient(true);
    // It's important NOT to check for existing login here to prevent auto-login.
    // The user must always be presented with the password screen unless they
    // are already navigating within the app. This page is the gate.
  }, []);

  const handleLogin = () => {
    if (password === 'Faisal1806') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('userRole', 'admin');
      }
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Incorrect password. Please try again.',
      });
    }
  };
  
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
          handleLogin();
      }
  }

  if (!isClient) {
    // Render nothing or a loading spinner on the server to avoid hydration errors
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
       <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex items-center gap-4 mb-8 text-center"
        >
        <div className="bg-primary/90 p-4 rounded-2xl shadow-lg">
            <Logo className="h-16 w-16 text-white" />
        </div>
        <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">F.Co</h1>
            <p className="text-lg text-muted-foreground">FIRDOUS AHMAD & COMPANY</p>
            <p className="text-xl font-semibold text-primary/90">Sopore, Kashmir</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="w-full max-w-sm shadow-2xl">
          <CardHeader>
             <div className="mx-auto bg-primary text-primary-foreground p-3 rounded-full w-fit mb-2">
               <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">Enter the password to access the dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                  <KeyRound className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={handleKeyPress} className="pl-8" />
              </div>
            </div>
            <Button onClick={handleLogin} className="w-full">
              Login
            </Button>
          </CardContent>
           <CardFooter className="text-xs text-muted-foreground text-center flex-col">
                <p>This is a local login for device access.</p>
                <Button variant="link" size="sm" onClick={() => router.push('/portal/login')}>Go to Customer Portal</Button>
            </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
