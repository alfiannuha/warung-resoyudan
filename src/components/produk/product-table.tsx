"use client";

import { useState } from "react";
import { Icon } from "@/lib/icon-map";
import { useProductStore } from "@/stores/use-product-store";
import ProductRow from "./product-row";

export default function ProductTable() {
  const [search, setSearch] = useState("");
  const products = useProductStore((s) => s.products);
  const allActive = products.filter((p) => p.isActive);
  const lowStockCount = allActive.filter((p) => p.stock <= p.minStock).length;

  const filtered = search.trim()
    ? allActive.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : allActive;

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="relative w-full">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-10 pr-4 bg-white border border-border-standard rounded-lg focus:border-secondary focus:ring-0 text-body-md transition-all outline-none"
          placeholder="Cari nama produk..."
          type="text"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-border-standard p-4 rounded-xl flex flex-col gap-1">
          <span className="text-on-surface-variant text-label-md font-medium">Total Produk</span>
          <span className="text-numeric-display font-bold text-primary">{allActive.length}</span>
        </div>
        <div className="bg-white border border-border-standard p-4 rounded-xl flex flex-col gap-1">
          <span className="text-on-surface-variant text-label-md font-medium">Stok Menipis</span>
          <span className="text-numeric-display font-bold text-danger-alert">{lowStockCount}</span>
        </div>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-label-md text-outline uppercase tracking-wider font-medium">Daftar Produk</span>
        </div>
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant/50">
              <Icon name="inventory_2" size={48} className="block mb-2 mx-auto" />
              <p>Tidak ada produk</p>
            </div>
          ) : (
            filtered.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
