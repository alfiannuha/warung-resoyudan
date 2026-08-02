import { create } from "zustand";
import type { CapitalTransaction, CapitalType } from "@/types";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createAuditLog } from "@/lib/audit-log";

const CAPITAL_TYPE_LABELS: Record<CapitalType, string> = {
  initial: "Modal Awal",
  addition: "Penambahan Modal",
  withdrawal: "Penarikan Modal",
};

interface CapitalStore {
  capitalTransactions: CapitalTransaction[];
  loading: boolean;
  initialized: boolean;
  loadCapitalTransactions: () => () => void;
  addCapitalTransaction: (
    data: Omit<CapitalTransaction, "id" | "createdAt" | "updatedAt">,
  ) => Promise<string>;
  updateCapitalTransaction: (
    id: string,
    data: Partial<CapitalTransaction>,
  ) => Promise<void>;
  deleteCapitalTransaction: (id: string) => Promise<void>;
  getCurrentCapital: () => number;
  hasInitialCapital: () => boolean;
}

const capitalCollection = collection(db, "capital_transactions");
const capitalQuery = query(capitalCollection, orderBy("transactionDate", "desc"));

export const useCapitalStore = create<CapitalStore>((set, get) => ({
  capitalTransactions: [],
  loading: true,
  initialized: false,

  loadCapitalTransactions: () => {
    const unsub = onSnapshot(
      capitalQuery,
      (snapshot) => {
        const capitalTransactions = snapshot.docs.map(
          (d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt,
            } as CapitalTransaction;
          },
        );
        set({ capitalTransactions, loading: false, initialized: true });
      },
      () => {
        set({ loading: false });
      },
    );
    return unsub;
  },

  addCapitalTransaction: async (data) => {
    const docRef = await addDoc(capitalCollection, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await createAuditLog({
      action: "create",
      entity: "capital",
      entityId: docRef.id,
      description: `Mencatat ${CAPITAL_TYPE_LABELS[data.type].toLowerCase()} "${data.capitalNumber}" sebesar ${data.amount}`,
    });

    return docRef.id;
  },

  updateCapitalTransaction: async (id, data) => {
    await updateDoc(doc(capitalCollection, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });

    const type =
      data.type ??
      get().capitalTransactions.find((c) => c.id === id)?.type;
    await createAuditLog({
      action: "update",
      entity: "capital",
      entityId: id,
      description: `Mengubah transaksi modal ${type ? CAPITAL_TYPE_LABELS[type].toLowerCase() : id}`,
    });
  },

  deleteCapitalTransaction: async (id) => {
    const capital = get().capitalTransactions.find((c) => c.id === id);
    await deleteDoc(doc(capitalCollection, id));

    await createAuditLog({
      action: "delete",
      entity: "capital",
      entityId: id,
      description: `Menghapus transaksi modal "${capital?.capitalNumber || id}"`,
    });
  },

  getCurrentCapital: () => {
    return get().capitalTransactions.reduce((sum, t) => {
      if (t.type === "withdrawal") return sum - t.amount;
      return sum + t.amount;
    }, 0);
  },

  hasInitialCapital: () => {
    return get().capitalTransactions.some((t) => t.type === "initial");
  },
}));

export { CAPITAL_TYPE_LABELS };
