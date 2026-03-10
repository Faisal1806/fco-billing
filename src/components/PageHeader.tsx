
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    imageUrl: string;
    className?: string;
}

const PageHeader = ({ title, description, icon, imageUrl, className }: PageHeaderProps) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={cn(
                "relative overflow-hidden rounded-3xl p-8 md:p-12 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] bg-black/40 mb-8",
                className
            )}
        >
            {/* Parallax Background */}
            <motion.div
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.3 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${imageUrl})` }}
            />
            
            {/* Gradients Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                 <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
                    className="bg-accent/20 p-5 rounded-2xl border border-accent/30 text-accent shadow-[0_0_30px_rgba(34,197,94,0.2)] backdrop-blur-md"
                >
                    <div className="h-10 w-10 flex items-center justify-center">
                        {icon}
                    </div>
                </motion.div>
                <div className="space-y-2">
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-lg"
                    >
                        {title}
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-lg text-muted-foreground max-w-2xl font-medium leading-relaxed"
                    >
                        {description}
                    </motion.p>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full" />
        </motion.div>
    );
};

export default PageHeader;
