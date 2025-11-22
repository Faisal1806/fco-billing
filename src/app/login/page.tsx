'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Float, MeshDistortMaterial } from '@react-three/drei'
import { motion } from 'framer-motion'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';

export default function FCo3DHome() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to the dashboard after a delay
    const timer = setTimeout(() => {
        if (typeof window !== 'undefined' && localStorage.getItem('userRole') === 'admin') {
            router.push('/dashboard');
        } else {
            // If not admin, redirect to the actual login page for customers or other roles
            router.push('/portal/login');
        }
    }, 4000); // 4-second delay for the splash screen

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, [router]);

  return (
    <div className="h-screen w-full bg-gradient-to-br from-black via-gray-900 to-primary/30 flex flex-col items-center justify-center overflow-hidden">
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="z-10 flex flex-col items-center"
      >
        <Logo className="h-32 w-32 text-primary-foreground" />
        <h1 className="text-white text-5xl font-extrabold tracking-widest text-center mt-4">
          F.Co
        </h1>
        <p className="text-gray-400 text-lg">Billing System</p>
      </motion.div>

      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <Float speed={2} floatIntensity={2}>
            <mesh>
              <sphereGeometry args={[1.5, 32, 32]} />
              <MeshDistortMaterial
                color="hsl(var(--primary))"
                distort={0.4}
                speed={2}
              />
            </mesh>
          </Float>
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
      </div>

      <motion.p
        className="text-gray-500 mt-6 text-sm tracking-wide z-10 absolute bottom-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        Powered by F.Co Technologies
      </motion.p>
    </div>
  )
}
