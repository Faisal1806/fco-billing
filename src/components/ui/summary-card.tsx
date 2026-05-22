'use client';

import * as React from 'react';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { Card } from './card';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    description: string;
    className?: string;
}

const AnimatedNumber = ({ value }: { value: string }) => {
    const numericValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;
    const prefix = value.match(/^[^0-9]*/)?.[0] || '';
    const suffix = value.match(/[0-9]*(.*)$/)?.[1] || '';
    
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => 
        prefix + Math.round(latest).toLocaleString() + suffix
    );
    const [displayValue, setDisplayValue] = React.useState(value);

    React.useEffect(() => {
        const controls = animate(count, numericValue, {
            duration: 2.5,
            ease: [0.22, 1, 0.36, 1],
        });
        return controls.stop;
    }, [numericValue, count]);

    React.useEffect(() => {
        return rounded.on("change", v => setDisplayValue(v));
    }, [rounded]);

    return <span>{displayValue}</span>;
};

export const SummaryCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description,
    className
}: SummaryCardProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

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
            perspective: 1200,
            transformStyle: "preserve-3d",
        }}
        variants={{
            hidden: { y: 30, opacity: 0, scale: 0.9, filter: "blur(10px)" },
            visible: { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }
        }}
        className={cn("group h-full", className)}
    >
        <Card className="relative glass-panel h-full p-8 flex flex-col justify-between transition-all duration-700 hover:border-primary/50 hover:bg-white/[0.05] overflow-hidden rounded-[2.5rem] shadow-2xl">
            <motion.div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ 
                    background: useTransform(
                        [mouseXSpring, mouseYSpring],
                        ([mx, my]) => `radial-gradient(circle at ${(mx + 0.5) * 100}% ${(my + 0.5) * 100}%, rgba(30,127,79,0.15) 0%, transparent 70%)`
                    )
                }}
            />
            
            <div className="flex justify-between items-start relative z-10" style={{ transform: "translateZ(50px)" }}>
                <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground group-hover:text-primary transition-colors duration-700">
                        {title}
                    </p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-primary/20 group-hover:text-primary transition-all duration-700 border border-white/5 group-hover:border-primary/40 shadow-xl">
                    <Icon className="h-6 w-6 transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12" />
                </div>
            </div>
            
            <div className="mt-12 relative z-10" style={{ transform: "translateZ(80px)" }}>
                <h3 className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-700 origin-left">
                    <AnimatedNumber value={value} />
                </h3>
                <p className="text-xs text-muted-foreground mt-4 font-bold opacity-60 group-hover:opacity-100 transition-opacity leading-relaxed max-w-[90%]">
                    {description}
                </p>
            </div>

            <div className="absolute bottom-0 left-0 h-[4px] w-0 bg-gradient-to-r from-primary/0 via-primary to-primary/0 transition-all duration-1000 group-hover:w-full" />
        </Card>
    </motion.div>
  );
};

