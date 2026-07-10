import { create } from "zustand";
import type { CartItem, Product, PaymentMethod } from "@/types";

interface CartStore {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  selectedCustomerId: string | null;
  lastAddedItemId: string | null;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setCustomer: (id: string | null) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  paymentMethod: "cash",
  selectedCustomerId: null,
  lastAddedItemId: null,

  addToCart: (product) => {
    const existing = get().items.find(
      (item) => item.productId === product.id
    );
    if (existing) {
      get().updateQuantity(product.id, existing.quantity + 1);
      set({ lastAddedItemId: product.id });
      setTimeout(() => {
        const current = get().lastAddedItemId;
        if (current === product.id) set({ lastAddedItemId: null });
      }, 600);
      return;
    }
    const newItem: CartItem = {
      productId: product.id,
      name: product.name,
      quantity: 1,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      subtotal: product.sellPrice,
      profit: product.sellPrice - product.buyPrice,
    };
    set((s) => ({ items: [...s.items, newItem], lastAddedItemId: product.id }));
    setTimeout(() => {
      const current = get().lastAddedItemId;
      if (current === product.id) set({ lastAddedItemId: null });
    }, 600);
  },

  removeFromCart: (productId) => {
    set((s) => ({
      items: s.items.filter((i) => i.productId !== productId),
    }));
  },

  updateQuantity: (productId, qty) => {
    if (qty <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set((s) => ({
      items: s.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: qty,
              subtotal: item.sellPrice * qty,
              profit: (item.sellPrice - item.buyPrice) * qty,
            }
          : item
      ),
    }));
  },

  setPaymentMethod: (method) => {
    set({ paymentMethod: method });
  },

  setCustomer: (id) => set({ selectedCustomerId: id }),

  clearCart: () =>
    set({ items: [], paymentMethod: "cash", selectedCustomerId: null }),
}));
