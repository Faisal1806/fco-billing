
// src/app/layout.tsx
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { LanguageProvider } from "@/contexts/language-context";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
  title: "F.Co Billing System",
  description: "Firdous Ahmad & Company",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <LanguageProvider>
          <div className="flex min-h-screen bg-gray-900 text-white">
            <Sidebar />
            <main className="flex-1">
              <Header />
              <div className="p-6">{children}</div>
            </main>
          </div>
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
