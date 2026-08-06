'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type PrintOrientation = 'portrait' | 'landscape';

const STORAGE_KEY = 'fco-print-orientation';
const DEFAULT_ORIENTATION: PrintOrientation = 'portrait';

type PrintOrientationContextValue = {
  orientation: PrintOrientation;
  setOrientation: (value: PrintOrientation) => void;
  printDocument: () => void;
};

const PrintOrientationContext = createContext<PrintOrientationContextValue>({
  orientation: DEFAULT_ORIENTATION,
  setOrientation: () => undefined,
  printDocument: () => undefined,
});

export function PrintOrientationProvider({ children }: { children: React.ReactNode }) {
  const [orientation, setOrientationState] = useState<PrintOrientation>(DEFAULT_ORIENTATION);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'portrait' || stored === 'landscape') {
      setOrientationState(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(STORAGE_KEY, orientation);
    document.documentElement.setAttribute('data-print-orientation', orientation);
    document.body?.setAttribute('data-print-orientation', orientation);

    const styleId = 'fco-print-orientation-style';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    styleTag.textContent = `
      @page {
        size: A5 ${orientation};
        margin: 4mm;
      }
      @media print {
        html, body {
          width: 100% !important;
          height: auto !important;
          background: white !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          transform: none !important;
        }
      }
    `;
  }, [orientation]);

  const value = useMemo<PrintOrientationContextValue>(() => ({
    orientation,
    setOrientation: (value) => setOrientationState(value),
    printDocument: () => {
      if (typeof window === 'undefined') return;
      document.documentElement.setAttribute('data-print-orientation', orientation);
      document.body?.setAttribute('data-print-orientation', orientation);
      window.setTimeout(() => window.print(), 60);
    },
  }), [orientation]);

  return (
    <PrintOrientationContext.Provider value={value}>
      {children}
    </PrintOrientationContext.Provider>
  );
}

export function usePrintOrientation() {
  return useContext(PrintOrientationContext);
}
