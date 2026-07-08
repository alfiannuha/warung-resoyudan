"use client";

import { useShallow } from "zustand/react/shallow";
import type { CartItem } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import QuantityControl from "./quantity-control";
import { useCartStore } from "@/stores/use-cart-store";
import { useProductStore } from "@/stores/use-product-store";

interface Props {
  item: CartItem;
}

export default function CartItemRow({ item }: Props) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const products = useProductStore((s) => s.products);
  const product = products.find((p) => p.id === item.productId);
  const maxStock = product ? product.stock : undefined;

  return (
    <div className="py-3 space-y-2">
      {/* Row 1: name + subtotal */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-body-lg font-medium break-words leading-snug flex-1 min-w-0">{item.name}</p>
        <p className="font-bold text-on-surface shrink-0">{formatCurrency(item.subtotal)}</p>
      </div>
      {/* Row 2: unit price + quantity control + delete */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-label-md text-on-surface-variant">{formatCurrency(item.sellPrice)}</p>
        <div className="flex items-center gap-2">
          <QuantityControl
            quantity={item.quantity}
            maxStock={maxStock}
            onDecrement={() => updateQuantity(item.productId, item.quantity - 1)}
            onIncrement={() => updateQuantity(item.productId, item.quantity + 1)}
          />
          <button
            onClick={() => removeFromCart(item.productId)}
            className="text-danger-alert w-9 h-9 flex items-center justify-center rounded-lg hover:bg-danger-alert/10 active:scale-90 transition-all"
            aria-label={`Hapus ${item.name}`}
          >
            <Icon name="delete" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
