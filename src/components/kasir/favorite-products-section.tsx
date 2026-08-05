"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useProductStore } from "@/stores/use-product-store";
import { useTransactionStore } from "@/stores/use-transaction-store";
import ProductCard from "./product-card";
import { Icon } from "@/lib/icon-map";
import { getTodayISO } from "@/lib/formatters";
import type { Product } from "@/types";

const MAX_VISIBLE = 20;

function getTopProducts(
  transactions: import("@/types").Transaction[],
  start: string,
  end: string,
  limit: number,
): { name: string; qty: number; revenue: number }[] {
  const startDate = new Date(start);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  const txns = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= startDate && d <= endDate;
  });
  const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
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
}

export default function FavoriteProductsSection() {
  const favorites = useProductStore(useShallow((s) => s.getFavoriteProducts()));
  const allProducts = useProductStore((s) => s.products);
  const transactions = useTransactionStore((s) => s.transactions);

  const today = getTodayISO();
  const topProducts = useMemo(
    () => getTopProducts(transactions, today, today, MAX_VISIBLE),
    [transactions, today],
  );

  const { bestSellers, items } = useMemo(() => {
    const favoriteIds = new Set(favorites.map((f) => f.id));
    const bs: Product[] = [];
    for (const tp of topProducts) {
      if (bs.length >= MAX_VISIBLE - favorites.length) break;
      const match = allProducts.find(
        (p) => p.name === tp.name && p.isActive && !favoriteIds.has(p.id),
      );
      if (match) {
        bs.push(match);
        favoriteIds.add(match.id);
      }
    }
    return { bestSellers: bs, items: [...favorites, ...bs] };
  }, [favorites, topProducts, allProducts]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-4 sm:px-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md bg-warning/10 text-warning">
          <Icon name="star" size={16} fill="currentColor" />
        </span>
        <h2 className="text-label-xl font-bold text-on-surface">Produk Favorit</h2>
        {bestSellers.length > 0 && (
          <span className="text-caption font-normal text-on-surface-variant">
            {favorites.length} favorit · {bestSellers.length} terlaris
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div className="mt-6 border-t border-border-standard" />
    </div>
  );
}
