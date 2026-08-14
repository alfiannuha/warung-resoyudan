import { describe, it, expect } from "vitest";
import {
  buildDigitalServiceReceiptText,
  buildDigitalServiceThermalReceiptText,
  buildDigitalServiceWhatsAppReceiptText,
} from "./digital-service-receipt-formatter";
import {
  DIGITAL_SERVICES,
  getServiceConfig,
  getSubServiceLabel,
} from "./digital-services";

const base = {
  serviceType: "pulsa",
  customerIdentifier: "081234567890",
  customerName: "Budi",
  nominalAmount: 20000,
  serviceFee: 1500,
  totalAmount: 21500,
  paymentMethod: "cash" as const,
  receiptNumber: "DSV-20260814-001",
  transactionNumber: "DSV-20260814-001",
  date: "2026-08-14T09:30:00.000Z",
  paperWidth: 58 as const,
};

describe("digital service receipt formatter", () => {
  it("builds a thermal receipt with service info and totals", () => {
    const text = buildDigitalServiceThermalReceiptText(base);
    expect(text).toContain("WARUNG RESOYUDAN");
    expect(text).toContain("No Nota: DSV-20260814-001");
    expect(text).toContain("Transaksi: DSV-20260814-001");
    expect(text).toContain("PULSA");
    expect(text).toContain("No. HP: 081234567890");
    expect(text).toContain("Pelanggan: Budi");
    expect(text).toContain("NOMINAL");
    expect(text).toContain("BIAYA ADMIN");
    expect(text).toContain("TOTAL");
    expect(text).toContain("Terima kasih");
    // No stray tabs — width-based alignment.
    expect(text).not.toContain("\t");
  });

  it("never emits a line wider than the column width", () => {
    const text = buildDigitalServiceThermalReceiptText(base);
    const widths = text.split("\n").map((l) => l.length);
    expect(Math.max(...widths)).toBeLessThanOrEqual(32);
  });

  it("renders 80mm receipts with the wider column count", () => {
    const text = buildDigitalServiceThermalReceiptText({ ...base, paperWidth: 80 });
    const widths = text.split("\n").map((l) => l.length);
    expect(Math.max(...widths)).toBeLessThanOrEqual(48);
  });

  it("shows QRIS label for qris payments and Tunai for cash", () => {
    const qris = buildDigitalServiceThermalReceiptText({
      ...base,
      paymentMethod: "qris",
    });
    expect(qris).toContain("QRIS");
    expect(qris).toContain("Pembayaran Non-Tunai");

    const cash = buildDigitalServiceThermalReceiptText(base);
    expect(cash).toContain("Tunai");
    // "Tunai" must be on its own line (centered), not "Pembayaran Non-Tunai".
    const lines = cash.split("\n");
    expect(lines.some((l) => l.trim() === "Tunai")).toBe(true);
    expect(lines.some((l) => l.trim() === "QRIS")).toBe(false);
  });

  it("omits BIAYA ADMIN line when the fee is zero", () => {
    const text = buildDigitalServiceThermalReceiptText({ ...base, serviceFee: 0 });
    expect(text).not.toContain("BIAYA ADMIN");
    expect(text).toContain("TOTAL");
  });

  it("includes notes when provided", () => {
    const text = buildDigitalServiceThermalReceiptText({ ...base, notes: "Beli token tengah malam" });
    expect(text).toContain("Catatan: Beli token tengah malam");
  });

  it("builds WhatsApp receipts with the same structure and no emoji", () => {
    const text = buildDigitalServiceWhatsAppReceiptText(base);
    expect(text).not.toContain("\t");
    expect(text).toContain("WARUNG RESOYUDAN");
    expect(text).toContain("PULSA");
    expect(text).toContain("TOTAL");
    expect(text).not.toContain("🙏");
  });

  it("renders the sub-service (game) line on thermal receipts", () => {
    const text = buildDigitalServiceThermalReceiptText({
      ...base,
      serviceType: "game_topup",
      subService: "Free Fire",
      customerIdentifier: "1234567890",
    });
    expect(text).toContain("TOP UP GAME");
    expect(text).toContain("Game: Free Fire");
    expect(text).toContain("User ID: 1234567890");
    // No stray tabs — width-based alignment.
    expect(text).not.toContain("\t");
  });

  it("renders the sub-service (game) line on WhatsApp receipts", () => {
    const text = buildDigitalServiceWhatsAppReceiptText({
      ...base,
      serviceType: "game_topup",
      subService: "Mobile Legends",
      customerIdentifier: "987654321",
    });
    expect(text).toContain("Game: Mobile Legends");
    expect(text).not.toContain("🙏");
  });

  it("buildReceiptText dispatches by mode", () => {
    const thermal = buildDigitalServiceReceiptText(base);
    const wa = buildDigitalServiceReceiptText({ ...base, mode: "whatsapp" });
    expect(thermal).toContain("Tunai");
    expect(wa).toContain("Pembayaran Tunai");
  });
});

describe("digital services catalog", () => {
  it("exposes all supported services with required fields", () => {
    const ids = DIGITAL_SERVICES.map((s) => s.id);
    expect(ids).toContain("bpjs");
    expect(ids).toContain("pdam");
    expect(ids).toContain("internet");
    expect(ids).toContain("cable_tv");
    expect(ids).toContain("pln_prepaid");
    expect(ids).toContain("pln_postpaid");
    expect(ids).toContain("pulsa");
    expect(ids).toContain("data");
    expect(ids).toContain("ewallet");
    expect(ids).toContain("transfer");
    expect(ids).toContain("game_topup");
  });

  it("game_topup service exposes game options (Free Fire, Mobile Legends)", () => {
    const cfg = getServiceConfig("game_topup");
    expect(cfg.label).toBe("Top Up Game");
    expect(cfg.options?.length).toBeGreaterThan(0);
    const ids = cfg.options?.map((o) => o.id) ?? [];
    expect(ids).toContain("free_fire");
    expect(ids).toContain("mobile_legends");
    const ff = cfg.options?.find((o) => o.id === "free_fire");
    expect(ff?.label).toBe("Free Fire");
  });

  it("getSubServiceLabel resolves a game label and falls back to the raw id", () => {
    expect(getSubServiceLabel("game_topup", "mobile_legends")).toBe("Mobile Legends");
    expect(getSubServiceLabel("game_topup", "genshin_impact")).toBe("Genshin Impact");
    expect(getSubServiceLabel("pulsa", "not-a-game")).toBe("not-a-game");
    expect(getSubServiceLabel("game_topup", null)).toBeNull();
  });

  it("getServiceConfig resolves a known service and falls back gracefully", () => {
    const pulsa = getServiceConfig("pulsa");
    expect(pulsa.label).toBe("Pulsa");
    expect(pulsa.defaultFee).toBeGreaterThan(0);

    const unknown = getServiceConfig("game_voucher");
    expect(unknown.id).toBe("game_voucher");
    expect(unknown.label).toBe("game_voucher");
    expect(unknown.defaultFee).toBe(0);
  });
});
