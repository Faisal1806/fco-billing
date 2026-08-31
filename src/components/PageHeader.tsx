'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    imageUrl?: string;
    className?: string;
}

const PageHeader = ({ title, description, icon, className }: PageHeaderProps) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: -30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
                "relative overflow-hidden rounded-[3rem] p-10 md:p-16 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.5)] bg-black/40 mb-12",
                className
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10 text-center md:text-left">
                 <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 150, damping: 15 }}
                    className="bg-primary/20 p-6 rounded-3xl border border-primary/40 text-primary shadow-[0_0_40px_rgba(30,127,79,0.3)] backdrop-blur-xl"
                >
                    <div className="h-12 w-12 flex items-center justify-center">
                        {icon}
                    </div>
                </motion.div>
                <div className="space-y-4">
                    <motion.h1 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                    >
                        {title}
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-xl text-muted-foreground max-w-3xl font-semibold leading-relaxed opacity-80"
                    >
                        {description}
                    </motion.p>
                </div>
            </div>

            {/* Kinetic Light Elements */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute top-[-50%] right-[-10%] w-[80%] h-[150%] bg-primary/10 blur-[120px] rounded-full" 
            />
        </motion.div>
    );
};

export default PageHeader;






