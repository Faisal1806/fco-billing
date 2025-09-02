
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center"
      >
        <motion.h1
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-3xl font-bold mb-6 text-purple-600"
        >
          🚀 Welcome Back
        </motion.h1>

        <motion.div
          initial={{ rotate: -20, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5, type: 'spring' }}
          className="flex justify-center mb-6"
        >
          <Logo className="w-24 h-24 rounded-full shadow-lg" />
        </motion.div>

        <div className="space-y-4">
            <div className="relative">
                <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400 text-center"
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
                    className="absolute inset-y-0 right-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                </Button>
            </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Login →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
