import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PaperWidth } from "@/types";

interface PrinterStore {
  printerName: string;
  paperWidth: PaperWidth;
  savedDeviceId: string | null;
  savedDeviceName: string | null;
  setPrinterName: (name: string) => void;
  setPaperWidth: (width: PaperWidth) => void;
  setSavedDevice: (id: string | null, name: string | null) => void;
}

export const usePrinterStore = create<PrinterStore>()(
  persist(
    (set) => ({
      printerName: "",
      paperWidth: 58,
      savedDeviceId: null,
      savedDeviceName: null,

      setPrinterName: (name) => set({ printerName: name }),
      setPaperWidth: (width) => set({ paperWidth: width }),
      setSavedDevice: (id, name) => set({ savedDeviceId: id, savedDeviceName: name }),
    }),
    {
      name: "printer-config",
    },
  ),
);
