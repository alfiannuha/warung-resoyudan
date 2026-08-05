"use client";

import { useCallback } from "react";
import { usePrinterStore } from "@/stores/use-printer-store";
import { buildReceiptText, type ReceiptParams } from "@/lib/receipt-formatter";
import { renderReceipt, renderTestPage, type DensityLevel } from "@/lib/escpos-renderer";
import { printerManager } from "@/lib/printer-manager";

export type PrintPhase = "connecting" | "preparing" | "printing" | "completed" | "error";

export interface PrintJobState {
  phase: PrintPhase;
  error: string | null;
}

/** Single source of truth for one print attempt: connect → prepare → print. */
export async function printReceiptJob(
  params: ReceiptParams,
  onPhase: (phase: PrintPhase) => void,
): Promise<void> {
  try {
    // 1. Connect / reuse the persistent connection.
    onPhase("connecting");
    const characteristic = await printerManager.getCharacteristic();
    if (!characteristic) {
      onPhase("error");
      throw new Error("Hubungkan printer terlebih dahulu di menu Pengaturan.");
    }

    // 2. Prepare the ESC/POS byte stream.
    onPhase("preparing");
    const density = usePrinterStore.getState().density as DensityLevel;
    const text = buildReceiptText(params);
    const data = renderReceipt(text, {
      paperWidth: params.paperWidth,
      density,
      storeName: usePrinterStore.getState().printerName,
    });

    // 3. Print.
    onPhase("printing");
    await printerManager.write(data);

    onPhase("completed");
  } catch (err) {
    printerManager.resetConnection();
    onPhase("error");
    throw err instanceof Error ? err : new Error("Gagal mencetak nota.");
  }
}

/** Test-page job for the settings "Cetak Test" button. */
export async function testPrintJob(
  deviceName: string,
  paperWidth: ReceiptParams["paperWidth"],
  onPhase: (phase: PrintPhase) => void,
): Promise<void> {
  try {
    onPhase("connecting");
    const characteristic = await printerManager.getCharacteristic();
    if (!characteristic) {
      onPhase("error");
      throw new Error("Hubungkan printer terlebih dahulu.");
    }

    onPhase("preparing");
    const density = usePrinterStore.getState().density as DensityLevel;
    const data = renderTestPage(deviceName, { paperWidth, density });

    onPhase("printing");
    await printerManager.write(data);

    onPhase("completed");
  } catch (err) {
    printerManager.resetConnection();
    onPhase("error");
    throw err instanceof Error ? err : new Error("Gagal mencetak test.");
  }
}

/**
 * PrintProgressDialog — visible printing progress + retry.
 * Controlled by a parent via `open` / `state` / `onRetry` / `onClose`.
 */
export function PrintProgressDialog({
  open,
  state,
  onRetry,
  onClose,
}: {
  open: boolean;
  state: PrintJobState;
  onRetry: () => void;
  onClose: () => void;
}) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!open) return null;

  const isBusy =
    state.phase === "connecting" || state.phase === "preparing" || state.phase === "printing";

  const phaseLabel =
    state.phase === "connecting"
      ? "Menghubungkan printer…"
      : state.phase === "preparing"
      ? "Menyiapkan nota…"
      : state.phase === "printing"
      ? "Mencetak…"
      : state.phase === "completed"
      ? "Nota berhasil dicetak!"
      : "Gagal mencetak";

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Status pencetakan"
    >
      <div className="w-full max-w-[340px] rounded-2xl border border-border-standard bg-card p-6 shadow-dialog">
        <div className="flex flex-col items-center text-center">
          {state.phase === "completed" ? (
            <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
              <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
          ) : state.phase === "error" ? (
            <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-danger/10 text-danger">
              <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </span>
          ) : (
            <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <svg viewBox="0 0 24 24" className="size-7 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-6.2-8.56" />
              </svg>
            </span>
          )}

          <h3 className="text-headline-md font-bold text-on-surface">{phaseLabel}</h3>
          {state.phase === "error" && state.error && (
            <p className="mt-1 text-body-sm text-on-surface-variant">{state.error}</p>
          )}

          {/* Retry / Close */}
          <div className="mt-5 w-full space-y-2">
            {state.phase === "error" && (
              <button
                onClick={onRetry}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-secondary font-semibold text-white shadow-fab transition-all active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                  <path d="M21 3v6h-6" />
                </svg>
                Coba Lagi
              </button>
            )}
            {state.phase === "completed" && (
              <button
                onClick={handleClose}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-secondary font-semibold text-white shadow-fab transition-all active:scale-[0.98]"
              >
                Selesai
              </button>
            )}
            {isBusy && (
              <p className="text-caption text-on-surface-variant">Mohon tunggu…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
