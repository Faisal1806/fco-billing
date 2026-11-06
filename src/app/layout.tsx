// src/app/layout.tsx
import "./globals.css";
import { LanguageProvider } from "@/contexts/language-context";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AppStateProvider } from "@/contexts/app-state-context";
import { StorageSyncProvider } from "@/components/storage-sync-provider";
import { SyncStatusBadge } from "@/components/sync-status-badge";
import { PrintOrientationProvider } from "@/components/print-orientation-provider";

export const metadata = {
  title: "F.Co Billing System",
  description: "Firdous Ahmad & Company",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppStateProvider>
            <LanguageProvider>
              <StorageSyncProvider />
              <PrintOrientationProvider>
                {children}
              </PrintOrientationProvider>
              <SyncStatusBadge />
              <Toaster />
            </LanguageProvider>
          </AppStateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}



