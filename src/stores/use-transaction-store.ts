import { create } from "zustand";
import type { Transaction, DailyReport } from "@/types";
import { getTodayISO } from "@/lib/formatters";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createAuditLog } from "@/lib/audit-log";

interface TransactionStore {
  transactions: Transaction[];
  loading: boolean;
  initialized: boolean;
  loadTransactions: () => () => void;
  addTransaction: (
    t: Omit<Transaction, "id" | "createdAt">,
  ) => Promise<string>;
  getTodayTransactions: () => Transaction[];
  getTransactionsByDateRange: (
    start: string,
    end: string,
  ) => Transaction[];
  getTransactionsByCustomer: (customerId: string) => Transaction[];
  getDailyReport: (date: string) => DailyReport;
  getTopProducts: (
    start: string,
    end: string,
    limit?: number,
  ) => { name: string; qty: number; revenue: number }[];
}

const transactionsCollection = collection(db, "transactions");
const transactionsQuery = query(
  transactionsCollection,
  orderBy("createdAt", "desc"),
);

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  loading: true,
  initialized: false,

  loadTransactions: () => {
    const unsub = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        const transactions = snapshot.docs.map(
          (d) =>
            ({
              id: d.id,
              ...d.data(),
            }) as Transaction,
        );
        set({ transactions, loading: false, initialized: true });
      },
      () => {
        set({ loading: false });
      },
    );
    return unsub;
  },

  addTransaction: async (data) => {
    const docRef = await addDoc(transactionsCollection, {
      ...data,
      createdAt: serverTimestamp(),
    });

    await createAuditLog({
      action: "create",
      entity: "transaction",
      entityId: docRef.id,
      description: `Transaksi ${data.paymentMethod} sebesar ${data.totalAmount}`,
    });

    return docRef.id;
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
      t.date.startsWith(date),
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
