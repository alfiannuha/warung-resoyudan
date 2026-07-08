"use client";

import { useCartStore } from "@/stores/use-cart-store";
import { formatCurrency } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import CartItemRow from "./cart-item";
import PaymentMethod from "./payment-method";
import CustomerSelect from "./customer-select";

interface Props {
  onCheckout: () => void;
}

export default function CartSheet({ onCheckout }: Props) {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  if (items.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-3xl border-t border-border-standard shadow-2xl max-h-[65vh] flex flex-col">
      <div className="w-full flex justify-center py-3 shrink-0">
        <div className="w-10 h-1 bg-outline-variant rounded-full"></div>
      </div>

      <div className="flex items-center justify-between px-gutter pb-3 shrink-0">
        <h2 className="text-label-xl font-bold flex items-center gap-2">
          <Icon name="shopping_cart" size={24} className="text-secondary" />
          Keranjang ({totalItems})
        </h2>
        <button
          onClick={clearCart}
          className="text-danger-alert text-label-md font-bold"
        >
          Kosongkan
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-gutter space-y-1">
        {items.map((item) => (
          <CartItemRow key={item.productId} item={item} />
        ))}
      </div>

      {items.length > 0 && (
        <div className="px-gutter pb-4 pt-3 space-y-4 border-t border-border-standard mt-3">
          <PaymentMethod />
          <CustomerSelect />
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant text-body-md">
              Total Pembayaran
            </span>
            <span className="text-headline-md font-extrabold text-secondary">
              {formatCurrency(totalAmount)}
            </span>
          </div>
          <button
            onClick={onCheckout}
            className="w-full touch-target bg-secondary text-white font-bold text-body-lg rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            Simpan Transaksi
            <Icon name="check_circle" />
          </button>
        </div>
      )}
    </div>
  );
}
