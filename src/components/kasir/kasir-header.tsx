"use client";

import { useUIStore } from "@/stores/use-ui-store";
import { useProductStore } from "@/stores/use-product-store";
import { PRODUCT_CATEGORIES } from "@/types";
import { Icon } from "@/lib/icon-map";

export default function KasirHeader() {
  const toggleSideNav = useUIStore((s) => s.toggleSideNav);
  const searchQuery = useProductStore((s) => s.searchQuery);
  const setSearchQuery = useProductStore((s) => s.setSearchQuery);
  const selectedCategory = useProductStore((s) => s.selectedCategory);
  const setSelectedCategory = useProductStore((s) => s.setSelectedCategory);

  return (
    <header className="bg-surface border-b border-border-standard">
      {/* Top row: hamburger + title (mobile only) */}
      <div className="flex items-center gap-3 px-container-padding h-touch-target-min">
        <button
          onClick={toggleSideNav}
          className="text-primary touch-target active:scale-95 transition-transform flex items-center justify-center"
          aria-label="Buka menu navigasi"
        >
          <Icon name="menu" />
        </button>
        <h1 className="text-headline-md-mobile font-bold text-on-surface md:hidden">
          Warung Resoyudan
        </h1>
      </div>

      {/* Search bar */}
      <div className="px-container-padding pb-3">
        <div className="relative group">
          <Icon
            name="search"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-secondary pointer-events-none"
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[52px] pl-12 pr-4 bg-surface-container border border-border-standard rounded-xl focus:ring-0 focus:border-secondary text-body-md outline-none transition-all placeholder:text-outline"
            placeholder="Cari produk atau scan barcode..."
            type="text"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="px-container-padding pb-3 overflow-x-auto hide-scrollbar">
        <div className="flex gap-2">
          {PRODUCT_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-label-md font-label-md transition-all active:scale-95 ${
                  isActive
                    ? "bg-secondary text-on-secondary"
                    : "bg-surface-container-high text-on-surface border border-border-standard"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
