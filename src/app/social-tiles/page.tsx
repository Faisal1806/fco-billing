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
        .social-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 2rem;
          width: 100%;
          max-width: 1000px;
          perspective: 2000px;
          place-items: center;
        }

        @media (min-width: 640px) {
          .social-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 3rem;
          }
        }

        @media (min-width: 1024px) {
          .social-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 4rem;
          }
        }

        .tile-wrapper {
          position: relative;
          width: 140px;
          height: 140px;
          transform-style: preserve-3d;
        }

        @media (min-width: 768px) {
          .tile-wrapper {
            width: 180px;
            height: 180px;
          }
        }

        .tile-link {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(15px);
          border-radius: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
          transform-style: preserve-3d;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        /* 3D Depth Layer */
        .tile-link::after {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--social-color);
          border-radius: 32px;
          transform: translateZ(-20px);
          filter: brightness(0.4);
          transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
          opacity: 0.4;
        }

        /* Hover States */
        .tile-wrapper:hover .tile-link {
          transform: translateZ(30px) rotateX(10deg) rotateY(-10deg);
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--social-color);
          box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.8),
                      0 0 30px var(--social-color);
        }

        .tile-wrapper:hover .tile-link::after {
          transform: translateZ(-10px);
          opacity: 0.8;
          filter: brightness(0.6);
        }

        /* Active/Press State */
        .tile-wrapper:active .tile-link {
          transform: translateZ(-5px) rotateX(0deg) rotateY(0deg);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
        }

        .tile-wrapper:active .tile-link::after {
          transform: translateZ(-2px);
          opacity: 1;
        }

        .icon-node {
          font-size: 42px;
          margin-bottom: 8px;
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
          transform: translateZ(20px);
          filter: drop-shadow(0 5px 15px rgba(0,0,0,0.3));
        }

        @media (min-width: 768px) {
          .icon-node {
            font-size: 52px;
            margin-bottom: 12px;
          }
        }

        .tile-wrapper:hover .icon-node {
          color: var(--social-color);
          transform: translateZ(50px) scale(1.1);
          filter: drop-shadow(0 0 20px var(--social-color));
        }

        .text-node {
          font-weight: 900;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: white;
          transform: translateZ(15px);
          opacity: 0.7;
          transition: all 0.5s ease;
        }

        @media (min-width: 768px) {
          .text-node {
            font-size: 11px;
            letter-spacing: 3px;
          }
        }

        .tile-wrapper:hover .text-node {
          opacity: 1;
          letter-spacing: 4px;
          transform: translateZ(35px);
        }

        .label-node {
          position: absolute;
          bottom: 16px;
          font-size: 7px;
          font-weight: 900;
          color: var(--social-color);
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0;
          transform: translateZ(10px) translateY(10px);
          transition: all 0.5s ease;
        }

        @media (min-width: 768px) {
          .label-node {
            bottom: 24px;
            font-size: 8px;
          }
        }

        .tile-wrapper:hover .label-node {
          opacity: 1;
          transform: translateZ(25px) translateY(0);
        }
      `}</style>

      <PageHeader
        title="Digital Presence"
        description="Interact with the F.Co 3D social nodes. Every tile is a gateway to our official digital infrastructure."
        icon={<Share2 className="h-8 w-8" />}
        imageUrl="/assets/3d/social.png"
      />

      <Card className="glass-panel rounded-[3rem] md:rounded-[4rem] border-white/5 overflow-hidden">
        <CardContent className="p-8 md:p-20 py-20 md:py-40 flex items-center justify-center min-h-[500px]">
            <div className="social-grid">
              {socialLinks.map((social, index) => (
                <motion.div 
                    key={index} 
                    className="tile-wrapper" 
                    style={{ '--social-color': social.color } as React.CSSProperties}
                    initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.8, type: 'spring' }}
                >
                  <a href={social.href} target="_blank" rel="noopener noreferrer" className="tile-link">
                    <span className="icon-node">{social.icon}</span>
                    <span className="text-node">{social.name}</span>
                    <span className="label-node">{social.label}</span>
                  </a>
                </motion.div>
              ))}
            </div>
        </CardContent>
      </Card>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1 }}
        className="flex flex-col items-center gap-4 mt-12 pb-12"
      >
          <div className="h-16 w-[1px] bg-gradient-to-b from-white to-transparent" />
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white">Hyper-Spatial Digital Node</p>
      </motion.div>
    </div>
  );
}
