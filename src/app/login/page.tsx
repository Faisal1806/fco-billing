
'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Lottie from 'lottie-react';

export default function FCo3DHome() {
  const router = useRouter();
  const { toast } = useToast();
  const [logoClicks, setLogoClicks] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [logoAnimationData, setLogoAnimationData] = useState(null);
  const [bgAnimationData, setBgAnimationData] = useState(null);

  useEffect(() => {
    fetch('/animations/logo/fco_logo_3d_rotate.json')
      .then(res => res.json())
      .then(data => setLogoAnimationData(data))
      .catch(() => console.error("Could not load 3D logo animation."));
    
    fetch('/animations/extras/fco_particle_glow.json')
      .then(res => res.json())
      .then(data => setBgAnimationData(data))
      .catch(() => console.error("Could not load background animation."));

  }, []);


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
        toast({ 
            title: "Admin Access Granted", 
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
      }, 2000); // 2-second delay for splash screen
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
        <div onClick={handleLogoClick} className="cursor-pointer" title="Admin Access">
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
        {showPassword && (
             <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute bottom-24 z-20 bg-card/80 backdrop-blur-sm border border-white/10 p-6 rounded-lg shadow-2xl w-full max-w-sm"
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
