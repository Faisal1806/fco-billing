'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Lottie from 'lottie-react';
import { motion } from 'framer-motion';
// The Lottie component will fetch this URL at runtime.
const splashAnimationPath = '/animations/fco_splash.json';

export default function HomePage() {
  const router = useRouter();
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimationComplete(true);
      setTimeout(() => router.replace('/login'), 500); // Wait for fade-out
    }, 3000); // Total splash screen duration

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isAnimationComplete ? 0 : 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col items-center justify-center bg-black"
    >
      <Lottie
        animationData={null} // Pass null here and use the src prop
        src={splashAnimationPath} // Use the src prop for URLs
        loop={false}
        style={{ width: 300, height: 300 }}
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1.5 }}
        className="text-white text-lg font-semibold mt-4"
      >
        Your Satisfaction is Our Success
      </motion.p>
    </motion.div>
  );
}
