"use client";

import { useState } from "react";
import { usePrinterStore } from "@/stores/use-printer-store";
import { requestPrinter, reconnectPrinter, testPrint } from "@/utils/bluetooth-printer";
import { useToast } from "@/components/shared/toast-provider";
import { Icon } from "@/lib/icon-map";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const {
    printerName,
    paperWidth,
    savedDeviceId,
    savedDeviceName,
    setPrinterName,
    setPaperWidth,
    setSavedDevice,
  } = usePrinterStore();
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);

  const isConnected = !!savedDeviceId;

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const device = await requestPrinter();
      setSavedDevice(device.id, device.name ?? null);
      if (!printerName && device.name) {
        setPrinterName(device.name);
      }
      toast(`Printer "${device.name || "Tanpa nama"}" terhubung.`, "success");
    } catch (err) {
      if (err instanceof Error && err.name !== "NotFoundError") {
        toast("Gagal menghubungkan printer.", "error");
      }
      // NotFoundError = user cancelled
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setSavedDevice(null, null);
    toast("Printer diputuskan.", "info");
  };

  const handleTestPrint = async () => {
    if (!savedDeviceId) {
      toast("Hubungkan printer terlebih dahulu.", "error");
      return;
    }
    setTesting(true);
    try {
      const device = await reconnectPrinter(savedDeviceId);
      if (!device) {
        toast("Gagal terhubung ke printer. Hubungkan ulang.", "error");
        return;
      }
      await testPrint(device);
      toast("Test print berhasil dikirim.", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Gagal mencetak test.",
        "error",
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-[480px] mx-auto pt-4 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="touch-target w-10 h-10 flex items-center justify-center rounded-full border border-border-standard active:bg-surface-container transition-colors"
          aria-label="Kembali"
        >
          <Icon name="chevron_right" size={20} className="rotate-180" />
        </button>
        <h1 className="text-headline-md font-bold">Pengaturan Printer</h1>
      </div>

      {/* Printer Name */}
      <section className="space-y-2">
        <label className="text-label-md text-on-surface-variant font-bold block">
          Nama Printer
        </label>
        <input
          value={printerName}
          onChange={(e) => setPrinterName(e.target.value)}
          className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none text-body-md"
          placeholder="XPrinter XP-58"
        />
      </section>

      {/* Paper Width */}
      <section className="space-y-2">
        <label className="text-label-md text-on-surface-variant font-bold block">
          Lebar Kertas
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setPaperWidth(58)}
            className={`flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${
              paperWidth === 58
                ? "bg-secondary text-on-secondary"
                : "border border-border-standard text-on-surface-variant"
            }`}
          >
            <Icon name="receipt" size={18} />
            58 mm
          </button>
          <button
            onClick={() => setPaperWidth(80)}
            className={`flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${
              paperWidth === 80
                ? "bg-secondary text-on-secondary"
                : "border border-border-standard text-on-surface-variant"
            }`}
          >
            <Icon name="receipt" size={18} />
            80 mm
          </button>
        </div>
      </section>

      {/* Separator */}
      <div className="border-t border-border-standard" />

      {/* Bluetooth Device */}
      <section className="space-y-3">
        <label className="text-label-md text-on-surface-variant font-bold block">
          Perangkat Bluetooth
        </label>

        {/* Status */}
        <div className="p-4 border border-border-standard rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-success-paid" : "bg-outline"}`} />
            <div>
              <p className="text-body-md font-bold">
                {isConnected ? savedDeviceName || "Printer terdaftar" : "Belum terhubung"}
              </p>
              {isConnected && (
                <p className="text-xs text-on-surface-variant">ID: {savedDeviceId?.slice(0, 18)}...</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="w-full h-touch-target-min border border-danger-alert text-danger-alert rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Icon name="delete" size={20} />
              Putuskan Printer
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full h-touch-target-min bg-secondary text-on-secondary rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              <Icon name="bluetooth" size={20} />
              {connecting ? "Menghubungkan..." : "Hubungkan Printer"}
            </button>
          )}

          <button
            onClick={handleTestPrint}
            disabled={!isConnected || testing}
            className="w-full h-touch-target-min border-2 border-secondary text-secondary rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="print" size={20} />
            {testing ? "Mencetak..." : "Cetak Test"}
          </button>
        </div>
      </section>
    </div>
  );
}
