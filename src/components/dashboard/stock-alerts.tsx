"use client";

import { useShallow } from "zustand/react/shallow";
import { Icon } from "@/lib/icon-map";
import { useProductStore } from "@/stores/use-product-store";
import StockAlertCard from "./stock-alert-card";

export default function StockAlerts() {
  const lowStockProducts = useProductStore(
    useShallow((s) =>
      s.products.filter((p) => p.isActive && p.stock <= p.minStock)
    )
  );

  if (lowStockProducts.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-label-xl font-bold flex items-center gap-2">
          <Icon name="error" size={24} className="text-danger-alert" />
          Stock Alerts
        </h3>
        <a href="/produk" className="text-secondary text-label-md font-medium hover:underline">
          Lihat Semua
        </a>
      </div>
      <div className="flex overflow-x-auto gap-4 hide-scrollbar pb-2">
        {lowStockProducts.map((product) => (
          <StockAlertCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
