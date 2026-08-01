"use client";

import { useState } from "react";
import { useSettingsStore } from "@/stores/use-settings-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function PinDialog({ open, onOpenChange, onSuccess }: Props) {
  const editPin = useSettingsStore((s) => s.editPin);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleVerify = () => {
    if (pin === editPin) {
      setError(false);
      setPin("");
      onOpenChange(false);
      onSuccess();
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setError(false);
          setPin("");
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="bg-white rounded-xl max-w-[320px]">
        <DialogHeader className="text-center">
          <DialogTitle className="text-headline-md font-bold">
            Masukkan PIN Keamanan
          </DialogTitle>
          <DialogDescription className="text-body-md text-on-surface-variant">
            Diperlukan untuk mengedit transaksi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
              setError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleVerify();
            }}
            className={`w-full h-14 text-center text-2xl tracking-[0.5em] font-bold border rounded-xl outline-none transition-all ${
              error
                ? "border-danger-alert focus:border-danger-alert focus:ring-2 focus:ring-danger-alert/20"
                : "border-border-standard focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            }`}
            placeholder="••••"
            maxLength={4}
          />
          {error && (
            <p className="text-danger-alert text-sm text-center font-medium">
              PIN salah. Silakan coba lagi.
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 border border-border-standard rounded-xl font-bold text-on-surface-variant active:bg-surface-container transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleVerify}
              disabled={pin.length < 4}
              className="flex-1 h-12 bg-secondary text-on-secondary rounded-xl font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              Verifikasi
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
