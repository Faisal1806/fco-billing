

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

export const wataks: WatakEntry[] = [];
