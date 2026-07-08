"use client";

import { useCartStore } from "@/stores/use-cart-store";
import { formatCurrency } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";

interface Props {
  onOpen: () => void;
}

export default function CartBar({ onOpen }: Props) {
  const items = useCartStore((s) => s.items);
  const lastAddedItemId = useCartStore((s) => s.lastAddedItemId);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);

  const empty = items.length === 0;

  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border-standard shadow-lg ${empty ? "invisible" : ""}`} data-cart-bar>
      <button
        onClick={onOpen}
        className="w-full flex items-center justify-between px-gutter py-3 active:bg-surface-container transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative" data-cart-icon>
            <Icon
              name="shopping_cart"
              size={24}
              className={`text-secondary ${lastAddedItemId ? "animate-cart-bounce" : ""}`}
            />
            <span className={`absolute -top-2 -right-2 bg-danger-alert text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center transition-transform ${
              lastAddedItemId ? "animate-badge-pulse" : ""
            }`}>
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          </div>
          <span className="text-body-md text-on-surface-variant">
            {totalItems} item
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-headline-md font-extrabold text-secondary">
            {formatCurrency(totalAmount)}
          </span>
          <Icon name="chevron_right" size={20} className="text-outline" />
        </div>
      </button>
    </div>
  );
}
