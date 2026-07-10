"use client";

import type { CartItem, PaymentMethod } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";

interface Props {
  open: boolean;
  receiptNumber: string;
  totalAmount: number;
  amountPaid: number;
  change: number;
  paymentMethod: PaymentMethod;
  customerPhone?: string;
  onPrint: () => void;
  onWhatsApp: () => void;
  onDone: () => void;
}

export default function ReceiptSuccessDialog({
  open,
  receiptNumber,
  totalAmount,
  amountPaid,
  change,
  paymentMethod,
  customerPhone,
  onPrint,
  onWhatsApp,
  onDone,
}: Props) {
  if (!open) return null;

  const isKasbon = paymentMethod === "kasbon";
  const hasPhone = !!customerPhone;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-[360px] w-full p-6 space-y-6">
        {/* Success Icon */}
        <div className="space-y-2 text-center">
          <div className="w-16 h-16 rounded-full bg-success-paid/10 flex items-center justify-center mx-auto">
            <Icon name="check_circle" size={36} className="text-success-paid" />
          </div>
          <h3 className="text-headline-md font-bold">Transaksi Berhasil!</h3>
          <p className="text-label-md text-on-surface-variant font-mono">
            {receiptNumber}
          </p>
        </div>

        {/* Status badge for kasbon */}
        {isKasbon && (
          <div className="p-3 bg-warning-debt/10 rounded-xl text-center">
            <p className="text-label-md font-bold text-warning-debt uppercase tracking-wider">
              KASBON
            </p>
          </div>
        )}

        {/* Total */}
        <div className="p-4 bg-surface-container rounded-xl">
          <div className="flex justify-between items-center">
            <span className="text-label-md text-on-surface-variant">Total Pembayaran</span>
            <span className="text-headline-md font-extrabold text-secondary">
              {formatCurrency(totalAmount)}
            </span>
          </div>
          {paymentMethod === "cash" && amountPaid > 0 && (
            <>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-border-standard">
                <span className="text-label-md text-on-surface-variant">Tunai</span>
                <span className="text-body-md font-bold">{formatCurrency(amountPaid)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-label-md text-on-surface-variant">Kembali</span>
                <span className="text-body-md font-bold text-success-paid">{formatCurrency(change)}</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onPrint}
            className="w-full h-touch-target-min bg-secondary text-on-secondary rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-secondary/20"
          >
            <Icon name="print" size={20} />
            Cetak Nota
          </button>
          <button
            onClick={onWhatsApp}
            className={`w-full h-touch-target-min rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${
              hasPhone
                ? "border-2 border-secondary text-secondary"
                : "border border-border-standard text-on-surface-variant cursor-not-allowed"
            }`}
            disabled={!hasPhone}
          >
            <Icon name="message_circle" size={20} />
            {hasPhone ? "Kirim WhatsApp" : "Nomor WhatsApp tidak tersedia"}
          </button>
          <button
            onClick={onDone}
            className="w-full h-12 text-on-surface-variant font-bold active:opacity-80"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
