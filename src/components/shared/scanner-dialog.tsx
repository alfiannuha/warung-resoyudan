"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Icon } from "@/lib/icon-map";

interface Props {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  mode?: "product" | "cashier";
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 1800;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Audio not available
  }
}

export default function ScannerDialog({ open, onClose, onScan, mode = "product" }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const [processing, setProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const debounceRef = useRef(false);
  onScanRef.current = onScan;

  const handleScan = useCallback((barcode: string) => {
    if (debounceRef.current) return;
    debounceRef.current = true;

    playBeep();
    setProcessing(true);
    setStatusText("Barcode terdeteksi!");
    onScanRef.current(barcode);

    // Brief throttle to prevent double-fire
    setTimeout(() => {
      debounceRef.current = false;
      setProcessing(false);
      setStatusText("");
    }, 800);
  }, []);

  useEffect(() => {
    if (!open) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      setProcessing(false);
      setStatusText("");
      debounceRef.current = false;
      return;
    }

    let cancelled = false;

    const start = async () => {
      await new Promise((r) => setTimeout(r, 100));
      if (cancelled || !document.getElementById("scanner-element")) return;

      const html5QrCode = new Html5Qrcode("scanner-element", {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.ITF,
        ],
      });
      scannerRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 30,
            qrbox: { width: 200, height: 100 },
            aspectRatio: 1.777,
          },
          (decodedText) => {
            handleScan(decodedText);
          },
          () => {}
        );
      } catch {
        // Camera permission denied or not available
      }
    };

    start();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [open, handleScan]);

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
        <div id="scanner-element" className="w-full h-full" />

        {/* Scan area overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[55vw] h-[28vw] max-w-[260px] max-h-[130px]"
            style={{
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
            }}
          />

          {/* Corner markers — wider for barcode */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[55vw] h-[28vw] max-w-[260px] max-h-[130px]">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-secondary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-secondary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-secondary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-secondary rounded-br-lg" />
          </div>

          {/* Scan line */}
          {!processing && (
            <div
              className="absolute left-1/2 -translate-x-1/2 w-[45vw] max-w-[220px] h-px bg-secondary shadow-[0_0_10px_theme(colors.secondary.DEFAULT)]"
              style={{ top: "calc(50% - 60px)", animation: "scanLine 1.2s ease-in-out infinite" }}
            />
          )}

          {/* Processing overlay */}
          {processing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-auto">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <p className="text-white text-headline-md font-bold">{statusText}</p>
                <p className="text-white/60 text-label-md mt-1">Memproses...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom hint */}
      <div className="py-6 shrink-0">
        <p className="text-center text-white/60 text-body-md">
          {processing
            ? "Harap tunggu..."
            : mode === "cashier"
            ? "Scan barcode untuk menambahkan produk ke keranjang"
            : "Scan barcode produk untuk pengisian otomatis"}
        </p>
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: calc(50% - 65px); opacity: 0.3; }
          50% { top: calc(50% + 65px); opacity: 1; }
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
