
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
import { useEffect, useState } from "react";

export function Toaster() {
  const { toasts } = useToast()
  const [successAnimation, setSuccessAnimation] = useState(null);

  useEffect(() => {
    fetch('/animations/cloud/fco_success.json')
      .then(res => res.json())
      .then(data => setSuccessAnimation(data))
      .catch(() => console.error("Could not load success animation."));
  }, []);

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, isSuccess, ...props }) {
        if (isSuccess && successAnimation) {
          return (
            <Toast key={id} {...props} className="fixed inset-0 bg-black/80 flex items-center justify-center border-none p-0 w-screen h-screen z-[200]">
              {successAnimation && <Lottie
                animationData={successAnimation}
                loop={false}
                style={{ width: 300, height: 300 }}
                onComplete={() => props.onOpenChange?.(false)}
              />}
            </Toast>
          )
        }
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

