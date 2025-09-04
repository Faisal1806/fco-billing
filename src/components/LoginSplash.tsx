
"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from './logo';
import { Button } from './ui/button';
import { Input } from './ui/input';


export default function LoginSplash() {
    const router = useRouter();
    const { toast } = useToast();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const allowedAdminPassword = 'Faisal@1806';
    const allowedStaffPassword = 'staff123';

    const handleLogin = () => {
        let role = null;
        if (password === allowedAdminPassword) {
        role = 'admin';
        } else if (password === allowedStaffPassword) {
        role = 'staff';
        }

        if (role) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('userRole', role);
        }
        router.push('/dashboard');
        } else {
        setError('Invalid password. Please try again.');
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'Please enter the correct password.',
        });
        }
    };
    
    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleLogin();
        }
    }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center border border-white/20"
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 100 }}
          className="mb-6"
        >
           <h1 className="text-2xl font-bold mt-4 text-foreground">F.Co Billing System</h1>
           <p className="text-muted-foreground text-sm">Please login to continue</p>
        </motion.div>

        <div className="space-y-4">
            <div className="relative">
                <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="w-full pl-4 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-primary/50 text-center bg-background/70"
                    required
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                    }}
                    onKeyPress={handleKeyPress}
                />
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                </Button>
            </div>
          {error && <p className="text-sm text-red-500 animate-pulse">{error}</p>}
          <Button
            onClick={handleLogin}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Login →
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
