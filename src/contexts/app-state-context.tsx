'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppStateContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [selectedYear, setSelectedYear] = useState<number>(2025);

  return (
    <AppStateContext.Provider value={{ selectedYear, setSelectedYear }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};



