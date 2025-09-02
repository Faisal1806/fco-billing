
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function LoginPage() {
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gray-900" />
        <div className="relative z-10 flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <Logo className="h-32 w-32 text-white animate-in fade-in duration-500" />
            <Card className="w-full max-w-sm shadow-2xl animate-in fade-in delay-200 duration-500">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome Back</CardTitle>
                    <CardDescription>Enter your password to access the dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
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
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button onClick={handleLogin} className="w-full">
                        Login
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
