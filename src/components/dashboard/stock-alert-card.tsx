"use client";

import type { Product } from "@/types";

interface Props {
  product: Product;
}

export default function StockAlertCard({ product }: Props) {
  const ratio = Math.min(1, product.stock / product.minStock);
  const isCritical = product.stock <= 2;
  const barColor = isCritical ? "bg-danger-alert" : "bg-warning-debt";

  return (
    <div className="min-w-[160px] bg-surface-container-lowest border border-border-standard p-4 rounded-xl space-y-2">
      <div className="text-body-md font-bold truncate">{product.name}</div>
      <div className="flex items-baseline gap-1">
        <span className={`font-numeric-display text-numeric-display ${isCritical ? "text-danger-alert" : "text-warning-debt"}`}>
          {product.stock}
        </span>
        <span className="text-on-surface-variant text-label-md font-medium">
          / {product.minStock} pcs
        </span>
      </div>
      <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
        <div
          className={`${barColor} h-full rounded-full`}
          style={{ width: `${ratio * 100}%` }}
        ></div>
      </div>
    </div>
  );
}
