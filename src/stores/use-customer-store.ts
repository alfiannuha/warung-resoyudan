import { create } from "zustand";
import type { Customer } from "@/types";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CustomerStore {
  customers: Customer[];
  loading: boolean;
  initialized: boolean;
  loadCustomers: () => () => void;
  addCustomer: (
    c: Omit<Customer, "id" | "createdAt" | "updatedAt">,
  ) => Promise<string>;
  updateCustomer: (
    id: string,
    data: Partial<Customer>,
  ) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
  getDebtors: () => Customer[];
  getAllCustomers: () => Customer[];
  updateDebt: (id: string, delta: number) => Promise<void>;
}

const customersCollection = collection(db, "customers");
const customersQuery = query(
  customersCollection,
  orderBy("createdAt", "desc"),
);

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  loading: true,
  initialized: false,

  loadCustomers: () => {
    const unsub = onSnapshot(
      customersQuery,
      (snapshot) => {
        const customers = snapshot.docs.map(
          (d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt,
            } as Customer;
          },
        );
        set({ customers, loading: false, initialized: true });
      },
      () => {
        set({ loading: false });
      },
    );
    return unsub;
  },

  addCustomer: async (data) => {
    const docRef = await addDoc(customersCollection, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  updateCustomer: async (id, data) => {
    await updateDoc(doc(customersCollection, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  getCustomerById: (id) => get().customers.find((c) => c.id === id),

  getDebtors: () => get().customers.filter((c) => c.currentDebt > 0),

  getAllCustomers: () => get().customers,

  updateDebt: async (id, delta) => {
    const ref = doc(customersCollection, id);
    const customer = get().customers.find((c) => c.id === id);
    if (!customer) return;
    const newDebt = Math.max(0, customer.currentDebt + delta);
    await updateDoc(ref, {
      currentDebt: newDebt,
      updatedAt: serverTimestamp(),
    });
  },
}));
