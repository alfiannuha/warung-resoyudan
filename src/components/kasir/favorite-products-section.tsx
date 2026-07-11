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
    return (
      <div className="px-container-padding py-6">
        <div className="text-center py-10 text-on-surface-variant/50 bg-surface-container rounded-xl">
          <Icon name="star_border" size={40} className="block mb-2 mx-auto" />
          <p className="text-body-md">Belum ada produk favorit.</p>
          <p className="text-label-md mt-1">
            Tandai produk favorit dari menu Produk.
          </p>
        </div>
        <hr className="mt-6 border-border-standard" />
      </div>
    );
  }

  return (
    <div className="px-container-padding py-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🔥</span>
        <h2 className="text-label-xl font-bold text-on-surface">
          Produk Favorit
        </h2>
        {bestSellers.length > 0 && (
          <span className="text-label-md text-outline font-normal">
            {favorites.length} favorit · {bestSellers.length} terlaris
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <hr className="mt-6 border-border-standard" />
    </div>
  );
}
