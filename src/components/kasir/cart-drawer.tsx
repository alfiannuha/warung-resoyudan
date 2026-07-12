"use client";

import { useState } from "react";
import { useCartStore } from "@/stores/use-cart-store";
import { formatCurrency } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import CartItemRow from "./cart-item";
import PaymentMethod from "./payment-method";
import CustomerSelect from "./customer-select";

interface Props {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  onScan: () => void;
}

export default function CartDrawer({ open, onClose, onCheckout, onScan }: Props) {
  const { items, clearCart } = useCartStore();
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-gutter py-4 border-b border-border-standard shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center -ml-2">
            <Icon name="chevron_right" size={24} className="rotate-180" />
          </button>
          <h2 className="text-headline-md font-bold">Keranjang ({totalItems})</h2>
        </div>
        {items.length > 0 && (
          <button onClick={clearCart} className="text-error text-label-md font-bold">
            Kosongkan
          </button>
        )}
      </div>

      {/* Items - scrollable */}
      <div className="flex-1 overflow-y-auto px-gutter space-y-1 py-4">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-on-surface-variant/50">
              <Icon name="shopping_cart" size={48} className="block mb-2 mx-auto" />
              <p>Keranjang masih kosong</p>
            </div>
          </div>
        ) : (
          items.map((item) => (
            <CartItemRow key={item.productId} item={item} />
          ))
        )}
      </div>

      {/* Sticky footer */}
      {items.length > 0 && (
        <div className="shrink-0 bg-white border-t border-border-standard shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="px-gutter py-4 space-y-4">
            <PaymentMethod />
            <CustomerSelect />

            <div className="space-y-2 pt-2">
              <table className="w-full text-body-md">
                <tbody>
                  <tr className="text-on-surface-variant">
                    <td>Subtotal</td>
                    <td className="text-right">{formatCurrency(items.reduce((s, i) => s + i.subtotal, 0))}</td>
                  </tr>
                  <tr className="text-on-surface-variant">
                    <td>Diskon</td>
                    <td className="text-right text-error">- Rp 0</td>
                  </tr>
                  <tr className="pt-2">
                    <td className="text-headline-md font-bold pt-2 border-t border-border-standard">Total</td>
                    <td className="text-headline-md font-extrabold text-secondary pt-2 border-t border-border-standard text-right">
                      {formatCurrency(items.reduce((s, i) => s + i.subtotal, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onScan}
                className="h-touch-target-min px-4 rounded-xl border border-border-standard font-label-md flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shrink-0"
              >
                <Icon name="scan_barcode" size={20} />
                Scan
              </button>
              <button
                onClick={onCheckout}
                className="flex-1 h-touch-target-min bg-secondary text-white rounded-xl font-bold text-body-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-secondary/20"
              >
                <Icon name="check_circle" size={24} />
                Konfirmasi & Bayar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
