'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Plus, X, FilePlus, ShoppingCart, UserPlus, PackagePlus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const actionItems = [
    { label: 'New Sale / Invoice', icon: FilePlus, href: '/sales' },
    { label: 'New Purchase', icon: ShoppingCart, href: '/purchases' },
    { label: 'Add New Party', icon: UserPlus, href: '/parties' },
    { label: 'Add New Product', icon: PackagePlus, href: '/products' },
];

const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleActionClick = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };
  
  const fabVariants = {
    closed: { scale: 1, rotate: 0 },
    open: { scale: 1.1, rotate: 45 },
  };
  
  const menuVariants = {
    closed: { scale: 0, opacity: 0, y: 50 },
    open: { 
        scale: 1, 
        opacity: 1, 
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 260,
            damping: 20,
            staggerChildren: 0.07,
            delayChildren: 0.2,
        },
    },
  };
  
  const itemVariants = {
    closed: { opacity: 0, y: 20, scale: 0.5 },
    open: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <TooltipProvider>
      <div className="fixed bottom-8 right-8 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="flex flex-col items-end gap-3 mb-4"
            >
              {actionItems.map((item) => (
                <motion.div
                  key={item.label}
                  variants={itemVariants}
                  whileHover={{ scale: 1.1, x: -5, y: -2, rotateZ: -2 }}
                  className="flex items-center gap-2"
                >
                    <Tooltip>
                         <TooltipTrigger asChild>
                            <span className="bg-card/80 backdrop-blur-sm text-sm px-3 py-1.5 rounded-lg shadow-lg border border-white/10">{item.label}</span>
                        </TooltipTrigger>
                         <TooltipContent side="left">
                            <p>Go to {item.label}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Button
                        size="icon"
                        className="rounded-full h-12 w-12 shadow-lg bg-primary/80 backdrop-blur-md border-white/20"
                        onClick={() => handleActionClick(item.href)}
                    >
                        <item.icon className="h-5 w-5" />
                    </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
            whileHover={{ scale: 1.1, rotateZ: 15 }}
            className="flex flex-col items-center"
        >
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="icon"
                        className="rounded-full h-16 w-16 shadow-2xl bg-gradient-to-br from-green-500 to-teal-500"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle Quick Actions"
                    >
                        <motion.div
                            variants={fabVariants}
                            animate={isOpen ? 'open' : 'closed'}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                        </motion.div>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>Quick Actions</p>
                </TooltipContent>
            </Tooltip>
        </motion.div>
      </div>
    </TooltipProvider>
  );
};

export default FloatingActionButton;



