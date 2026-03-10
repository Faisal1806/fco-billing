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
            duration: 2,
            ease: [0.22, 1, 0.36, 1],
        });
        return controls.stop;
    }, [numericValue]);

    React.useEffect(() => {
        return rounded.onChange(v => setDisplayValue(v));
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

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

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
        <Card className="relative glass-panel h-full p-6 flex flex-col justify-between transition-all duration-500 hover:border-accent/40 hover:bg-white/[0.03] overflow-hidden rounded-[2rem]">
            {/* Dynamic Spotlight Effect */}
            <motion.div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ 
                    background: useTransform(
                        [mouseXSpring, mouseYSpring],
                        ([x, y]) => `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(34,197,94,0.12) 0%, transparent 60%)`
                    )
                }}
            />
            
            <div className="flex justify-between items-start relative z-10" style={{ transform: "translateZ(30px)" }}>
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground group-hover:text-accent transition-colors duration-500">
                        {title}
                    </p>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-accent/20 group-hover:text-accent transition-all duration-700 border border-white/5 group-hover:border-accent/30 shadow-2xl">
                    <Icon className="h-5 w-5 transition-transform duration-700 group-hover:scale-125 group-hover:rotate-6" />
                </div>
            </div>
            
            <div className="mt-10 relative z-10" style={{ transform: "translateZ(50px)" }}>
                <h3 className="text-4xl font-black text-white tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-700 origin-left">
                    <AnimatedNumber value={value} />
                </h3>
                <p className="text-[11px] text-muted-foreground mt-3 font-semibold opacity-60 group-hover:opacity-100 transition-opacity leading-relaxed max-w-[80%]">
                    {description}
                </p>
            </div>

            {/* Bottom Floating Accent */}
            <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-gradient-to-r from-accent/0 via-accent to-accent/0 transition-all duration-1000 group-hover:w-full" />
        </Card>
    </motion.div>
  );
};