"use client";

import { formatCurrency } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";

interface TopProduct {
  name: string;
  qty: number;
  revenue: number;
}

interface Props {
  products: TopProduct[];
}

export default function TopProducts({ products }: Props) {
  if (products.length === 0) return null;

  return (
    <section className="space-y-4 pb-4">
      <h3 className="text-label-xl font-bold">Produk Terlaris</h3>
      <div className="space-y-3">
        {products.map((product, i) => (
          <div key={i} className="flex items-center justify-between p-3 border-b border-border-standard">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center shrink-0">
                <Icon name="inventory_2" size={24} className="text-outline" />
              </div>
              <div className="min-w-0">
                <p className="text-body-lg text-on-surface font-medium truncate">{product.name}</p>
                <p className="text-label-md text-on-surface-variant">{product.qty} terjual</p>
              </div>
            </div>
            <p className="text-label-xl font-bold text-on-surface shrink-0 ml-3">{formatCurrency(product.revenue)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
