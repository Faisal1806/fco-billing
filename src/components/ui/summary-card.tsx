
'use client';

import * as React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Card } from './card';

export const SummaryCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description 
}: { 
    title: string; 
    value: string; 
    icon: React.ElementType; 
    description: string;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the movement
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  // Map mouse position to rotation degrees
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

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
            transformStyle: "preserve-3d",
        }}
        variants={{
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1 }
        }}
        className="group relative h-full"
    >
        <Card className="bg-card/60 backdrop-blur-sm border-white/10 h-full p-5 flex flex-col justify-between transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] shadow-lg overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10" style={{ transform: "translateZ(30px)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{title}</p>
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
            </div>
            
            <div className="mt-6 relative z-10" style={{ transform: "translateZ(60px)" }}>
                <h3 className="text-3xl font-black text-white tracking-tight drop-shadow-md">{value}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1 opacity-80">{description}</p>
            </div>
        </Card>
    </motion.div>
  );
};
