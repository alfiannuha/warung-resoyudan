import type { CartItem, PaymentMethod, PaperWidth } from "@/types";
import { formatCurrency } from "@/lib/formatters";

const LINE_58 = 32;
const LINE_80 = 48;
const LINE_WA = 40;

function line(width: PaperWidth): number {
  return width === 58 ? LINE_58 : LINE_80;
}

function center(text: string, w: number, padChar = " "): string {
  const pad = Math.max(0, Math.floor((w - text.length) / 2));
  return padChar.repeat(pad) + text;
}

function separator(w: number, char = "-"): string {
  return char.repeat(w);
}

export interface ReceiptParams {
  items: CartItem[];
  totalAmount: number;
  amountPaid: number;
  change: number;
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  date: string;
  customerName?: string;
  paperWidth: PaperWidth;
  mode?: "thermal" | "whatsapp";
}

function buildThermalReceipt(params: ReceiptParams): string {
  const { items, totalAmount, amountPaid, change, paymentMethod, receiptNumber, date, customerName, paperWidth } = params;
  const w = line(paperWidth);
  const isKasbon = paymentMethod === "kasbon";
  const isCash = paymentMethod === "cash";

  const lines: string[] = [];

  lines.push("");
  lines.push(center("WARUNG RESOYUDAN", w));
  lines.push(center(receiptNumber, w));

  const d = new Date(date);
  const dateStr = d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  lines.push(center(`${dateStr}  ${timeStr} WIB`, w));

  if (customerName) {
    lines.push("");
    lines.push(`Pelanggan: ${customerName}`);
  }
  lines.push("");
  lines.push(separator(w));

  if (isKasbon) {
    lines.push(center("KASBON", w));
    lines.push(separator(w));
  }

  // Items
  for (const item of items) {
    lines.push(item.name);
    const lineStr = `${item.quantity}x  ${formatCurrency(item.sellPrice)}  ${formatCurrency(item.subtotal)}`;
    lines.push(lineStr);
  }

  lines.push(separator(w));

  const printPair = (label: string, value: string) => {
    const pad = w - label.length - value.length - 2;
    lines.push(`${label}${" ".repeat(Math.max(0, pad))}  ${value}`);
  };

  if (isCash && amountPaid > 0) {
    printPair("TOTAL", formatCurrency(totalAmount));
    printPair("TUNAI", formatCurrency(amountPaid));
    printPair("KEMBALI", formatCurrency(change));
  } else if (isKasbon) {
    printPair("TOTAL HUTANG", formatCurrency(totalAmount));
  } else {
    printPair("TOTAL", formatCurrency(totalAmount));
  }

  if (paymentMethod === "qris") {
    lines.push("");
    lines.push(center("QRIS", w));
  }

  lines.push(separator(w));
  lines.push("");
  lines.push(center("Terima kasih", w));
  lines.push(center("🙏", w));
  lines.push("");
  lines.push(separator(w, "="));
  lines.push("");

  return lines.join("\n");
}

function buildWhatsAppReceipt(params: ReceiptParams): string {
  const { items, totalAmount, amountPaid, change, paymentMethod, receiptNumber, date, customerName } = params;
  const w = 32;
  const sep = "-".repeat(w);
  const isKasbon = paymentMethod === "kasbon";
  const isCash = paymentMethod === "cash";

  const lines: string[] = [];

  const d = new Date(date);
  const dateStr = d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  if (isKasbon) {
    lines.push("WARUNG RESOYUDAN");
    lines.push("");
    lines.push("No Nota");
    lines.push(receiptNumber);
    lines.push("");
    lines.push("Tanggal");
    lines.push(`${dateStr} ${timeStr} WIB`);
    if (customerName) {
      lines.push("");
      lines.push("PELANGGAN");
      lines.push(customerName);
    }
    lines.push("");
    lines.push("STATUS");
    lines.push("*KASBON*");
    lines.push("");
    lines.push(sep);
    lines.push("");

    for (const item of items) {
      lines.push(item.name);
      lines.push(`${item.quantity} x ${formatCurrency(item.sellPrice)}${formatCurrency(item.subtotal)}`);
      lines.push("");
    }

    lines.push(sep);
    lines.push("");
    const pl = (label: string, value: string) => {
      lines.push(`${label.padEnd(14)}${value}`);
    };
    pl("TOTAL HUTANG", formatCurrency(totalAmount));
    lines.push("");
    lines.push(sep);
    lines.push("");
    lines.push("Mohon dilunasi sesuai");
    lines.push("kesepakatan bersama.");
    lines.push("");
    lines.push("Terima Kasih");
  } else {
    lines.push("🧾 WARUNG RESOYUDAN");
    lines.push("");
    lines.push("No Nota");
    lines.push(receiptNumber);
    lines.push("");
    lines.push("Tanggal");
    lines.push(`${dateStr} ${timeStr} WIB`);
    if (customerName) {
      lines.push("");
      lines.push(`Pelanggan: ${customerName}`);
    }
    lines.push("");
    lines.push(sep);
    lines.push("");

    for (const item of items) {
      lines.push(item.name);
      lines.push(`${item.quantity} x ${formatCurrency(item.sellPrice)}${formatCurrency(item.subtotal)}`);
      lines.push("");
    }

    lines.push(sep);

    const pl = (label: string, value: string) => {
      lines.push(`${label.padEnd(14)}${value}`);
    };

    pl("Subtotal", formatCurrency(totalAmount));

    if (isCash && amountPaid > 0) {
      lines.push("");
      pl("Bayar", formatCurrency(amountPaid));
      pl("Kembalian", formatCurrency(change));
    }

    lines.push("");
    lines.push(sep);
    lines.push("");
    pl("Total", formatCurrency(totalAmount));
    lines.push("");
    lines.push("🙏 Terima kasih telah berbelanja.");
    lines.push("");
    lines.push("Warung Resoyudan");
    lines.push("Catat. Kelola. Tumbuh.");
  }

  return lines.join("\n");
}

function printWA(label: string, value: string, lines: string[], w: number) {
  const pad = w - label.length - value.length;
  lines.push(`${label}${" ".repeat(Math.max(0, pad))}${value}`);
}

export function buildReceiptText(params: ReceiptParams): string {
  if (params.mode === "whatsapp") {
    return buildWhatsAppReceipt(params);
  }
  return buildThermalReceipt(params);
}
