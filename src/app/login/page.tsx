'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function FCo3DHome() {
  const router = useRouter();
  const { toast } = useToast();
  const [logoClicks, setLogoClicks] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  const handleLogoClick = () => {
    const newClickCount = logoClicks + 1;
    setLogoClicks(newClickCount);

    if (newClickCount >= 5) {
      setShowPassword(true);
      setLogoClicks(0);
    }
  };

  const handleAdminLogin = () => {
    const adminPass = 'fco';
    if (password === adminPass) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('userRole', 'admin');
        }
        toast({ title: "Admin Access Granted", description: "Welcome back!" });
        router.push('/dashboard');
    } else {
        toast({ variant: 'destructive', title: "Incorrect Password" });
        setPassword('');
    }
  };

  useEffect(() => {
    // Automatically redirect to the dashboard after a delay
    const timer = setTimeout(() => {
        if (typeof window !== 'undefined' && localStorage.getItem('userRole') === 'admin') {
            router.push('/dashboard');
        } else {
            // If not admin, and no password prompt is shown, redirect to customer portal
            if (!showPassword) {
                 router.push('/portal/login');
            }
        }
    }, 3000); // 3-second delay for the splash screen

    return () => clearTimeout(timer);
  }, [router, showPassword]);

  return (
    <div className="h-screen w-full bg-gradient-to-br from-black via-gray-900 to-primary/30 flex flex-col items-center justify-center overflow-hidden">
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="z-10 flex flex-col items-center"
      >
        <div onClick={handleLogoClick} className="cursor-pointer" title="Admin Access">
            <Logo className="h-32 w-32 text-primary-foreground" />
        </div>
        <h1 className="text-white text-5xl font-extrabold tracking-widest text-center mt-4">
          F.Co
        </h1>
        <p className="text-gray-400 text-lg">Billing System</p>
      </motion.div>

       <AnimatePresence>
        {showPassword && (
             <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute bottom-24 z-20 bg-card p-6 rounded-lg shadow-2xl w-full max-w-sm"
             >
                <h3 className="font-semibold text-lg flex items-center gap-2"><ShieldCheck className="text-green-500" /> Admin Login</h3>
                <div className="flex items-center gap-2 mt-4">
                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                    <Input 
                        type="password"
                        placeholder="Enter admin password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                    />
                    <Button onClick={handleAdminLogin}>Login</Button>
                </div>
            </motion.div>
        )}
        </AnimatePresence>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
          <Loader2 className="h-48 w-48 animate-spin text-primary/10" />
      </div>

      <motion.p
        className="text-gray-500 mt-6 text-sm tracking-wide z-10 absolute bottom-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        Powered by F.Co Technologies
      </motion.p>
    </div>
  )
}
