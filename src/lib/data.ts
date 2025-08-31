

export type Product = {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
};

export type Sale = {
  id: string;
  customer: {
    name: string;
    avatar: string;
  };
  email: string;
  amount: number;
  timestamp: Date;
};

export type Expense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: Date;
};

// This type is kept for historical reference if needed, but new data comes from Firestore
export type WatakEntry = {
    id: string;
    date: Date;
    chNo: number;
    watakNo: number;
    khata: string;
    peti: number | string;
    daba: number | string;
    gross: number;
    soporExp: number;
    netSale: number;
    p?: string;
    amount: number;
  };


export const products: Product[] = [];

export const recentSales: Sale[] = [];

export const salesData: { date: string; sales: number }[] = [];

export const expenses: Expense[] = [];

// This is no longer used, as data is fetched directly from Firestore.
export const wataks: WatakEntry[] = [];
