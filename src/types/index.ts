export interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  barcode: string | null;
  image_url: string | null;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PRODUCT_CATEGORIES = [
  "Makanan",
  "Minuman",
  "Sembako",
  "Kebutuhan Rumah",
] as const;

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  subtotal: number;
  profit: number;
}

export type PaymentMethod = "cash" | "kasbon" | "qris";
export type TransactionStatus = "paid" | "debt";
export type PaperWidth = 58 | 80;

export interface Transaction {
  id: string;
  date: string;
  items: CartItem[];
  totalAmount: number;
  totalProfit: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  customerId: string | null;
  createdAt: string;
  receiptNumber: string | null;
  amountPaid: number;
  change: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  currentDebt: number;
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  id: string;
  customerId: string;
  amount: number;
  paymentDate: string;
  notes: string;
}

export interface DailyReport {
  date: string;
  totalSales: number;
  totalProfit: number;
  totalCash: number;
  totalKasbon: number;
  transactionCount: number;
}

export type PeriodFilter = "today" | "week" | "month" | "custom";
