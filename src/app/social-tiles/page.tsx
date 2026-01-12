'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FaFacebookF, FaTwitter, FaTiktok, FaInstagram } from 'react-icons/fa';
import PageHeader from '@/components/PageHeader';
import { GitBranch } from 'lucide-react';

export default function SocialTilesPage() {
  const socialLinks = [
    { name: 'Facebook', icon: <FaFacebookF />, href: 'https://facebook.com' },
    { name: 'Twitter', icon: <FaTwitter />, href: 'https://twitter.com' },
    { name: 'TikTok', icon: <FaTiktok />, href: 'https://tiktok.com' },
    { name: 'Instagram', icon: <FaInstagram />, href: 'https://instagram.com' },
  ];

  return (
    <div className="space-y-6">
       <PageHeader
        title="3D Social Tiles"
        description="A demonstration of 3D-style social media links created with CSS pseudo-elements for a tactile, press-down effect on hover."
        icon={<GitBranch className="h-8 w-8" />}
        imageUrl="/assets/3d/social.png"
      />
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center bg-muted/40 p-10 rounded-lg min-h-[300px]">
            <ul className="social-tiles-container flex flex-wrap gap-8 justify-center">
              {socialLinks.map((social, index) => (
                <li key={index} className={`social-tile tile-${index + 1}`}>
                  <a href={social.href} target="_blank" rel="noopener noreferrer">
                    <i className="icon">{social.icon}</i>
                    {social.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
