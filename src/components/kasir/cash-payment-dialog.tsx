"use client";

import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";

interface Props {
  open: boolean;
  totalAmount: number;
  onConfirm: (amountPaid: number) => void;
  onCancel: () => void;
}

const QUICK_NOMINALS = [50000, 100000, 200000, 500000];

export default function CashPaymentDialog({ open, totalAmount, onConfirm, onCancel }: Props) {
  const [amountStr, setAmountStr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const amountPaid = amountStr ? parseInt(amountStr, 10) : 0;
  const change = Math.max(0, amountPaid - totalAmount);
  const isValid = amountPaid >= totalAmount;

  useEffect(() => {
    if (open) {
      setAmountStr("");
      // Focus input after render
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleQuickNominal = (nominal: number) => {
    setAmountStr(String(nominal));
  };

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(amountPaid);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-[360px] w-full p-6 space-y-6">
        <div className="space-y-2 text-center">
          <div className="w-16 h-16 rounded-full bg-success-paid/10 flex items-center justify-center mx-auto">
            <Icon name="payments" size={36} className="text-success-paid" />
          </div>
          <h3 className="text-headline-md font-bold">Pembayaran Tunai</h3>
          <p className="text-on-surface-variant text-body-md">
            Total: {formatCurrency(totalAmount)}
          </p>
        </div>

        {/* Amount Input */}
        <div>
          <label className="text-label-md text-on-surface-variant block mb-1">
            Jumlah Tunai
          </label>
          <input
            ref={inputRef}
            value={amountStr}
            onChange={(e) => {
              // Only allow digits
              const val = e.target.value.replace(/\D/g, "");
              setAmountStr(val);
            }}
            className="w-full h-14 text-headline-lg font-bold text-center border-2 border-border-standard rounded-xl focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all"
            placeholder="0"
            inputMode="numeric"
            type="text"
          />
        </div>

        {/* Change Display */}
        {amountPaid > 0 && (
          <div className={`p-4 rounded-xl text-center ${isValid ? "bg-success-paid/10" : "bg-danger-alert/10"}`}>
            <p className="text-label-md text-on-surface-variant">Kembali</p>
            <p className={`text-headline-md font-extrabold ${isValid ? "text-success-paid" : "text-danger-alert"}`}>
              {formatCurrency(change)}
            </p>
            {!isValid && (
              <p className="text-xs text-danger-alert mt-1">Jumlah tunai kurang</p>
            )}
          </div>
        )}

        {/* Quick Nominals */}
        <div className="grid grid-cols-2 gap-2">
          {QUICK_NOMINALS.map((nominal) => (
            <button
              key={nominal}
              onClick={() => handleQuickNominal(nominal)}
              className="h-10 border border-border-standard rounded-xl font-bold text-label-md active:scale-[0.98] transition-transform hover:bg-surface-container"
            >
              {formatCurrency(nominal)}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={`w-full h-touch-target-min rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${
              isValid
                ? "bg-secondary text-on-secondary shadow-lg shadow-secondary/20"
                : "bg-surface-container text-on-surface-variant cursor-not-allowed"
            }`}
          >
            <Icon name="check_circle" size={20} />
            Bayar {amountStr ? formatCurrency(amountPaid) : ""}
          </button>
          <button
            onClick={onCancel}
            className="w-full h-12 text-on-surface-variant font-bold active:opacity-80"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
