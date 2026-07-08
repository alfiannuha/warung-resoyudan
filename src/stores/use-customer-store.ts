import { create } from "zustand";
import type { Customer } from "@/types";
import { generateId } from "@/lib/formatters";
import { mockCustomers } from "@/data/mock/customers";

interface CustomerStore {
  customers: Customer[];
  addCustomer: (c: Omit<Customer, "id" | "createdAt" | "updatedAt">) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  getCustomerById: (id: string) => Customer | undefined;
  getDebtors: () => Customer[];
  getAllCustomers: () => Customer[];
  updateDebt: (id: string, delta: number) => void;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [...mockCustomers],

  addCustomer: (data) => {
    const now = new Date().toISOString();
    set((s) => ({
      customers: [
        ...s.customers,
        { ...data, id: generateId(), createdAt: now, updatedAt: now },
      ],
    }));
  },

  updateCustomer: (id, data) => {
    set((s) => ({
      customers: s.customers.map((c) =>
        c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
      ),
    }));
  },

  getCustomerById: (id) => get().customers.find((c) => c.id === id),

  getDebtors: () => get().customers.filter((c) => c.currentDebt > 0),

  getAllCustomers: () => get().customers,

  updateDebt: (id, delta) => {
    set((s) => ({
      customers: s.customers.map((c) =>
        c.id === id
          ? {
              ...c,
              currentDebt: Math.max(0, c.currentDebt + delta),
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    }));
  },
}));
