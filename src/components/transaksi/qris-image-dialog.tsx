"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import Image from "next/image";
import QrisFullscreenDialog from "@/components/transaksi/qris-fullscreen-dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  amount?: number;
  receiptNumber?: string | null;
}

/** Displays the store's QRIS image for re-scanning (e.g. from the Transaksi page). */
export default function QrisImageDialog({ open, onClose, amount, receiptNumber }: Props) {
  const [fullscreen, setFullscreen] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[400px] p-5 space-y-4 text-center max-h-[90vh] overflow-y-auto hide-scrollbar">
        <div className="space-y-1">
          <div className="w-14 h-14 rounded-full bg-secondary-container/20 flex items-center justify-center mx-auto">
            <Icon name="qr_code_2" size={28} className="text-secondary" />
          </div>
          <h3 className="text-headline-md font-bold">Scan Ulang QRIS</h3>
          {receiptNumber && (
            <p className="text-label-md text-on-surface-variant font-mono">
              {receiptNumber}
            </p>
          )}
        </div>

        {/* QR Code Image — click to open fullscreen */}
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="mx-auto bg-white border-2 border-border-standard rounded-xl overflow-hidden flex items-center justify-center p-1.5 w-full max-w-[240px] cursor-zoom-in active:scale-[0.99] transition-transform"
          aria-label="Perbesar QRIS"
        >
          <Image
            src="/images/QRIS.jpg"
            alt="QRIS"
            width={240}
            height={240}
            className="w-full h-auto object-contain"
            unoptimized
          />
        </button>
        <p className="text-[10px] text-outline -mt-2">Ketuk gambar untuk memperbesar</p>

        {amount !== undefined && (
          <div className="p-4 bg-surface-container rounded-xl">
            <p className="text-label-md text-on-surface-variant">Total Pembayaran</p>
            <p className="text-headline-md font-extrabold text-secondary">{formatCurrency(amount)}</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full h-touch-target-min bg-secondary text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Icon name="close" size={20} />
          Tutup
        </button>
      </div>

      {/* Fullscreen QRIS */}
      <QrisFullscreenDialog open={fullscreen} onClose={() => setFullscreen(false)} />
    </div>
  );
}
