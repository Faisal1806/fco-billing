'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

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

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17deg", "-17deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17deg", "17deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set((mouseX / width) - 0.5);
    y.set((mouseY / height) - 0.5);
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
      className="relative h-40 w-full rounded-xl bg-gradient-to-br from-card/70 to-card/90 border border-white/10 p-6 shadow-2xl"
    >
      <div
        style={{
          transform: "translateZ(50px)",
          transformStyle: "preserve-3d",
        }}
        className="absolute inset-4 flex flex-col justify-between"
      >
        <div className="flex justify-between items-start">
            <p className="text-sm text-muted-foreground">{title}</p>
            <Icon className="h-6 w-6 text-primary" style={{transform: "translateZ(20px)"}} />
        </div>
        <div>
            <h3 className="text-3xl font-bold text-primary-foreground mt-1">{value}</h3>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};
