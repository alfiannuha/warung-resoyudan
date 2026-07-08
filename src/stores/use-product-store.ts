import { create } from "zustand";
import type { Product } from "@/types";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createAuditLog } from "@/lib/audit-log";

interface ProductStore {
  products: Product[];
  loading: boolean;
  initialized: boolean;
  searchQuery: string;
  selectedCategory: string;
  loadProducts: () => () => void;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (cat: string) => void;
  getFilteredProducts: () => Product[];
  getProductById: (id: string) => Product | undefined;
  findProductByBarcode: (barcode: string) => Product | undefined;
  getLowStockProducts: () => Product[];
  addProduct: (
    p: Omit<Product, "id" | "createdAt" | "updatedAt">,
  ) => Promise<string>;
  updateProduct: (
    id: string,
    data: Partial<Product>,
  ) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  quickAddStock: (id: string, qty: number) => Promise<void>;
  reduceStock: (id: string, qty: number) => Promise<boolean>;
}

const productsCollection = collection(db, "products");
const productsQuery = query(productsCollection, orderBy("createdAt", "desc"));

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  loading: true,
  initialized: false,
  searchQuery: "",
  selectedCategory: "Semua",

  loadProducts: () => {
    const unsub = onSnapshot(
      productsQuery,
      (snapshot) => {
        const products = snapshot.docs.map(
          (d) =>
            ({
              id: d.id,
              ...d.data(),
            }) as Product,
        );
        set({ products, loading: false, initialized: true });
      },
      () => {
        set({ loading: false });
      },
    );
    return unsub;
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),

  getFilteredProducts: () => {
    const { products, searchQuery, selectedCategory } = get();
    let filtered = products.filter((p) => p.isActive);
    const q = searchQuery.toLowerCase();
    if (q) filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
    if (selectedCategory !== "Semua")
      filtered = filtered.filter((p) => p.category === selectedCategory);
    return filtered;
  },

  getProductById: (id) => get().products.find((p) => p.id === id),

  findProductByBarcode: (barcode) =>
    get().products.find((p) => p.barcode === barcode && p.isActive),

  getLowStockProducts: () =>
    get().products.filter((p) => p.isActive && p.stock <= p.minStock),

  addProduct: async (data) => {
    const docRef = await addDoc(productsCollection, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await createAuditLog({
      action: "create",
      entity: "product",
      entityId: docRef.id,
      description: `Menambahkan produk "${data.name}"`,
    });

    return docRef.id;
  },

  updateProduct: async (id, data) => {
    await updateDoc(doc(productsCollection, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });

    const product = get().products.find((p) => p.id === id);
    await createAuditLog({
      action: "update",
      entity: "product",
      entityId: id,
      description: `Mengubah produk "${product?.name || id}"`,
    });
  },

  deleteProduct: async (id) => {
    const product = get().products.find((p) => p.id === id);
    await deleteDoc(doc(productsCollection, id));

    await createAuditLog({
      action: "delete",
      entity: "product",
      entityId: id,
      description: `Menghapus produk "${product?.name || id}"`,
    });
  },

  quickAddStock: async (id, qty) => {
    const ref = doc(productsCollection, id);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) return;
      const current = snap.data().stock ?? 0;
      transaction.update(ref, {
        stock: current + qty,
        updatedAt: serverTimestamp(),
      });
    });
  },

  reduceStock: async (id, qty) => {
    try {
      await runTransaction(db, async (transaction) => {
        const ref = doc(productsCollection, id);
        const snap = await transaction.get(ref);
        if (!snap.exists()) throw new Error("Produk tidak ditemukan");
        const current = snap.data().stock ?? 0;
        if (current < qty) throw new Error("Stok tidak mencukupi");
        transaction.update(ref, {
          stock: current - qty,
          updatedAt: serverTimestamp(),
        });
      });
      return true;
    } catch {
      return false;
    }
  },
}));
