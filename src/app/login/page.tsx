'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, KeyRound, Fingerprint, Lock, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Lottie from 'lottie-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [logoAnimationData, setLogoAnimationData] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [systemId, setSystemId] = useState('');

  useEffect(() => {
    setSystemId(Math.random().toString(36).substring(2, 10).toUpperCase());
    
    fetch('/animations/logo/fco_logo_3d_rotate.json')
      .then(res => res.json())
      .then(data => setLogoAnimationData(data))
      .catch(() => console.error("Could not load 3D logo animation."));
  }, []);

  const handleLogin = () => {
    const adminPass = 'fco';
    if (password === adminPass) {
        setIsLoggingIn(true);
        if (typeof window !== 'undefined') {
            localStorage.setItem('userRole', 'admin');
        }
        
        toast({ 
            title: "ACCESS GRANTED", 
            description: "SECURE SESSION ESTABLISHED", 
            isSuccess: true 
        });
        
        // Wait for the success animation and cinematic transition
        setTimeout(() => {
          router.push('/dashboard');
        }, 2200);
    } else {
        toast({ 
            variant: 'destructive', 
            title: "AUTH FAILED", 
            description: "INVALID SECURITY CREDENTIALS" 
        });
        setPassword('');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, filter: "blur(10px)" },
    visible: { 
        opacity: 1, 
        scale: 1, 
        filter: "blur(0px)",
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    },
    exit: { 
        opacity: 0, 
        y: -150, 
        scale: 1.1,
        filter: "blur(20px)",
        transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } 
    }
  };

  return (
    <div className="h-screen w-full bg-[#020205] flex flex-col items-center justify-center overflow-hidden relative">
        {/* Cinematic Background Mesh */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-accent/10 blur-[150px]" 
            />
            <motion.div 
                animate={{ 
                    scale: [1.2, 1, 1.2],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-blue-500/10 blur-[150px]" 
            />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
        </div>

      <AnimatePresence mode="wait">
        {!isLoggingIn ? (
          <motion.div
            key="login-interface"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="z-10 w-full max-w-sm px-6"
          >
            <div className="flex flex-col items-center mb-12">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="h-32 w-32 mb-6 relative"
                >
                    {logoAnimationData && <Lottie animationData={logoAnimationData} loop={true} />}
                    <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full opacity-30 -z-10" />
                </motion.div>
                <motion.h1 
                    initial={{ letterSpacing: "0.5em", opacity: 0 }}
                    animate={{ letterSpacing: "0.1em", opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="text-white text-4xl font-black tracking-tighter uppercase"
                >
                    F.Co <span className="text-accent">OS</span>
                </motion.h1>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.5em] mt-3 opacity-50">AUTHORIZED PERSONNEL ONLY</p>
            </div>

            <Card className="glass-panel border-white/5 rounded-[3rem] shadow-2xl overflow-hidden relative group">
                {/* Visual Scanner Line Effect */}
                <motion.div 
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 w-full h-[1px] bg-accent/20 z-20 pointer-events-none"
                />
                
                <CardHeader className="text-center pt-12">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center justify-center gap-3">
                        <Lock className="h-3 w-3 text-accent" /> SYSTEM AUTHENTICATION
                    </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-8 pb-12 px-8">
                    <div className="relative">
                        <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors duration-500" />
                        <Input 
                            type="password"
                            placeholder="SECURITY KEY"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            className="h-16 pl-14 rounded-2xl bg-white/5 border-white/10 focus:border-accent/40 font-black tracking-[0.3em] text-lg placeholder:text-[10px] placeholder:tracking-[0.2em] placeholder:opacity-20"
                        />
                    </div>

                    <div className="flex gap-4">
                        <motion.div 
                            className="flex-1"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                        >
                            <Button 
                                onClick={handleLogin} 
                                className="w-full h-16 rounded-2xl bg-accent text-black font-black tracking-[0.2em] hover:bg-accent/90 shadow-[0_0_30px_rgba(34,197,94,0.2)] transition-all uppercase text-[10px] relative overflow-hidden"
                            >
                                <span className="relative z-10">AUTHORIZE ACCESS</span>
                                <motion.div 
                                    className="absolute inset-0 bg-white/20"
                                    initial={{ x: "-100%" }}
                                    whileHover={{ x: "100%" }}
                                    transition={{ duration: 0.6 }}
                                />
                            </Button>
                        </motion.div>
                        
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.9, rotate: -15 }}
                        >
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-16 w-16 rounded-2xl border-white/10 bg-white/5 hover:bg-accent/10 hover:border-accent/30 group transition-all"
                                title="Biometric Node Bypass"
                            >
                                <Fingerprint className="h-7 w-7 text-muted-foreground group-hover:text-accent transition-colors" />
                            </Button>
                        </motion.div>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-12 flex flex-col items-center gap-4 opacity-30">
                <div className="h-10 w-[1px] bg-gradient-to-b from-white to-transparent" />
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white">TERMINAL ID: {systemId}</p>
            </div>
          </motion.div>
        ) : (
            <motion.div
                key="authorizing-state"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10 flex flex-col items-center"
            >
                <div className="relative mb-10">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="h-24 w-24 border-[3px] border-accent/10 border-t-accent rounded-full" 
                    />
                    <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-accent drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.6em] text-accent animate-pulse">CREDENTIALS VERIFIED</p>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">SYNCING MANDI LOGISTICS NODE...</p>
                </div>
                
                {/* Screen Slide Up Preview Effect */}
                <motion.div 
                    initial={{ y: "100vh" }}
                    animate={{ y: "20vh" }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed bottom-0 left-0 w-full h-screen bg-card/20 backdrop-blur-3xl border-t border-white/10 rounded-t-[4rem] z-50 flex justify-center pt-10"
                >
                    <ChevronUp className="h-6 w-6 text-white/20 animate-bounce" />
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

