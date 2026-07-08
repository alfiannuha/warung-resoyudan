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
    <div className="flex items-center gap-4 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-body-lg font-medium break-words leading-snug">{item.name}</p>
        <p className="text-label-md text-on-surface-variant">
          {formatCurrency(item.sellPrice)}
        </p>
      </div>
      <QuantityControl
        quantity={item.quantity}
        maxStock={maxStock}
        onDecrement={() => updateQuantity(item.productId, item.quantity - 1)}
        onIncrement={() => updateQuantity(item.productId, item.quantity + 1)}
      />
      <div className="text-right min-w-[80px]">
        <p className="font-bold text-on-surface">
          {formatCurrency(item.subtotal)}
        </p>
      </div>
      <button
        onClick={() => removeFromCart(item.productId)}
        className="text-danger-alert touch-target w-8 h-8 flex items-center justify-center"
        aria-label={`Hapus ${item.name}`}
      >
        <Icon name="delete" size={20} />
      </button>
    </div>
  );
}
