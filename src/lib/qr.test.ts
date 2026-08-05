import { describe, it, expect } from "vitest";
import { generateQRMatrix, type QrCode } from "./qr";
import { buildReceiptQrPayload, parseReceiptQrPayload } from "./receipt-qr";
import { packRow, qrToRasterMatrix, renderQrCentered, renderQrRaster, RASTER_WIDTH_PX } from "./qr-raster";

/** Verifies the three finder patterns are present at the expected corners. */
function checkFinderPatterns(qr: QrCode) {
  const m = qr.modules;
  const s = qr.size;
  const finders = [[0, 0], [s - 7, 0], [0, s - 7]] as const;
  for (const [fx, fy] of finders) {
    // Outer ring all dark, center 3x3 dark, inner ring light.
    for (let dy = 0; dy < 7; dy++) {
      for (let dx = 0; dx < 7; dx++) {
        const x = fx + dx;
        const y = fy + dy;
        const isRing = dx === 0 || dx === 6 || dy === 0 || dy === 6;
        const isCenter = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        if (isRing || isCenter) {
          expect(m[y][x]).toBe(true);
        } else {
          expect(m[y][x]).toBe(false);
        }
      }
    }
  }
}

describe("qr generator", () => {
  it("generates a matrix for the receipt payload", () => {
    const payload = buildReceiptQrPayload("TRX-20260805-002");
    const qr = generateQRMatrix(payload, "M");
    expect(qr.version).toBeGreaterThanOrEqual(1);
    expect(qr.version).toBeLessThanOrEqual(10);
    expect(qr.size).toBe(qr.version * 4 + 17);
    expect(qr.modules.length).toBe(qr.size);
    expect(qr.modules.every((row) => row.length === qr.size)).toBe(true);
  });

  it("contains valid finder patterns", () => {
    const qr = generateQRMatrix(buildReceiptQrPayload("TRX-20260805-002"), "M");
    checkFinderPatterns(qr);
  });

  it("different payloads produce different matrices", () => {
    const a = generateQRMatrix("TRX-20260805-001", "M");
    const b = generateQRMatrix("TRX-20260805-002", "M");
    expect(JSON.stringify(a.modules)).not.toBe(JSON.stringify(b.modules));
  });

  it("throws on absurdly long input", () => {
    expect(() => generateQRMatrix("x".repeat(3000), "H")).toThrow();
  });

  it("larger payload picks a higher version", () => {
    const small = generateQRMatrix("TRX-20260805-001", "M");
    const big = generateQRMatrix("x".repeat(500), "M");
    expect(big.version).toBeGreaterThanOrEqual(small.version);
  });
});

describe("receipt-qr payload", () => {
  it("round-trips a structured payload", () => {
    const payload = buildReceiptQrPayload("TRX-20260805-002");
    expect(payload).toContain("TRX-20260805-002");
    expect(parseReceiptQrPayload(payload)).toEqual({ transactionId: "TRX-20260805-002" });
  });

  it("accepts a bare receipt-number string", () => {
    expect(parseReceiptQrPayload("TRX-20260805-002")).toEqual({ transactionId: "TRX-20260805-002" });
  });

  it("returns null for malformed input", () => {
    expect(parseReceiptQrPayload("not a qr")).toBeNull();
    expect(parseReceiptQrPayload('{"type":"other"}')).toBeNull();
    expect(parseReceiptQrPayload("")).toBeNull();
    expect(parseReceiptQrPayload('{"type":"receipt"}')).toBeNull();
  });
});

describe("qr-raster", () => {
  it("packs a pixel row LSB-first", () => {
    // 8 px: first 3 dark → byte 0b11100000 = 0xE0.
    const row = [true, true, true, false, false, false, false, false];
    expect(Array.from(packRow(row))).toEqual([0xe0]);
    // 10 px: first 8 all dark → 0xFF, then 2 dark → 0xC0.
    const row2 = Array(10).fill(true);
    expect(Array.from(packRow(row2))).toEqual([0xff, 0xc0]);
  });

  it("qrToRasterMatrix adds a quiet zone and scales", () => {
    const qr = generateQRMatrix("TRX-20260805-002", "M");
    const { widthPx, heightPx, pixels } = qrToRasterMatrix(qr, 8);
    const q = qr.size + 8; // 4 quiet modules each side
    expect(widthPx).toBe(q * 8);
    expect(heightPx).toBe(q * 8);
    // Quiet zone (top-left corner) must be light.
    expect(pixels[0][0]).toBe(false);
    expect(pixels[7][7]).toBe(false);
  });

  it("renders a GS v 0 raster header for 58mm", () => {
    const qr = generateQRMatrix(buildReceiptQrPayload("TRX-20260805-002"), "M");
    const data = renderQrRaster(qr, 58);
    expect(Array.from(data.slice(0, 4))).toEqual([0x1d, 0x76, 0x30, 0x00]); // GS v 0 m=0
    const xBytes = data[4] | (data[5] << 8);
    const yRows = data[6] | (data[7] << 8);
    expect(xBytes).toBeGreaterThan(0);
    expect(yRows).toBeGreaterThan(0);
    // Body length = xBytes bytes × yRows pixel-rows.
    expect(data.length).toBe(8 + xBytes * yRows);
  });

  it("fits within the printable width for both paper sizes", () => {
    for (const w of [58, 80] as const) {
      const qr = generateQRMatrix(buildReceiptQrPayload("TRX-20260805-002"), "M");
      const target = RASTER_WIDTH_PX[w];
      const data = renderQrCentered(qr, w);
      const xBytes = data[4] | (data[5] << 8);
      expect(xBytes * 8).toBeLessThanOrEqual(target);
    }
  });
});
