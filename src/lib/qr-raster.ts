import type { PaperWidth } from "@/types";
import type { QrCode } from "./qr";

/**
 * Converts a QR module matrix into a 1-bit raster for ESC/POS thermal
 * printing via the raster command `GS v 0 m xL xH yL yH d1...dk`.
 *
 * Widths: 384px for 58mm, 576px for 80mm. The module size is chosen so
 * the QR (plus a 4-module quiet zone) fits the printable width while
 * staying as large as possible for reliable scanning.
 */

export const RASTER_WIDTH_PX: Record<PaperWidth, number> = {
  58: 384,
  80: 576,
};

const QUIET_ZONE_MODULES = 4;

/**
 * Scales a QR matrix to `moduleSize` px per module with a quiet zone.
 * Returns { widthPx, heightPx, pixels } where pixels[y][x] = true = dark.
 */
export function qrToRasterMatrix(
  qr: QrCode,
  moduleSize: number,
): { widthPx: number; heightPx: number; pixels: boolean[][] } {
  const q = qr.size + QUIET_ZONE_MODULES * 2;
  const widthPx = q * moduleSize;
  const heightPx = q * moduleSize;
  const pixels: boolean[][] = Array.from({ length: heightPx }, () => new Array(widthPx).fill(false));

  for (let my = 0; my < qr.size; my++) {
    for (let mx = 0; mx < qr.size; mx++) {
      const dark = qr.modules[my][mx];
      if (!dark) continue;
      const x0 = (mx + QUIET_ZONE_MODULES) * moduleSize;
      const y0 = (my + QUIET_ZONE_MODULES) * moduleSize;
      for (let dy = 0; dy < moduleSize; dy++) {
        for (let dx = 0; dx < moduleSize; dx++) {
          pixels[y0 + dy][x0 + dx] = true;
        }
      }
    }
  }
  return { widthPx, heightPx, pixels };
}

/**
 * Packs a boolean pixel row into bytes, 8 px per byte, LSB-first
 * (bit 0 = leftmost pixel).
 */
export function packRow(pixels: boolean[]): Uint8Array {
  const out = new Uint8Array(Math.ceil(pixels.length / 8));
  for (let i = 0; i < pixels.length; i++) {
    if (pixels[i]) out[i >> 3] |= 0x80 >> (i & 7);
  }
  return out;
}

/**
 * Renders a QR as an ESC/POS `GS v 0` raster command.
 * `paperWidth` picks the target raster width (384/576px). The module size
 * is derived from the QR version so the whole image fits the width.
 */
export function renderQrRaster(
  qr: QrCode,
  paperWidth: PaperWidth,
): Uint8Array {
  const targetWidth = RASTER_WIDTH_PX[paperWidth];
  const qWithQuiet = qr.size + QUIET_ZONE_MODULES * 2;
  const moduleSize = Math.max(2, Math.floor(targetWidth / qWithQuiet));
  const { widthPx, heightPx, pixels } = qrToRasterMatrix(qr, moduleSize);

  const xBytes = Math.ceil(widthPx / 8);
  const yRows = heightPx; // one byte-row per pixel row (1px vertical resolution)

  const header = [
    0x1d, 0x76, 0x30, 0x00, // GS v 0 m=0 (normal)
    xBytes & 0xff, (xBytes >> 8) & 0xff, // xL xH
    yRows & 0xff, (yRows >> 8) & 0xff, // yL yH
  ];

  const body: number[] = [];
  for (let y = 0; y < heightPx; y++) {
    const packed = packRow(pixels[y]);
    for (let i = 0; i < packed.length; i++) body.push(packed[i]);
  }

  const out = new Uint8Array(header.length + body.length);
  out.set(header, 0);
  out.set(body, header.length);
  return out;
}

/** Renders a QR raster centered within the printable column width. */
export function renderQrCentered(qr: QrCode, paperWidth: PaperWidth): Uint8Array {
  const targetWidth = RASTER_WIDTH_PX[paperWidth];
  const qWithQuiet = qr.size + QUIET_ZONE_MODULES * 2;
  const moduleSize = Math.max(2, Math.floor(targetWidth / qWithQuiet));
  const { widthPx, heightPx, pixels } = qrToRasterMatrix(qr, moduleSize);

  // Center horizontally by left-padding whole bytes.
  const xBytes = Math.ceil(widthPx / 8);
  const padBytes = Math.floor((Math.ceil(targetWidth / 8) - xBytes) / 2);
  const yRows = heightPx; // one byte-row per pixel row

  const header = [
    0x1d, 0x76, 0x30, 0x00,
    xBytes & 0xff, (xBytes >> 8) & 0xff,
    yRows & 0xff, (yRows >> 8) & 0xff,
  ];

  const body: number[] = [];
  for (let y = 0; y < heightPx; y++) {
    for (let p = 0; p < padBytes; p++) body.push(0x00);
    const packed = packRow(pixels[y]);
    for (let i = 0; i < packed.length; i++) body.push(packed[i]);
  }

  const out = new Uint8Array(header.length + body.length);
  out.set(header, 0);
  out.set(body, header.length);
  return out;
}
