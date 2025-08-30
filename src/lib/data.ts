

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


export const products: Product[] = [
  { id: 'PROD001', name: 'Classic White T-Shirt', category: 'Apparel', stock: 150, price: 15.99 },
  { id: 'PROD002', name: 'Organic Blend Coffee', category: 'Groceries', stock: 80, price: 12.50 },
  { id: 'PROD003', name: 'Wireless Bluetooth Headphones', category: 'Electronics', stock: 45, price: 89.99 },
  { id: 'PROD004', name: 'Leather Bound Journal', category: 'Stationery', stock: 200, price: 25.00 },
  { id: 'PROD005', name: 'Stainless Steel Water Bottle', category: 'Home Goods', stock: 120, price: 20.00 },
];

export const recentSales: Sale[] = [
  { id: 'SALE001', customer: { name: 'Ayesha Khan', avatar: '/avatars/01.png' }, email: 'ayesha@example.com', amount: 47.97, timestamp: new Date(new Date().setDate(new Date().getDate() - 1))},
  { id: 'SALE002', customer: { name: 'Bilal Ahmed', avatar: '/avatars/02.png' }, email: 'bilal@example.com', amount: 89.99, timestamp: new Date(new Date().setDate(new Date().getDate() - 1))},
  { id: 'SALE003', customer: { name: 'Fatima Zahra', avatar: '/avatars/03.png' }, email: 'fatima@example.com', amount: 25.00, timestamp: new Date(new Date().setDate(new Date().getDate() - 2))},
  { id: 'SALE004', customer: { name: 'Usman Ali', avatar: '/avatars/04.png' }, email: 'usman@example.com', amount: 40.00, timestamp: new Date(new Date().setDate(new Date().getDate() - 3)) },
  { id: 'SALE005', customer: { name: 'Sana Iqbal', avatar: '/avatars/05.png' }, email: 'sana@example.com', amount: 37.50, timestamp: new Date(new Date().setDate(new Date().getDate() - 4)) },
];

export const salesData = [
  { date: 'Mon', sales: Math.floor(Math.random() * 2000) + 1000 },
  { date: 'Tue', sales: Math.floor(Math.random() * 2000) + 1000 },
  { date: 'Wed', sales: Math.floor(Math.random() * 2000) + 1000 },
  { date: 'Thu', sales: Math.floor(Math.random() * 2000) + 1000 },
  { date: 'Fri', sales: Math.floor(Math.random() * 2000) + 1000 },
  { date: 'Sat', sales: Math.floor(Math.random() * 2000) + 1000 },
  { date: 'Sun', sales: Math.floor(Math.random() * 2000) + 1000 },
];

export const expenses: Expense[] = [
    { id: 'EXP001', category: 'Utilities', description: 'Office electricity bill', amount: 150.00, date: new Date() },
    { id: 'EXP002', category: 'Transport', description: 'Fuel for delivery van', amount: 75.50, date: new Date(new Date().setDate(new Date().getDate() - 1)) },
    { id: 'EXP003', category: 'Rent', description: 'Warehouse rental for the month', amount: 1200.00, date: new Date(new Date().setDate(new Date().getDate() - 2)) },
    { id: 'EXP004', category: 'Supplies', description: 'Packaging materials', amount: 250.75, date: new Date(new Date().setDate(new Date().getDate() - 3)) },
    { id: 'EXP005', category: 'Utilities', description: 'Internet bill', amount: 60.00, date: new Date(new Date().setDate(new Date().getDate() - 4)) },
];

export const wataks: WatakEntry[] = [
  { id: 'WAT001', date: new Date('2023-07-10'), chNo: 1, watakNo: 803, khata: 'Samia Ayoub', peti: 'x', daba: 34, gross: 3580, soporExp: 2880, netSale: 2880, amount: 2880 },
  { id: 'WAT002', date: new Date('2023-08-03'), chNo: 2, watakNo: 818, khata: 'Samia Ayoub', peti: 19, daba: 10, gross: 9650, soporExp: 8160, netSale: 8160, amount: 11040 },
  { id: 'WAT003', date: new Date('2023-08-08'), chNo: 3, watakNo: 822, khata: 'Khan Ayoub', peti: 21, daba: 'x', gross: 9450, soporExp: 7930, netSale: 7930, amount: 18970 },
  { id: 'WAT004', date: new Date('2023-08-09'), chNo: 4, watakNo: 824, khata: 'Wood', peti: 20, daba: 'x', gross: 17250, soporExp: 14860, netSale: 14860, amount: 33830 },
  { id: 'WAT005', date: new Date('2023-08-08'), chNo: 5, watakNo: 823, khata: 'FW-CB, Dheli', peti: 'x', daba: 32, gross: 2560, soporExp: 1840, netSale: 1840, amount: 35670 },
  { id: 'WAT006', date: new Date('2023-08-12'), chNo: 6, watakNo: 831, khata: 'Roshna Ayoub', peti: 12, daba: 3, gross: 3120, soporExp: 2593, netSale: 2593, amount: 38263 },
  { id: 'WAT007', date: new Date('2023-08-17'), chNo: 7, watakNo: 836, khata: 'Roshna Ayoub', peti: 17, daba: 11, gross: 6420, soporExp: 5350, netSale: 5350, amount: 43613 },
  { id: 'WAT008', date: new Date('2023-09-14'), chNo: 8, watakNo: 863, khata: 'CB', peti: 58, daba: 'x', gross: 34600, soporExp: 29325, netSale: 29325, amount: 72938 },
];
