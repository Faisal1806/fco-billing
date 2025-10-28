
'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Float, MeshDistortMaterial } from '@react-three/drei'
import { motion } from 'framer-motion'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FCo3DHome() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to the dashboard after a delay
    const timer = setTimeout(() => {
        if (typeof window !== 'undefined' && localStorage.getItem('userRole') === 'admin') {
            router.push('/dashboard');
        }
    }, 4000); // 4-second delay for the splash screen

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, [router]);

  return (
    <div className="h-screen w-full bg-gradient-to-br from-black via-gray-900 to-red-900 flex flex-col items-center justify-center overflow-hidden">
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="z-10"
      >
        <h1 className="text-white text-5xl font-extrabold tracking-widest text-center mb-4">
          F.Co Billing System
        </h1>
      </motion.div>

      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <Float speed={2}>
            <mesh>
              <torusKnotGeometry args={[1, 0.3, 100, 16]} />
              <MeshDistortMaterial
                color="#ff3333"
                distort={0.4}
                speed={2}
              />
            </mesh>
          </Float>
          <OrbitControls enableZoom={false} />
        </Canvas>
      </div>

      <motion.p
        className="text-gray-300 mt-6 text-lg tracking-wide z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        “Your Satisfaction is Our Success”
      </motion.p>
    </div>
  )
}
