"use client";

import { formatCurrency } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";

interface Props {
  open: boolean;
  amount: number;
  onConfirm: () => void;
  onClose: () => void;
}

export default function QrisPaymentDialog({ open, amount, onConfirm, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-[360px] w-full p-6 space-y-6 text-center">
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-full bg-secondary-container/20 flex items-center justify-center mx-auto">
            <Icon name="qr_code_2" size={36} className="text-secondary" />
          </div>
          <h3 className="text-headline-md font-bold">Pembayaran QRIS</h3>
          <p className="text-on-surface-variant text-body-md">Scan QRIS berikut untuk membayar</p>
        </div>

        {/* QR Code Placeholder */}
        <div className="w-48 h-48 mx-auto bg-white border-2 border-border-standard rounded-xl flex items-center justify-center">
          <div className="w-40 h-40 bg-surface-container rounded-lg flex items-center justify-center">
            <svg className="w-32 h-32" viewBox="0 0 100 100">
              {Array.from({ length: 25 }).map((_, i) => (
                <rect
                  key={i}
                  x={Math.floor(Math.random() * 12) * 8 + 2}
                  y={Math.floor(Math.random() * 12) * 8 + 2}
                  width="6"
                  height="6"
                  fill="currentColor"
                  className="text-primary"
                  rx="1"
                />
              ))}
              {/* Corner patterns */}
              <rect x="4" y="4" width="24" height="24" fill="currentColor" className="text-primary" rx="2" />
              <rect x="72" y="4" width="24" height="24" fill="currentColor" className="text-primary" rx="2" />
              <rect x="4" y="72" width="24" height="24" fill="currentColor" className="text-primary" rx="2" />
            </svg>
          </div>
        </div>

        {/* Amount */}
        <div className="p-4 bg-surface-container rounded-xl">
          <p className="text-label-md text-on-surface-variant">Total Pembayaran</p>
          <p className="text-headline-md font-extrabold text-secondary">{formatCurrency(amount)}</p>
        </div>

        <p className="text-xs text-on-surface-variant">
          Menunggu pembayaran... Jika sudah dibayar, klik tombol konfirmasi di bawah.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onConfirm}
            className="w-full h-touch-target-min bg-secondary text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Icon name="check_circle" size={20} />
            Konfirmasi Pembayaran
          </button>
          <button
            onClick={onClose}
            className="w-full h-12 text-on-surface-variant font-bold active:opacity-80"
          >
            Batalkan Transaksi
          </button>
        </div>
      </div>
    </div>
  );
}
