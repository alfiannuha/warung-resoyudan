import { create } from "zustand";
import type { Transaction, DailyReport } from "@/types";
import { generateId, getTodayISO } from "@/lib/formatters";
import { mockTransactions } from "@/data/mock/transactions";

interface TransactionStore {
  transactions: Transaction[];
  addTransaction: (
    t: Omit<Transaction, "id" | "createdAt">
  ) => Transaction;
  getTodayTransactions: () => Transaction[];
  getTransactionsByDateRange: (
    start: string,
    end: string
  ) => Transaction[];
  getTransactionsByCustomer: (customerId: string) => Transaction[];
  getDailyReport: (date: string) => DailyReport;
  getTopProducts: (
    start: string,
    end: string,
    limit?: number
  ) => { name: string; qty: number; revenue: number }[];
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [...mockTransactions],

  addTransaction: (data) => {
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...data,
      id: generateId(),
      createdAt: now,
    };
    set((s) => ({ transactions: [...s.transactions, transaction] }));
    return transaction;
  },

  getTodayTransactions: () => {
    const today = getTodayISO();
    return get().transactions.filter((t) => t.date.startsWith(today));
  },

  getTransactionsByDateRange: (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
    return get().transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= startDate && d <= endDate;
    });
  },

  getTransactionsByCustomer: (customerId) =>
    get().transactions.filter((t) => t.customerId === customerId),

  getDailyReport: (date) => {
    const dayTx = get().transactions.filter((t) =>
      t.date.startsWith(date)
    );
    return {
      date,
      totalSales: dayTx.reduce((sum, t) => sum + t.totalAmount, 0),
      totalProfit: dayTx.reduce((sum, t) => sum + t.totalProfit, 0),
      totalCash: dayTx
        .filter((t) => t.paymentMethod === "cash")
        .reduce((sum, t) => sum + t.totalAmount, 0),
      totalKasbon: dayTx
        .filter((t) => t.paymentMethod === "kasbon")
        .reduce((sum, t) => sum + t.totalAmount, 0),
      transactionCount: dayTx.length,
    };
  },

  getTopProducts: (start, end, limit = 5) => {
    const txns = get().getTransactionsByDateRange(start, end);
    const productMap = new Map<
      string,
      { name: string; qty: number; revenue: number }
    >();
    txns.forEach((t) => {
      t.items.forEach((item) => {
        const existing = productMap.get(item.productId);
        if (existing) {
          existing.qty += item.quantity;
          existing.revenue += item.subtotal;
        } else {
          productMap.set(item.productId, {
            name: item.name,
            qty: item.quantity,
            revenue: item.subtotal,
          });
        }
      });
    });
    return Array.from(productMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, limit);
  },
}));
