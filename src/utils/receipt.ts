import type { CartItem, PaymentMethod, PaperWidth } from "@/types";
import { formatCurrency } from "@/lib/formatters";

const LINE_58 = 32;
const LINE_80 = 48;

function line(width: PaperWidth): number {
  return width === 58 ? LINE_58 : LINE_80;
}

function center(text: string, width: PaperWidth): string {
  const len = line(width);
  const pad = Math.max(0, Math.floor((len - text.length) / 2));
  return " ".repeat(pad) + text;
}

function separator(width: PaperWidth, char = "-"): string {
  return char.repeat(line(width));
}

function wrapItems(
  items: CartItem[],
  width: PaperWidth,
): string[] {
  const result: string[] = [];
  const maxQtyLen = 4;
  const priceWidth = 12;

  for (const item of items) {
    // Item name line
    result.push(item.name);

    // "2 x Rp3.500  =  Rp7.000" or compact for 58mm
    const qty = `${item.quantity}x`;
    const unitPrice = formatCurrency(item.sellPrice);
    const total = formatCurrency(item.subtotal);

    if (width === 58) {
      // 58mm: "2x  Rp3.500  Rp7.000"
      const pricePart = `${unitPrice}`;
      const totalPart = `${total}`;
      const rightSide = `${pricePart}  ${totalPart}`;
      const lineStr = `${qty.padEnd(maxQtyLen)}${rightSide}`;
      result.push(lineStr);
    } else {
      // 80mm: more spacing
      const pricePart = `${unitPrice}`;
      const totalPart = `${total}`;
      const rightSide = `${pricePart.padEnd(priceWidth)}${totalPart}`;
      const lineStr = `${qty.padEnd(maxQtyLen)}${rightSide}`;
      result.push(lineStr);
    }
  }

  return result;
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
}

export function buildReceiptText(params: ReceiptParams): string {
  const { items, totalAmount, amountPaid, change, paymentMethod, receiptNumber, date, customerName, paperWidth } = params;
  const w = paperWidth;
  const l = line(w);
  const isKasbon = paymentMethod === "kasbon";
  const isCash = paymentMethod === "cash";

  const lines: string[] = [];

  // Header
  lines.push("");
  lines.push(center("WARUNG RESOYUDAN", w));
  lines.push(center(receiptNumber, w));

  // Date
  const d = new Date(date);
  const dateStr = d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  lines.push(center(`${dateStr}  ${timeStr} WIB`, w));

  // Customer (kasbon)
  if (customerName) {
    lines.push("");
    lines.push(`Pelanggan: ${customerName}`);
  }
  lines.push("");
  lines.push(separator(w));

  // Kasbon label
  if (isKasbon) {
    lines.push(center("KASBON", w));
    lines.push(separator(w));
  }

  // Items
  const itemLines = wrapItems(items, w);
  lines.push(...itemLines);

  // Total line
  lines.push(separator(w));

  if (isCash && amountPaid > 0) {
    const totalLabel = "TOTAL";
    const totalVal = `${formatCurrency(totalAmount)}`;
    const pad = l - totalLabel.length - totalVal.length - 2;
    lines.push(`${totalLabel}${" ".repeat(Math.max(0, pad))}  ${totalVal}`);

    const paidLabel = "TUNAI";
    const paidVal = `${formatCurrency(amountPaid)}`;
    const paidPad = l - paidLabel.length - paidVal.length - 2;
    lines.push(`${paidLabel}${" ".repeat(Math.max(0, paidPad))}  ${paidVal}`);

    const changeLabel = "KEMBALI";
    const changeVal = `${formatCurrency(change)}`;
    const changePad = l - changeLabel.length - changeVal.length - 2;
    lines.push(`${changeLabel}${" ".repeat(Math.max(0, changePad))}  ${changeVal}`);
  } else if (isKasbon) {
    const label = "TOTAL HUTANG";
    const val = `${formatCurrency(totalAmount)}`;
    const pad = l - label.length - val.length - 2;
    lines.push(`${label}${" ".repeat(Math.max(0, pad))}  ${val}`);
  } else {
    const label = "TOTAL";
    const val = `${formatCurrency(totalAmount)}`;
    const pad = l - label.length - val.length - 2;
    lines.push(`${label}${" ".repeat(Math.max(0, pad))}  ${val}`);
  }

  // QRIS note
  if (paymentMethod === "qris") {
    lines.push("");
    lines.push(center("QRIS", w));
  }

  // Footer
  lines.push(separator(w));
  lines.push("");
  lines.push(center("Terima kasih", w));
  lines.push(center("🙏", w));
  lines.push("");
  lines.push(separator(w, "="));
  lines.push("");

  return lines.join("\n");
}
