"use client";

import { cn } from "@/lib/utils";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import React from "react";

export interface AnimatedShinyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const AnimatedShinyButton = ({
  children,
  className,
  ...props
}: AnimatedShinyButtonProps) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLButtonElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.button
      style={{
        "--mouseX": useMotionTemplate`${mouseX}px`,
        "--mouseY": useMotionTemplate`${mouseY}px`,
      }}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative h-20 w-full overflow-hidden rounded-xl border border-white/10 text-lg shiny-button",
        className,
      )}
      {...props}
    >
      <div className="shiny-button-inner">
        {children}
      </div>
    </motion.button>
  );
};
