"use client";

import { useCartStore } from "@/stores/use-cart-store";
import { Icon } from "@/lib/icon-map";

export default function PaymentMethod() {
  const paymentMethod = useCartStore((s) => s.paymentMethod);
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod);

  return (
    <div className="space-y-2">
      <label className="text-label-md block text-on-surface-variant">
        Metode Pembayaran
      </label>
      <div className="grid gap-3 grid-cols-3">
        <button
          onClick={() => setPaymentMethod("cash")}
          className={`touch-target flex items-center justify-center gap-2 font-bold rounded-xl transition-all ${
            paymentMethod === "cash"
              ? "border-2 border-secondary bg-secondary/5 text-secondary"
              : "border border-border-standard text-outline"
          }`}
        >
          <Icon name="payments" />
          Tunai
        </button>
        <button
          onClick={() => setPaymentMethod("kasbon")}
          className={`touch-target flex items-center justify-center gap-2 font-bold rounded-xl transition-all ${
            paymentMethod === "kasbon"
              ? "border-2 border-warning-debt bg-warning-debt/5 text-warning-debt"
              : "border border-border-standard text-outline"
          }`}
        >
          <Icon name="menu_book" />
          Kasbon
        </button>
        <button
          onClick={() => setPaymentMethod("qris")}
          className={`touch-target flex items-center justify-center gap-2 font-bold rounded-xl transition-all ${
            paymentMethod === "qris"
              ? "border-2 border-secondary bg-secondary/5 text-secondary"
              : "border border-border-standard text-outline"
          }`}
          aria-label="QRIS"
        >
          <Icon name="qr_code_2" />
          QRIS
        </button>
      </div>
    </div>
  );
}
