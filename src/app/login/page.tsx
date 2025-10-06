
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
    return null; // or a loading spinner
  }

  return (
    <div className="login-splash-screen">
       <div className="animated-background"></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="login-container"
      >
        <div className="flex-1 p-8 text-white flex flex-col justify-center items-center text-center">
            <h2 className="text-3xl font-bold">Welcome Back!</h2>
            <p className="mt-2 text-gray-300">Your trusted partner in fruit trading.</p>
        </div>
        <div className="flex-1 p-8 bg-white/10 flex flex-col justify-center">
            <div className="flex items-center justify-center gap-4 mb-8">
                <Logo className="h-16 w-16 text-white" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-200">F.Co</h1>
                    <p className="text-md text-gray-300">FIRDOUS AHMAD & COMPANY</p>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-white">Admin Login</h2>
            <div className="relative mt-6">
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-transparent border-2 border-gray-500/50 focus:border-sky-400 text-white peer w-full"
                autoComplete="current-password"
              />
              <Label 
                htmlFor="password"
                className="absolute top-1/2 -translate-y-1/2 left-3 px-1 text-gray-400 transition-all duration-200 ease-in-out pointer-events-none 
                           peer-focus:-translate-y-[150%] peer-focus:text-sky-400 peer-focus:text-xs peer-focus:bg-gray-800
                           peer-valid:-translate-y-[150%] peer-valid:text-sky-400 peer-valid:text-xs peer-valid:bg-gray-800"
              >
                Password
              </Label>
               <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            <Button onClick={handleLogin} className="w-full mt-6 bg-sky-500 hover:bg-sky-600 text-white">
              Login
            </Button>
            <div className="text-center mt-4">
                <Button variant="link" size="sm" onClick={() => router.push('/portal/login')} className="text-gray-400 hover:text-sky-400">
                    Go to Customer Portal
                </Button>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
