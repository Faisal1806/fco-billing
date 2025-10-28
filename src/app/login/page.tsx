'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, User as UserIcon } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogin = () => {
    if (username.toLowerCase() === 'admin' && password === 'Faisal1806') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('userRole', 'admin');
      }
      toast({
        title: 'Login Successful',
        description: 'Welcome back, Admin!',
        isSuccess: true,
      });
      router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Incorrect username or password. Please try again.',
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
    <div className="login-splash-screen bg-gray-900">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('/backgrounds/abstract_glow.jpeg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="fixed inset-0 bg-black/70 z-0"/>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="login-container w-full max-w-sm md:max-w-md"
      >
        <div className="w-full p-8 bg-background/50 flex flex-col justify-center rounded-2xl">
            <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.8 }}
                className="flex items-center justify-center gap-4 mb-8"
            >
                <Logo className="h-20 w-20 text-white" />
                <div>
                    <h1 className="text-4xl font-bold text-gray-200">F.Co App</h1>
                    <p className="text-lg text-gray-300">ADMINISTRATION</p>
                </div>
            </motion.div>

             <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 1 }}
             >
                <h2 className="text-2xl font-bold text-center text-white">Admin Login</h2>
                <div className="mt-6 space-y-4">
                     <div>
                        <Label htmlFor="username" className="sr-only">Username</Label>
                        <div className="relative">
                            <Input 
                                id="username" 
                                type="text" 
                                placeholder="Username"
                                required 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="bg-transparent border-2 border-gray-500/50 focus:border-sky-400 text-white w-full pl-10 h-12 text-lg"
                                autoComplete="username"
                            />
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                    <div>
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
                                className="bg-transparent border-2 border-gray-500/50 focus:border-sky-400 text-white w-full pl-10 h-12 text-lg"
                                autoComplete="current-password"
                            />
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                </div>

                <Button onClick={handleLogin} className="w-full mt-6 h-12 text-lg bg-sky-500 hover:bg-sky-600 text-white">
                    Login
                </Button>
                <div className="text-center mt-4">
                    <Button variant="link" size="sm" onClick={() => router.push('/portal/login')} className="text-gray-400 hover:text-sky-400 gap-2">
                        <UserIcon className="h-4 w-4" /> Go to Customer Portal
                    </Button>
                </div>
            </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
