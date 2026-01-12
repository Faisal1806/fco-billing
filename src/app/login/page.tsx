
'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Lottie from 'lottie-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FCo3DHome() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [logoAnimationData, setLogoAnimationData] = useState(null);
  const [bgAnimationData, setBgAnimationData] = useState(null);

  useEffect(() => {
    fetch('/animations/logo/fco_logo_3d_rotate.json')
      .then(res => res.json())
      .then(data => setLogoAnimationData(data))
      .catch(() => console.error("Could not load 3D logo animation."));
    
    // Updated to use the new professional 3D background
    fetch('/animations/extras/fco_3d_bg.json')
      .then(res => res.json())
      .then(data => setBgAnimationData(data))
      .catch(() => console.error("Could not load background animation."));

  }, []);

  const handleAdminLogin = () => {
    const adminPass = 'fco';
    if (password === adminPass) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('userRole', 'admin');
        }
        toast({ 
            title: "Access Granted", 
            description: "Welcome back!", 
            isSuccess: true 
        });
        // The success toast has a 2.8s animation, so we delay navigation
        setTimeout(() => {
          router.push('/dashboard');
        }, 2800);
    } else {
        toast({ variant: 'destructive', title: "Incorrect Password" });
        setPassword('');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('userRole') === 'admin') {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 1500); // Shorter delay for returning users
      return () => clearTimeout(timer);
    }
  }, [router]);

  return (
    <div className="h-screen w-full bg-gradient-to-br from-black via-gray-900 to-primary/30 flex flex-col items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 z-0">
             {bgAnimationData && <Lottie 
                animationData={bgAnimationData}
                loop={true}
                className="absolute inset-0 w-full h-full object-cover opacity-50"
             />}
             <div className="absolute inset-0 bg-background/90"></div>
        </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, type: "spring", stiffness: 100, damping: 10 }}
        className="z-10 flex flex-col items-center"
      >
        <div className="cursor-pointer">
           {logoAnimationData ? (
             <Lottie animationData={logoAnimationData} loop={true} style={{ width: 200, height: 200 }} />
           ) : (
             <div className="h-[200px] w-[200px]" />
           )}
        </div>
        <h1 className="text-white text-5xl font-extrabold tracking-widest text-center mt-2">
          F.Co
        </h1>
        <p className="text-gray-400 text-lg">Billing System</p>
      </motion.div>

       <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.5 } }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute bottom-24 z-20 w-full max-w-sm"
             >
                <Card className="bg-card/80 backdrop-blur-sm border-white/10 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldCheck className="text-green-500"/> App Locked</CardTitle>
                        <CardDescription>Enter the admin password to unlock.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mt-4">
                            <KeyRound className="h-5 w-5 text-muted-foreground" />
                            <Input 
                                type="password"
                                placeholder="Enter admin password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                            />
                            <Button onClick={handleAdminLogin}>Unlock</Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>

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
