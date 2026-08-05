import { usePrinterStore } from "@/stores/use-printer-store";

/**
 * PrinterManager — persistent Bluetooth thermal-printer connection.
 *
 * Responsibilities:
 *  - remembers the user's preferred printer (via usePrinterStore)
 *  - reuses a live GATT connection instead of re-pairing every print
 *  - reconnects ONLY when the connection is actually lost
 *  - discovers and caches the write characteristic once
 *  - writes ESC/POS data in bounded chunks (512 bytes)
 *  - surfaces a meaningful status for the settings page
 *
 * The browser's pairing dialog only appears on the first connect or when
 * the bond is invalidated — never on routine prints.
 */

const WRITE_CHUNK_SIZE = 512;

/** Service UUIDs commonly used by ESC/POS thermal printers. */
const PRINT_SERVICE_UUIDS = [
  "000018f0-0000-1000-8000-00805f9b34fb", // standard POS
  "0000ff00-0000-1000-8000-00805f9b34fb", // vendor BLE
  "0000180f-0000-1000-8000-00805f9b34fb", // battery? (fallback)
] as const;

export type PrinterStatus = "unavailable" | "disconnected" | "connecting" | "connected" | "busy";

export interface PrinterManagerState {
  status: PrinterStatus;
  deviceName: string | null;
}

export interface PrintError extends Error {
  kind:
    | "unsupported"
    | "not-found"
    | "connection-lost"
    | "bluetooth-off"
    | "no-printer"
    | "unknown";
}

function makeError(kind: PrintError["kind"], message: string): PrintError {
  const err = new Error(message) as PrintError;
  err.kind = kind;
  return err;
}

function isWebBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.bluetooth;
}

class PrinterManager {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private status: PrinterStatus = "disconnected";
  private deviceName: string | null = null;
  private connecting: Promise<BluetoothRemoteGATTCharacteristic | null> | null = null;

  getState(): PrinterManagerState {
    return { status: this.status, deviceName: this.deviceName };
  }

  getStatus(): PrinterStatus {
    return this.status;
  }

  /** True when we hold a live, connected GATT server. */
  isConnected(): boolean {
    return !!this.device?.gatt?.connected && !!this.characteristic;
  }

  private setStatus(status: PrinterStatus) {
    this.status = status;
  }

  private setDevice(device: BluetoothDevice | null, name: string | null) {
    this.device = device;
    this.deviceName = name;
  }

  /**
   * Resolves the characteristic for the saved/connected printer.
   * Reuses the live connection when possible; only reconnects when lost;
   * falls back to the chooser only when no printer is saved.
   */
  async getCharacteristic(): Promise<BluetoothRemoteGATTCharacteristic | null> {
    // Already connected — reuse.
    if (this.device?.gatt?.connected && this.characteristic) {
      this.setStatus("connected");
      return this.characteristic;
    }

    // A connect is already in flight — share it (no double pairing).
    if (this.connecting) return this.connecting;

    const savedId = usePrinterStore.getState().savedDeviceId;

    // No saved printer → ask the user (first-time setup).
    if (!savedId) {
      this.setStatus("disconnected");
      return null;
    }

    // Reconnect the saved device WITHOUT the chooser by re-requesting it
    // via the same options the browser remembers as bonded.
    this.setStatus("connecting");
    this.connecting = this.connectSaved(savedId);
    try {
      return await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  /** Reconnects to the saved device WITHOUT showing the chooser. */
  private async connectSaved(
    savedId: string,
  ): Promise<BluetoothRemoteGATTCharacteristic | null> {
    if (!isWebBluetoothSupported()) {
      this.setStatus("unavailable");
      return null;
    }

    try {
      // Preferred path: find the already-granted device via getDevices() —
      // this never shows the pairing/chooser dialog.
      const known = await navigator.bluetooth.getDevices();
      const saved = known.find((d) => d.id === savedId);

      if (saved) {
        try {
          return await this.connect(saved);
        } catch {
          // Connect failed (printer off / out of range) — don't show a
          // chooser; report the failure to the caller.
          this.setStatus("disconnected");
          return null;
        }
      }

      // Fallback: the device was forgotten by the browser — the chooser is
      // the only way to re-grant access (first-time pairing).
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [...PRINT_SERVICE_UUIDS],
      });

      if (savedId && device.id !== savedId) {
        usePrinterStore.getState().setSavedDevice(device.id, device.name ?? null);
      }

      return await this.connect(device);
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      // NotFoundError = user cancelled the chooser.
      if (name === "NotFoundError") return null;
      this.setStatus("disconnected");
      return null;
    }
  }

  /** Connects a raw device from the settings "Hubungkan" button. */
  async connect(
    device: BluetoothDevice,
  ): Promise<BluetoothRemoteGATTCharacteristic | null> {
    if (!isWebBluetoothSupported()) {
      this.setStatus("unavailable");
      throw makeError("unsupported", "Web Bluetooth tidak didukung di browser ini.");
    }

    this.setStatus("connecting");
    this.setDevice(device, device.name ?? null);

    // Remember the bond (persisted) so future prints skip the chooser.
    // Note: we do NOT auto-save the device name as the store name — the
    // receipt store name is a fixed constant, never the printer's label.
    const state = usePrinterStore.getState();
    state.setSavedDevice(device.id, device.name ?? null);

    try {
      const server = device.gatt
        ? device.gatt.connected
          ? device.gatt
          : await device.gatt.connect()
        : null;
      if (!server) {
        throw makeError("connection-lost", "Printer tidak terhubung.");
      }

      // Watch for drops so we clear the cache and reconnect cleanly later.
      device.addEventListener("gattserverdisconnected", () => {
        this.characteristic = null;
        this.setStatus("disconnected");
      });

      const characteristic = await this.discoverWriteCharacteristic(server);
      if (!characteristic) {
        throw makeError("not-found", "Tidak dapat menemukan karakteristik printer.");
      }

      this.characteristic = characteristic;
      this.setStatus("connected");
      return characteristic;
    } catch (err) {
      this.characteristic = null;
      this.setStatus("disconnected");
      throw err;
    }
  }

  /** Finds the write characteristic across the printer's services. */
  private async discoverWriteCharacteristic(
    server: BluetoothRemoteGATTServer,
  ): Promise<BluetoothRemoteGATTCharacteristic | null> {
    try {
      const services = await server.getPrimaryServices();
      for (const service of services) {
        const chars = await service.getCharacteristics();
        const writeChar = chars.find(
          (c) => c.properties.write || c.properties.writeWithoutResponse,
        );
        if (writeChar) return writeChar;
      }
      return null;
    } catch {
      // Some printers need a specific service lookup instead.
      for (const uuid of PRINT_SERVICE_UUIDS) {
        try {
          const service = await server.getPrimaryService(uuid);
          const chars = await service.getCharacteristics();
          const writeChar = chars.find(
            (c) => c.properties.write || c.properties.writeWithoutResponse,
          );
          if (writeChar) return writeChar;
        } catch {
          // continue to next UUID
        }
      }
      return null;
    }
  }

  /**
   * Writes ESC/POS bytes to the connected printer in bounded chunks.
   * Prefers writeWithoutResponse (fast path) when the characteristic
   * supports it; falls back to writeWithResponse.
   */
  async write(data: Uint8Array): Promise<void> {
    if (!this.characteristic) {
      throw makeError("no-printer", "Printer tidak terhubung.");
    }

    const useFastPath = this.characteristic.properties.writeWithoutResponse;

    for (let offset = 0; offset < data.length; offset += WRITE_CHUNK_SIZE) {
      const chunk = data.slice(offset, offset + WRITE_CHUNK_SIZE);
      const view = new Uint8Array(chunk);
      if (useFastPath) {
        await this.characteristic.writeValueWithoutResponse(view);
      } else {
        await this.characteristic.writeValue(view);
      }
    }
  }

  /** Releases the connection (settings "Putuskan Printer"). */
  disconnect(): void {
    this.characteristic = null;
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.setDevice(null, null);
    this.setStatus("disconnected");
    usePrinterStore.getState().setSavedDevice(null, null);
  }

  /** Disconnect without clearing the saved preference (transient drop). */
  private clearCacheOnly(): void {
    this.characteristic = null;
    this.setStatus("disconnected");
  }

  /** Forgets the live connection (used after a failed print). */
  resetConnection(): void {
    this.clearCacheOnly();
  }
}

/** Singleton — one connection shared across the whole app. */
export const printerManager = new PrinterManager();
