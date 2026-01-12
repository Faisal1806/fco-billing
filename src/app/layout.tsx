// src/app/layout.tsx
import "./globals.css";
import { LanguageProvider } from "@/contexts/language-context";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { FirebaseClientProvider } from "@/firebase";
import { AppStateProvider } from "@/contexts/app-state-context";

export const metadata = {
  title: "F.Co Billing System",
  description: "Firdous Ahmad & Company",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <FirebaseClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AppStateProvider>
              <LanguageProvider>
                  {children}
                <Toaster />
              </LanguageProvider>
            </AppStateProvider>
          </ThemeProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
