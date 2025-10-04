
'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
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
    return null;
  }

  return (
    <div className="login-splash-screen">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex items-center gap-4 mb-8 text-center"
      >
        <div className="bg-slate-800 p-4 rounded-2xl shadow-lg">
            <Logo className="h-16 w-16 text-white" />
        </div>
        <div>
            <h1 className="text-4xl font-bold text-gray-200">F.Co</h1>
            <p className="text-lg text-muted-foreground">FIRDOUS AHMAD & COMPANY</p>
            <p className="text-xl font-semibold text-sky-400">Sopore, Kashmir</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="login-box"
      >
        <div className="login-form">
            <h2 className="text-2xl font-bold text-center text-white">Admin Login</h2>
            <p className="text-center text-muted-foreground text-sm mt-2">Enter password to access the app</p>
            <div className="relative mt-8">
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-transparent border-2 border-gray-600 focus:border-sky-400 text-white peer"
              />
              <Label 
                htmlFor="password"
                className="absolute top-0 left-0 px-3 py-2 text-gray-400 transition-all duration-200 ease-in-out pointer-events-none 
                           peer-focus:-translate-y-1/2 peer-focus:text-sky-400 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-[#222]
                           peer-valid:-translate-y-1/2 peer-valid:text-sky-400 peer-valid:text-xs peer-valid:px-1 peer-valid:bg-[#222]"
              >
                Password
              </Label>
               <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            <Button onClick={handleLogin} className="w-full mt-8 bg-sky-500 hover:bg-sky-600 text-white">
              Login
            </Button>

            <div className="text-center mt-6">
                <Button variant="link" size="sm" onClick={() => router.push('/portal/login')} className="text-gray-400 hover:text-sky-400">
                    Go to Customer Portal
                </Button>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
