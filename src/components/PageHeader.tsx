'use client';

import { motion } from 'framer-motion';

interface PageHeaderProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    imageUrl: string;
}

const PageHeader = ({ title, description, icon, imageUrl }: PageHeaderProps) => {
    return (
        <div className="relative overflow-hidden rounded-lg p-6 md:p-8 border border-white/10 shadow-2xl bg-black/20">
            <div
                className="absolute inset-0 bg-cover bg-center opacity-20"
                style={{ backgroundImage: `url(${imageUrl})` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>

            <div className="relative z-10 flex items-start gap-4">
                 <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
                    className="bg-white/10 p-3 rounded-lg border border-white/20 text-primary"
                >
                    {icon}
                </motion.div>
                <div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl font-bold text-white"
                    >
                        {title}
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-1 text-muted-foreground"
                    >
                        {description}
                    </motion.p>
                </div>
            </div>
        </div>
    );
};

export default PageHeader;
