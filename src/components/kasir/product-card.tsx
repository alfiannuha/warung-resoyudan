"use client";

import { useState, useRef } from "react";
import type { Product } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { useCartStore } from "@/stores/use-cart-store";
import { useFlyingBallStore } from "@/stores/use-flying-ball-store";
import { Icon } from "@/lib/icon-map";

export default function ProductCard({ product }: { product: Product }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const throwBall = useFlyingBallStore((s) => s.throwBall);
  const [animating, setAnimating] = useState(false);
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleAdd = () => {
    const fromRect = cardRef.current?.getBoundingClientRect();

    // Tablet → cart panel; Mobile → cart icon
    const isTablet = window.innerWidth >= 768;
    const target = isTablet
      ? (document.querySelector("[data-cart-target]") as HTMLElement | null)
      : (document.querySelector("[data-cart-icon]") as HTMLElement | null);

    let toX = window.innerWidth - 40;
    let toY = 80;
    if (target) {
      const targetRect = target.getBoundingClientRect();
      toX = targetRect.left + targetRect.width / 2;
      toY = targetRect.top + targetRect.height / 2;
    }

    if (fromRect) {
      throwBall(fromRect.left + fromRect.width / 2, fromRect.top + fromRect.height / 2, toX, toY, product.name);
    }

    setAnimating(true);
    addToCart(product);
    setTimeout(() => setAnimating(false), 300);
  };

  const showImage = product.image_url && !imgError;

  return (
    <div
      ref={cardRef}
      onClick={handleAdd}
      className={`bg-white border border-border-standard rounded-xl p-3 flex flex-col gap-2 cursor-pointer hover:border-secondary transition-all ${
        animating ? "animate-product-pop border-secondary" : "active:scale-[0.98]"
      }`}
    >
      <div className="aspect-square bg-surface-container rounded-lg flex items-center justify-center overflow-hidden relative">
        {animating ? (
          <div className="w-full h-full bg-secondary/10 flex items-center justify-center">
            <Icon name="check_circle" size={40} className="text-secondary animate-badge-pulse" />
          </div>
        ) : showImage ? (
          <img
            src={product.image_url!}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Icon name="inventory_2" size={40} className="text-outline" />
        )}
        {product.is_favorite && (
          <div className="absolute top-1 left-1 w-6 h-6 bg-warning-debt rounded-full flex items-center justify-center shadow-md">
            <Icon name="star" size={14} fill="currentColor" className="text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 gap-1">
        <span className="text-label-md text-label-md text-on-surface-variant">
          {product.category}
        </span>
        <h3 className="text-body-md text-body-md text-on-surface font-bold line-clamp-1">
          {product.name}
        </h3>
        <div className="flex justify-between items-end mt-auto pt-1">
          <span className="text-label-xl font-bold text-primary">
            {formatCurrency(product.sellPrice)}
          </span>
          <span className="text-[12px] text-outline font-medium">Stok: {product.stock}</span>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); handleAdd(); }}
        className="w-full h-10 rounded-lg bg-secondary text-on-secondary font-bold text-label-md flex items-center justify-center gap-1 active:opacity-80 transition-opacity mt-1"
      >
        <Icon name="add" size={16} />
        Tambah
      </button>
    </div>
  );
}
