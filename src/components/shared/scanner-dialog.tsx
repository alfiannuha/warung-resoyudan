"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";

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
  const runningRef = useRef(false);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const onScanRef = useRef(onScan);
  const [processing, setProcessing] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const debounceRef = useRef(false);
  onScanRef.current = onScan;

  const handleScan = useCallback((barcode: string) => {
    if (debounceRef.current) return;
    debounceRef.current = true;

    playBeep();
    setProcessing(true);
    onScanRef.current(barcode);

    setTimeout(() => {
      debounceRef.current = false;
      setProcessing(false);
    }, 800);
  }, []);

  const toggleTorch = async () => {
    const track = trackRef.current;
    if (!track) return;
    try {
      await track.applyConstraints({
        // @ts-expect-error - torch is non-standard
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch {
      // Torch toggle failed
    }
  };

  useEffect(() => {
    if (!open) {
      if (scannerRef.current && runningRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
      scannerRef.current = null;
      runningRef.current = false;
      trackRef.current = null;
      setProcessing(false);
      setTorchOn(false);
      setTorchSupported(false);
      setCameraError("");
      debounceRef.current = false;
      return;
    }

    let cancelled = false;

    const start = async () => {
      await new Promise((r) => setTimeout(r, 100));
      if (cancelled || !document.getElementById("scanner-element")) return;

      const html5QrCode = new Html5Qrcode("scanner-element");
      scannerRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 200, height: 100 },
          },
          (decodedText) => {
            handleScan(decodedText);
          },
          () => {}
        );

        runningRef.current = true;
        setCameraError("");

        // Grab track for torch
        const videoEl = document.querySelector("#scanner-element video") as HTMLVideoElement | null;
        if (videoEl?.srcObject instanceof MediaStream) {
          const track = videoEl.srcObject.getVideoTracks()[0];
          if (track) {
            trackRef.current = track;
            const caps = track.getCapabilities?.();
            // @ts-expect-error - torch is non-standard
            setTorchSupported(!!caps?.torch);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
          setCameraError("Akses kamera ditolak. Izinkan kamera di pengaturan browser.");
        } else {
          setCameraError("Kamera tidak tersedia. Pastikan perangkat memiliki kamera.");
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      if (scannerRef.current && runningRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
      scannerRef.current = null;
      runningRef.current = false;
      trackRef.current = null;
    };
  }, [open, handleScan]);

  const handleClose = () => {
    if (scannerRef.current && runningRef.current) {
      scannerRef.current.stop().catch(() => {});
    }
    scannerRef.current = null;
    runningRef.current = false;
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
        <div className="flex items-center gap-3">
          {torchSupported && (
            <button
              onClick={toggleTorch}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                torchOn ? "bg-secondary text-on-secondary" : "text-white/70"
              }`}
              aria-label={torchOn ? "Matikan senter" : "Nyalakan senter"}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {torchOn ? (
                  <>
                    <path d="M18 6L6 18" />
                    <path d="M22 12h-4" />
                    <path d="M16 8l-4 4" />
                    <path d="M2 12h4" />
                    <path d="M8 16l4-4" />
                  </>
                ) : (
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
                )}
              </svg>
            </button>
          )}
          <span className="text-white/70 text-label-md">
            Arahkan kamera ke barcode
          </span>
        </div>
      </div>

      {/* Scanner area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
        <div id="scanner-element" className="w-full h-full" />

        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <div className="text-center max-w-sm">
              <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-white text-headline-md font-bold mb-2">Kamera Tidak Tersedia</p>
              <p className="text-white/60 text-body-md">{cameraError}</p>
            </div>
          </div>
        )}

        {/* Overlay — only show when camera is running */}
        {!cameraError && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-black/30" />
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[55vw] h-[28vw] max-w-[260px] max-h-[130px]"
              style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.3)" }}
            />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[55vw] h-[28vw] max-w-[260px] max-h-[130px]">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-secondary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-secondary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-secondary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-secondary rounded-br-lg" />
            </div>
            {!processing && (
              <div
                className="absolute left-1/2 -translate-x-1/2 w-[45vw] max-w-[220px] h-px bg-secondary shadow-[0_0_10px_theme(colors.secondary.DEFAULT)]"
                style={{ top: "calc(50% - 60px)", animation: "scanLine 1.2s ease-in-out infinite" }}
              />
            )}
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-auto">
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto mb-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <p className="text-white text-headline-md font-bold">Barcode terdeteksi!</p>
                  <p className="text-white/50 text-label-md mt-1">Memproses...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom hint */}
      {!cameraError && (
        <div className="py-6 shrink-0">
          <p className="text-center text-white/60 text-body-md">
            {processing
              ? "Harap tunggu..."
              : mode === "cashier"
              ? "Scan barcode untuk menambahkan produk ke keranjang"
              : "Scan barcode produk untuk pengisian otomatis"}
          </p>
        </div>
      )}
      {cameraError && (
        <div className="py-6 shrink-0">
          <button
            onClick={handleClose}
            className="mx-auto block px-6 h-11 bg-white/10 text-white rounded-xl font-bold active:scale-95 transition-transform"
          >
            Tutup Scanner
          </button>
        </div>
      )}

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
