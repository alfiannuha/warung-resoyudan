import { create } from "zustand";
import type { DebtPayment } from "@/types";
import { generateId } from "@/lib/formatters";
import { mockDebtPayments } from "@/data/mock/debt-payments";

interface DebtPaymentStore {
  payments: DebtPayment[];
  addPayment: (p: Omit<DebtPayment, "id">) => string;
  getPaymentsByCustomer: (customerId: string) => DebtPayment[];
}

export const useDebtPaymentStore = create<DebtPaymentStore>((set, get) => ({
  payments: [...mockDebtPayments],

  addPayment: (data) => {
    const id = generateId();
    const payment: DebtPayment = { ...data, id };
    set((s) => ({ payments: [...s.payments, payment] }));
    return id;
  },

  getPaymentsByCustomer: (customerId) =>
    get().payments.filter((p) => p.customerId === customerId),
}));
