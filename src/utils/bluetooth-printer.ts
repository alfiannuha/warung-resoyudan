import type { PaperWidth } from "@/types";

// ESC/POS commands
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

function escPos(...args: number[]): Uint8Array {
  return new Uint8Array(args);
}

function textToBytes(text: string, encoding: string = "windows-1252"): Uint8Array {
  // Fallback: encode char by char for simple ASCII + extended chars
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 128) {
      bytes.push(code);
    } else if (code === 0x0a) {
      bytes.push(0x0a);
    } else {
      // Replace non-ASCII with spaces
      bytes.push(0x20);
    }
  }
  return new Uint8Array(bytes);
}

/**
 * Builds full ESC/POS byte stream for a receipt.
 */
function buildEscPosData(text: string, paperWidth: PaperWidth): Uint8Array {
  const chunks: Uint8Array[] = [];

  // Initialize printer
  chunks.push(escPos(ESC, 0x40)); // ESC @

  // Character encoding: PC437 (standard)
  chunks.push(escPos(ESC, 0x74, 0x00)); // ESC t n

  // Line spacing: default
  chunks.push(escPos(ESC, 0x32)); // ESC 2

  // Center alignment for header
  chunks.push(escPos(ESC, 0x61, 0x01)); // ESC a n (1=center)

  // Bold on for store name
  chunks.push(escPos(ESC, 0x45, 0x01)); // ESC E n (bold on)

  // Write the text
  const lines = text.split("\n");
  for (const line of lines) {
    const lineBytes = textToBytes(line);
    chunks.push(lineBytes);
    chunks.push(escPos(LF));
  }

  // Bold off
  chunks.push(escPos(ESC, 0x45, 0x00)); // ESC E n (bold off)

  // Feed and cut
  chunks.push(escPos(ESC, 0x64, 0x04)); // ESC d n (feed 4 lines)
  chunks.push(escPos(GS, 0x56, 0x00)); // GS V m (partial cut)

  // Calculate total length
  const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

/**
 * Finds the ESC/POS service UUID from the Bluetooth device characteristics.
 * Common UUIDs: 000018f0-0000-1000-8000-00805f9b34fb (standard POS), or 0000ff00-0000-1000-8000-00805f9b34fb
 */
function findPrintCharacteristic(service: BluetoothRemoteGATTService): Promise<BluetoothRemoteGATTCharacteristic | null> {
  return service.getCharacteristics().then((chars) => {
    // Look for the write characteristic — usually the first one with "write" property
    const writeChar = chars.find((c) => c.properties.write || c.properties.writeWithoutResponse);
    return writeChar || null;
  });
}

/**
 * Converts a Bluetooth device to a storable serialized ID.
 * Uses device.id (which is unique and stable per origin).
 */
export function serializeDeviceId(device: BluetoothDevice): string {
  return device.id;
}

/**
 * Requests a Bluetooth printer device from the user.
 */
export async function requestPrinter(): Promise<BluetoothDevice> {
  if (!navigator.bluetooth) {
    throw new Error("Web Bluetooth tidak didukung di browser ini.");
  }

  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [
      "000018f0-0000-1000-8000-00805f9b34fb",
      "0000ff00-0000-1000-8000-00805f9b34fb",
      "0000180f-0000-1000-8000-00805f9b34fb",
    ],
  });

  return device;
}

/**
 * Attempts to reconnect to a printer using a stored device ID.
 * Web Bluetooth API does not support reconnecting by ID directly,
 * so we request the device again. The browser remembers paired devices.
 */
export async function reconnectPrinter(savedDeviceId: string): Promise<BluetoothDevice | null> {
  if (!navigator.bluetooth) return null;

  try {
    // Request device again — the browser shows "already paired" list
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        "000018f0-0000-1000-8000-00805f9b34fb",
        "0000ff00-0000-1000-8000-00805f9b34fb",
        "0000180f-0000-1000-8000-00805f9b34fb",
      ],
    });

    return device;
  } catch {
    return null;
  }
}

/**
 * Prints a receipt text to a Bluetooth thermal printer.
 */
export async function printReceipt(
  device: BluetoothDevice,
  text: string,
  paperWidth: PaperWidth,
): Promise<void> {
  if (!device.gatt) {
    throw new Error("Printer tidak terhubung.");
  }

  const server = await device.gatt.connect();
  const services = await server.getPrimaryServices();
  let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  // Find the printable service
  for (const service of services) {
    characteristic = await findPrintCharacteristic(service);
    if (characteristic) break;
  }

  if (!characteristic) {
    throw new Error("Tidak dapat menemukan karakteristik printer.");
  }

  const escPosData = buildEscPosData(text, paperWidth);

  // Write data in chunks (max 512 bytes per write)
  const chunkSize = 512;
  for (let i = 0; i < escPosData.length; i += chunkSize) {
    const chunk = escPosData.slice(i, i + chunkSize);
    await characteristic.writeValue(chunk);
  }

  // Disconnect
  device.gatt.disconnect();
}

/**
 * Prints a test page.
 */
export async function testPrint(device: BluetoothDevice): Promise<void> {
  const lines: string[] = [
    "",
    "  WARUNG RESOYUDAN",
    "  ================",
    "",
    "     TEST PRINT",
    "     ---------",
    "",
    "  Printer: " + (device.name || "N/A"),
    "",
    "  Normal text",
    "  Bold text",
    "",
    "  Alignment:",
    "  Left",
    "                Center",
    "                         Right",
    "",
    "  A B C D E F G H I J K L M",
    "  N O P Q R S T U V W X Y Z",
    "  0 1 2 3 4 5 6 7 8 9",
    "",
    "  Jika teks ini terbaca",
    "  dengan jelas, printer",
    "  berfungsi dengan baik!",
    "",
    "",
    "  Terima kasih",
    "  ============",
    "",
  ];

  const text = lines.join("\n");
  await printReceipt(device, text, 58);
}
