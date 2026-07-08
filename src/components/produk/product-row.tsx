"use client";

import type { Product } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import StockBadge from "./stock-badge";
import { useProductStore } from "@/stores/use-product-store";

interface Props {
  product: Product;
}

export default function ProductRow({ product }: Props) {
  const quickAddStock = useProductStore((s) => s.quickAddStock);
  const isLowStock = product.stock <= 5 && product.stock > 0;

  return (
    <div className="bg-white border border-border-standard rounded-xl p-4 flex flex-col gap-3 transition-all active:scale-[0.99]">
      <div className="flex justify-between items-start">
        <div className="flex flex-col min-w-0">
          <span className="text-label-xl font-bold text-on-surface truncate">{product.name}</span>
        </div>
        <StockBadge stock={product.stock} minStock={product.minStock} />
      </div>

      <div className="flex justify-between items-center py-2 border-y border-border-standard/50">
        <div className="flex flex-col">
          <span className="text-[12px] text-outline font-medium">Harga Beli</span>
          <span className="text-[16px] font-bold text-on-surface-variant">{formatCurrency(product.buyPrice)}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[12px] text-outline font-medium">Harga Jual</span>
          <span className="text-body-lg font-bold text-secondary">{formatCurrency(product.sellPrice)}</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-1">
        <div className="flex flex-col">
          <span className="text-[12px] text-outline font-medium">Stok Saat Ini</span>
          <span className={`text-numeric-display font-bold ${isLowStock ? "text-danger-alert" : "text-primary"}`}>
            {product.stock} <span className="text-[14px] text-outline font-normal">pcs</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => quickAddStock(product.id, -1)}
            disabled={product.stock <= 0}
            className="touch-target w-12 h-12 rounded-lg border border-border-standard flex items-center justify-center text-primary active:bg-surface-container transition-colors disabled:opacity-30"
            aria-label="Kurangi stok"
          >
            <span className="text-[20px] font-bold leading-none">−</span>
          </button>
          <button
            onClick={() => quickAddStock(product.id, 1)}
            className="touch-target w-12 h-12 rounded-lg bg-primary text-white flex items-center justify-center active:opacity-80 transition-opacity"
            aria-label="Tambah stok"
          >
            <span className="text-[20px] font-bold leading-none">+</span>
          </button>
        </div>
      </div>
    </div>
  );
}
