"use client";

import { Icon } from "@/lib/icon-map";
import { useProductStore } from "@/stores/use-product-store";

export default function SearchBar() {
  const searchQuery = useProductStore((s) => s.searchQuery);
  const setSearchQuery = useProductStore((s) => s.setSearchQuery);

  return (
    <div className="relative group mt-6">
      <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-secondary pointer-events-none" />
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full h-[56px] pl-12 pr-4 bg-white border border-border-standard rounded-xl focus:ring-0 focus:border-secondary text-body-lg outline-none transition-all placeholder:text-outline"
        placeholder="Cari Produk..."
        type="text"
      />
    </div>
  );
}
