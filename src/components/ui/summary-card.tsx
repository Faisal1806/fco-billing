'use client';

import { motion } from 'framer-motion';
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
  return (
    <motion.div
        variants={{
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1 }
        }}
        whileHover={{ y: -8, scale: 1.05, boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.4)" }}
    >
        <Card className="bg-card/60 backdrop-blur-sm border-white/10 h-full p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <p className="text-sm text-muted-foreground">{title}</p>
                <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-auto">
                <h3 className="text-3xl font-bold text-primary">{value}</h3>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
        </Card>
    </motion.div>
  );
};
