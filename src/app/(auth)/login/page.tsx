
"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from "@/components/logo";


export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const allowedAdminPassword = 'Faisal1806';
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 p-4">
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
        >
            <h1 className="text-5xl font-bold text-white">
               Welcome to <span className="text-primary">SwiftSale</span>
            </h1>
            <p className="text-xl text-muted-foreground mt-2">F.Co Official Billing System</p>
        </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        className="bg-background/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/10"
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6, type: "spring", stiffness: 100 }}
          className="mb-6 flex flex-col items-center text-center"
        >
           <div className="bg-primary/10 border border-primary/20 p-3 rounded-full mb-4">
            <Lock className="h-8 w-8 text-primary" />
           </div>
           <h1 className="text-2xl font-bold text-foreground">Admin & Staff Login</h1>
           <p className="text-muted-foreground text-sm mt-1">Enter your assigned password to continue.</p>
        </motion.div>

        <div className="space-y-4">
            <div className="relative">
                <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="w-full pl-4 pr-10 py-3 border-2 border-border focus:ring-2 focus:ring-primary/50 text-lg text-center bg-background/70 h-14"
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
          {error && <p className="text-sm text-red-500 animate-pulse text-center">{error}</p>}
          <Button
            onClick={handleLogin}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg h-12 text-base font-bold"
          >
            Login
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
