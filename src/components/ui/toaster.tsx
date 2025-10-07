
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import Lottie from 'lottie-react';
import { AnimatePresence, motion } from 'framer-motion';

export function Toaster() {
  const { toasts } = useToast()

  const animationToast = toasts.find(t => t.lottie);

  return (
    <ToastProvider>
      <AnimatePresence>
        {animationToast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center"
          >
            <div className="text-center">
              <Lottie
                animationData={null}
                src={animationToast.lottie}
                loop={animationToast.lottieLoop || false}
                style={{ width: 300, height: 300 }}
              />
              {animationToast.title && <h2 className="text-2xl font-bold text-white mt-4">{animationToast.title}</h2>}
              {animationToast.description && <p className="text-lg text-white/80">{animationToast.description}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {toasts.map(function ({ id, title, description, action, lottie, ...props }) {
        if (lottie) return null; // Don't render animation toasts in the standard viewport
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
