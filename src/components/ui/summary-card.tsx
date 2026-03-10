
'use client';

import * as React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Card } from './card';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    description: string;
    className?: string;
}

export const SummaryCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description,
    className
}: SummaryCardProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
            rotateX,
            rotateY,
            perspective: 1000,
            transformStyle: "preserve-3d",
        }}
        variants={{
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1 }
        }}
        className={cn("group h-full", className)}
    >
        <Card className="relative glass-panel h-full p-6 flex flex-col justify-between transition-all duration-500 hover:border-accent/50 hover:bg-card/60 overflow-hidden">
            {/* Dynamic Reflection Glow */}
            <motion.div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(34,197,94,0.15)_0%,transparent_60%)]"
                style={{ 
                    '--x': useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]) as any,
                    '--y': useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]) as any,
                } as any}
            />
            
            <div className="flex justify-between items-start relative z-10" style={{ transform: "translateZ(20px)" }}>
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-accent transition-colors duration-300">
                        {title}
                    </p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl group-hover:bg-accent/20 group-hover:text-accent transition-all duration-500 border border-white/5 group-hover:border-accent/30 shadow-lg">
                    <Icon className="h-5 w-5 transition-transform duration-500 group-hover:scale-110" />
                </div>
            </div>
            
            <div className="mt-8 relative z-10" style={{ transform: "translateZ(40px)" }}>
                <h3 className="text-3xl font-black text-white tracking-tighter drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500 origin-left">
                    {value}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 font-medium opacity-70 group-hover:opacity-100 transition-opacity">
                    {description}
                </p>
            </div>

            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-accent transition-all duration-700 group-hover:w-full" />
        </Card>
    </motion.div>
  );
};
