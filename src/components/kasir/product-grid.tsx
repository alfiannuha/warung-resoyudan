"use client";

import { useShallow } from "zustand/react/shallow";
import { useProductStore } from "@/stores/use-product-store";
import ProductCard from "./product-card";
import FavoriteProductsSection from "./favorite-products-section";
import { Icon } from "@/lib/icon-map";

export default function ProductGrid() {
  const products = useProductStore(
    useShallow((s) => s.getFilteredProducts())
  );

  return (
    <section className="pb-4">
      {/* 🔥 Favorite Products Section */}
      <FavoriteProductsSection />

      {/* 📦 Semua Produk */}
      <div className="px-container-padding">
        <h2 className="text-label-xl font-bold text-on-surface mb-3">
          Semua Produk
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-12 text-on-surface-variant/50">
              <Icon name="search_off" size={48} className="block mb-2 mx-auto" />
              <p>Tidak ada produk ditemukan</p>
            </div>
          ) : (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
