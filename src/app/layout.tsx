
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Noto_Nastaliq_Urdu } from 'next/font/google';
import './globals.css';
import './print.css'; // Import print styles
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/contexts/language-context';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const urdu = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  variable: '--font-urdu',
});

export const metadata: Metadata = {
  title: 'F.Co Billing System',
  description: 'Bills, Wataks, Challans, Receipts with export + backup',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${urdu.variable} font-body antialiased`}
      >
        <LanguageProvider>
          {children}
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
