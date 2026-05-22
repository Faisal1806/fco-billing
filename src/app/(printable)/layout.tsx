import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Print View - F.Co',
  description: 'Printable document view for F.Co Billing System',
};

export default function PrintableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /**
   * IMPORTANT: In Next.js App Router, nested layouts must NOT include <html> or <body> tags
   * if they are already defined in a parent layout (like src/app/layout.tsx).
   * 
   * This printable layout inherits the root layout's providers (Firebase, Theme, etc.) 
   * but provides a clean, high-contrast container for document views.
   */
  return (
    <div className="min-h-screen bg-white text-black">
      {children}
    </div>
  );
}

