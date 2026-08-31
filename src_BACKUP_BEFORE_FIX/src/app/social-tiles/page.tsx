'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FaFacebookF, FaTwitter, FaYoutube, FaInstagram } from 'react-icons/fa';
import PageHeader from '@/components/PageHeader';
import { Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SocialTilesPage() {
  const socialLinks = [
    { 
        name: 'Facebook', 
        icon: <FaFacebookF />, 
        href: 'https://www.facebook.com/share/14WtZoPPVoZ/', 
        color: '#1877F2',
        label: 'Community'
    },
    { 
        name: 'YouTube', 
        icon: <FaYoutube />, 
        href: 'https://youtube.com/@faisal_ahmad_fa?si=B5003YSTnOnAcgt-', 
        color: '#FF0000',
        label: 'Channel'
    },
    { 
        name: 'Twitter', 
        icon: <FaTwitter />, 
        href: 'https://twitter.com/fco_apples', 
        color: '#1DA1F2',
        label: 'Updates'
    },
    { 
        name: 'Instagram', 
        icon: <FaInstagram />, 
        href: 'https://instagram.com/fco_apples', 
        color: '#E4405F',
        label: 'Gallery'
    },
  ];

  return (
    <div className="space-y-10">
       <style jsx>{`
        .social-container {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem 0;
        }

        .social-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          width: 100%;
          max-width: 900px;
          place-items: center;
        }

        @media (min-width: 1024px) {
          .social-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 3rem;
          }
        }

        .tile-wrapper {
          position: relative;
          width: 130px;
          height: 130px;
          perspective: 1000px;
        }

        @media (min-width: 768px) {
          .tile-wrapper {
            width: 160px;
            height: 160px;
          }
        }

        .tile-link {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform-style: preserve-3d;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
        }

        /* 3D Depth Base */
        .tile-link::after {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--social-color);
          border-radius: 24px;
          transform: translateZ(-15px);
          opacity: 0.2;
          transition: all 0.4s ease;
        }

        /* Hover Interaction */
        .tile-wrapper:hover .tile-link {
          transform: rotateX(10deg) rotateY(-10deg) translateZ(20px);
          background: rgba(255, 255, 255, 0.07);
          border-color: var(--social-color);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), 0 0 20px var(--social-color);
        }

        .tile-wrapper:hover .tile-link::after {
          opacity: 0.6;
          transform: translateZ(-10px);
        }

        /* Active Press */
        .tile-wrapper:active .tile-link {
          transform: scale(0.95) translateZ(0);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4);
        }

        .icon-node {
          font-size: 32px;
          margin-bottom: 8px;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.4s ease;
          transform: translateZ(20px);
        }

        @media (min-width: 768px) {
          .icon-node {
            font-size: 42px;
          }
        }

        .tile-wrapper:hover .icon-node {
          color: white;
          transform: translateZ(40px) scale(1.1);
          filter: drop-shadow(0 0 10px var(--social-color));
        }

        .text-node {
          font-weight: 900;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: white;
          transform: translateZ(10px);
          opacity: 0.6;
          transition: all 0.4s ease;
        }

        @media (min-width: 768px) {
          .text-node {
            font-size: 10px;
            letter-spacing: 2px;
          }
        }

        .tile-wrapper:hover .text-node {
          opacity: 1;
          transform: translateZ(25px);
        }

        .label-node {
          position: absolute;
          bottom: 12px;
          font-size: 7px;
          font-weight: 900;
          color: var(--social-color);
          text-transform: uppercase;
          opacity: 0;
          transform: translateZ(5px) translateY(5px);
          transition: all 0.4s ease;
        }

        .tile-wrapper:hover .label-node {
          opacity: 1;
          transform: translateZ(15px) translateY(0);
        }
      `}</style>

      <PageHeader
        title="Digital Presence"
        description="Interact with the F.Co 3D social nodes. Every tile is a gateway to our official digital infrastructure."
        icon={<Share2 className="h-8 w-8" />}
        imageUrl="/assets/3d/social.png"
      />

      <Card className="glass-panel rounded-[3rem] border-white/5 overflow-hidden">
        <CardContent className="p-6 md:p-12 flex items-center justify-center min-h-[400px]">
            <div className="social-container">
                <div className="social-grid">
                {socialLinks.map((social, index) => (
                    <motion.div 
                        key={index} 
                        className="tile-wrapper" 
                        style={{ '--social-color': social.color } as React.CSSProperties}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                    >
                    <a href={social.href} target="_blank" rel="noopener noreferrer" className="tile-link">
                        <span className="icon-node">{social.icon}</span>
                        <span className="text-node">{social.name}</span>
                        <span className="label-node">{social.label}</span>
                    </a>
                    </motion.div>
                ))}
                </div>
            </div>
        </CardContent>
      </Card>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col items-center gap-4 mt-8 pb-12"
      >
          <div className="h-12 w-[1px] bg-gradient-to-b from-white to-transparent" />
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white">Secure Digital Ecosystem Node</p>
      </motion.div>
    </div>
  );
}



