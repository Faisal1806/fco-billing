
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Lottie from 'lottie-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const router = useRouter();
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('/animations/splash/fco_splash_dark.json')
      .then((response) => response.json())
      .then((data) => setAnimationData(data));
  }, []);

  useEffect(() => {
    if (animationData) {
      const timer = setTimeout(() => {
        setIsAnimationComplete(true);
        setTimeout(() => router.replace('/login'), 500); // Wait for fade-out
      }, 3200); // Total splash screen duration from animation file

      return () => clearTimeout(timer);
    }
  }, [router, animationData]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isAnimationComplete ? 0 : 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col items-center justify-center bg-black"
    >
      {animationData && (
        <Lottie
          animationData={animationData}
          loop={false}
          style={{ width: 400, height: 400 }}
        />
      )}
    </motion.div>
  );
}
