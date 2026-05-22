
// components/DocumentLayout.tsx
import React from 'react';
import { Logo } from './logo';

type DocType = 'watak' | 'bill' | 'challan' | 'receipt' | 'pesticide-bill';

interface Props {
  type: DocType;
  children: React.ReactNode;
}

const themes: Record<DocType, string> = {
  watak: 'bg-gradient-to-r from-green-500 to-blue-500',
  bill: 'bg-gradient-to-r from-red-500 to-orange-500',
  challan: 'bg-gradient-to-r from-purple-500 to-pink-500',
  receipt: 'bg-gradient-to-r from-indigo-500 to-cyan-500',
  'pesticide-bill': 'bg-gradient-to-r from-yellow-500 to-lime-500',
};

export default function DocumentLayout({ type, children }: Props) {
  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-6 font-sans text-gray-900 dark:text-gray-800 print:m-0 print:p-0 bg-gray-100 dark:bg-gray-800`}
    >
      <div className="w-full max-w-3xl print:w-full">
        {/* Header with gradient + logo */}
        <div
          className={`w-full rounded-t-2xl shadow-md text-white p-4 text-center ${themes[type]}`}
        >
          <Logo className="mx-auto mb-2 h-20 w-20" />
          <h1 className="text-xl font-bold uppercase tracking-wider">
            {type.replace('-', ' ').toUpperCase()}
          </h1>
        </div>

        {/* Body */}
        <div className="bg-white shadow-lg p-6 w-full print:shadow-none print:border-none">
          {children}
        </div>

        {/* Footer */}
        <div className="bg-white rounded-b-2xl shadow-lg w-full p-4 text-sm text-gray-500 text-center border-t print:shadow-none">
          Your Satisfaction is Our Success – Subject to Sopore Jurisdiction Only
        </div>
      </div>
    </div>
  );
}

