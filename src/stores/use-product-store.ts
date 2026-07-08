import { create } from "zustand";
import type { Product } from "@/types";
import { generateId } from "@/lib/formatters";
import { mockProducts } from "@/data/mock/products";

interface ProductStore {
  products: Product[];
  searchQuery: string;
  selectedCategory: string;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (cat: string) => void;
  getFilteredProducts: () => Product[];
  getProductById: (id: string) => Product | undefined;
  findProductByBarcode: (barcode: string) => Product | undefined;
  getLowStockProducts: () => Product[];
  addProduct: (
    p: Omit<Product, "id" | "createdAt" | "updatedAt">
  ) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  quickAddStock: (id: string, qty: number) => void;
  reduceStock: (id: string, qty: number) => boolean;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [...mockProducts],
  searchQuery: "",
  selectedCategory: "Semua",

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

  addProduct: (data) => {
    const now = new Date().toISOString();
    const product: Product = {
      ...data,
      id: generateId(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({ products: [...s.products, product] }));
  },

  updateProduct: (id, data) => {
    set((s) => ({
      products: s.products.map((p) =>
        p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
      ),
    }));
  },

  deleteProduct: (id) => {
    set((s) => ({
      products: s.products.filter((p) => p.id !== id),
    }));
  },

  quickAddStock: (id, qty) => {
    set((s) => ({
      products: s.products.map((p) =>
        p.id === id
          ? { ...p, stock: p.stock + qty, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
  },

  reduceStock: (id, qty) => {
    const product = get().products.find((p) => p.id === id);
    if (!product || product.stock < qty) return false;
    set((s) => ({
      products: s.products.map((p) =>
        p.id === id
          ? { ...p, stock: p.stock - qty, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
    return true;
  },
}));
