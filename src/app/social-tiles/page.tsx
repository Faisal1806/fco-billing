'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FaFacebookF, FaTwitter, FaTiktok, FaInstagram } from 'react-icons/fa';
import PageHeader from '@/components/PageHeader';
import { GitBranch } from 'lucide-react';

export default function SocialTilesPage() {
  const socialLinks = [
    { 
        name: 'Facebook', 
        icon: <FaFacebookF />, 
        href: 'https://www.facebook.com/share/14WtZoPPVoZ/', 
        color: '#1877F2' 
    },
    { 
        name: 'Twitter', 
        icon: <FaTwitter />, 
        href: 'https://twitter.com/fco_apples', 
        color: '#1DA1F2' 
    },
    { 
        name: 'TikTok', 
        icon: <FaTiktok />, 
        href: 'https://tiktok.com/@fco_apples', 
        color: '#FFFFFF' 
    },
    { 
        name: 'Instagram', 
        icon: <FaInstagram />, 
        href: 'https://instagram.com/fco_apples', 
        color: '#E4405F' 
    },
  ];

  return (
    <div className="space-y-6">
       <style jsx>{`
        .social-tiles-container {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .social-tile {
          position: relative;
          width: 140px;
          height: 140px;
          perspective: 1000px;
        }
        .social-tile a {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          color: #fff;
          text-decoration: none;
          font-weight: 900;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
          border-radius: 24px;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          transform-style: preserve-3d;
          box-shadow: 0 15px 35px rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.05);
        }
        /* The 3D Depth Layer */
        .social-tile a::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--social-color);
          border-radius: 24px;
          transform: translateZ(-12px);
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          opacity: 0.3;
        }
        .social-tile a:hover {
          transform: translateY(8px) rotateX(15deg);
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--social-color);
          box-shadow: 0 5px 15px rgba(0,0,0,0.4);
        }
        .social-tile a:hover::before {
          transform: translateZ(-6px);
          opacity: 0.8;
          box-shadow: 0 0 30px var(--social-color);
        }
        .social-tile a:active {
          transform: translateY(12px) rotateX(0deg);
          box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        }
        .social-tile a:active::before {
          transform: translateZ(-2px);
        }
        .social-tile .icon {
          font-size: 40px;
          margin-bottom: 12px;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          color: rgba(255,255,255,0.6);
        }
        .social-tile a:hover .icon {
          transform: scale(1.2) translateZ(30px);
          color: var(--social-color);
          filter: drop-shadow(0 0 10px var(--social-color));
        }
      `}</style>

      <PageHeader
        title="3D Social Presence"
        description="Connect with the F.Co digital network. Click any tile to visit our official profiles and channel updates."
        icon={<GitBranch className="h-8 w-8" />}
        imageUrl="/assets/3d/social.png"
      />

      <Card className="glass-panel rounded-[4rem] border-white/5 overflow-hidden">
        <CardContent className="p-20 py-32 flex items-center justify-center min-h-[500px]">
            <ul className="social-tiles-container flex flex-wrap gap-16 justify-center">
              {socialLinks.map((social, index) => (
                <li key={index} className="social-tile" style={{ '--social-color': social.color } as React.CSSProperties}>
                  <a href={social.href} target="_blank" rel="noopener noreferrer">
                    <span className="icon">{social.icon}</span>
                    <span>{social.name}</span>
                  </a>
                </li>
              ))}
            </ul>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-4 opacity-30 mt-12">
          <div className="h-12 w-[1px] bg-gradient-to-b from-white to-transparent" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Digital Infrastructure Node</p>
      </div>
    </div>
  );
}
