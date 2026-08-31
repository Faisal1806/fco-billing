'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type PrintOrientation = 'portrait' | 'landscape';

const STORAGE_KEY = 'fco-print-orientation';
const DEFAULT_ORIENTATION: PrintOrientation = 'portrait';

type PrintOrientationContextValue = {
  orientation: PrintOrientation;
  setOrientation: (value: PrintOrientation) => void;
  printDocument: () => void;
};

const PrintOrientationContext =
  createContext<PrintOrientationContextValue>({
    orientation: DEFAULT_ORIENTATION,
    setOrientation: () => undefined,
    printDocument: () => undefined,
  });

export function PrintOrientationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [orientation, setOrientationState] =
    useState<PrintOrientation>(DEFAULT_ORIENTATION);

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

    document.documentElement.setAttribute(
      'data-print-orientation',
      orientation
    );

    document.body.setAttribute(
      'data-print-orientation',
      orientation
    );
  }, [orientation]);

  const value = useMemo<PrintOrientationContextValue>(
    () => ({
      orientation,

      setOrientation: (value) => {
        setOrientationState(value);
      },

      printDocument: () => {
        if (typeof window === 'undefined') return;

        document.documentElement.setAttribute(
          'data-print-orientation',
          orientation
        );

        document.body.setAttribute(
          'data-print-orientation',
          orientation
        );

        window.setTimeout(() => {
          window.print();
        }, 100);
      },
    }),
    [orientation]
  );

  return (
    <PrintOrientationContext.Provider value={value}>
      {children}
    </PrintOrientationContext.Provider>
  );
}

export function usePrintOrientation() {
  return useContext(PrintOrientationContext);
}

