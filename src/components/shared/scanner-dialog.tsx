"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface Props {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  mode?: "product" | "cashier";
}

export default function ScannerDialog({ open, onClose, onScan, mode = "product" }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      return;
    }

    const start = async () => {
      // Wait a tick for the DOM to be ready
      await new Promise((r) => setTimeout(r, 100));
      if (!containerRef.current) return;

      const html5QrCode = new Html5Qrcode("scanner-element");
      scannerRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            onScan(decodedText);
          },
          () => {}
        );
      } catch {
        // Camera permission denied or not available — handled silently
      }
    };

    start();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [open, onScan]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button
          onClick={handleClose}
          className="text-white text-headline-md font-bold flex items-center gap-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Tutup
        </button>
        <span className="text-white/70 text-label-md">
          Arahkan kamera ke barcode
        </span>
      </div>

      {/* Scanner area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <div
          id="scanner-element"
          ref={containerRef}
          className="w-full h-full"
        />

        {/* Scan area overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Dimmed areas */}
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[280px] max-h-[280px]"
            style={{
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
            }}
          />

          {/* Corner markers */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[280px] max-h-[280px]">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-secondary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-secondary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-secondary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-secondary rounded-br-lg" />
          </div>

          {/* Scan line animation */}
          {mode === "cashier" && (
            <div className="absolute left-1/2 -translate-x-1/2 w-[50vw] max-w-[240px] h-px bg-secondary shadow-[0_0_8px_theme(colors.secondary.DEFAULT)] animate-scan-line"
              style={{
                top: "calc(50% - 60px)",
                animation: "scanLine 2s ease-in-out infinite",
              }}
            />
          )}
        </div>
      </div>

      {/* Bottom hint */}
      <div className="py-6 shrink-0">
        <p className="text-center text-white/60 text-body-md">
          {mode === "cashier"
            ? "Scan barcode untuk menambahkan produk ke keranjang"
            : "Scan barcode produk untuk pengisian otomatis"}
        </p>
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: calc(50% - 80px); opacity: 0.3; }
          50% { top: calc(50% + 80px); opacity: 1; }
        }
        #scanner-element video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}
