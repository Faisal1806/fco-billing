
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
        <motion.div 
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
            className="flex-1 p-8 text-white flex flex-col justify-center items-center text-center"
        >
            <h2 className="text-3xl font-bold">Welcome Back!</h2>
            <p className="mt-2 text-gray-300">Your trusted partner in fruit trading.</p>
        </motion.div>
        <div className="flex-1 p-8 bg-white/10 flex flex-col justify-center">
            <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.8 }}
                className="flex items-center justify-center gap-4 mb-8"
            >
                <Logo className="h-16 w-16 text-white" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-200">F.Co</h1>
                    <p className="text-md text-gray-300">FIRDOUS AHMAD & COMPANY</p>
                </div>
            </motion.div>

             <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 1 }}
             >
                <h2 className="text-2xl font-bold text-center text-white">Admin Login</h2>
                <div className="mt-6">
                    <Label htmlFor="password" className="sr-only">Password</Label>
                    <div className="relative">
                        <Input 
                            id="password" 
                            type="password" 
                            placeholder="Password"
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="bg-transparent border-2 border-gray-500/50 focus:border-sky-400 text-white w-full pl-10"
                            autoComplete="current-password"
                        />
                         <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                </div>

                <Button onClick={handleLogin} className="w-full mt-6 bg-sky-500 hover:bg-sky-600 text-white">
                Login
                </Button>
                <div className="text-center mt-4">
                    <Button variant="link" size="sm" onClick={() => router.push('/portal/login')} className="text-gray-400 hover:text-sky-400">
                        Go to Customer Portal
                    </Button>
                </div>
            </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
