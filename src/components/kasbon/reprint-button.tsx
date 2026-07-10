"use client";

import { useState } from "react";
import type { Transaction } from "@/types";
import { buildReceiptText } from "@/utils/receipt";
import { sendWhatsAppReceipt } from "@/utils/whatsapp";
import { printReceipt, requestPrinter, reconnectPrinter } from "@/utils/bluetooth-printer";
import { usePrinterStore } from "@/stores/use-printer-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useToast } from "@/components/shared/toast-provider";
import { Icon } from "@/lib/icon-map";

interface Props {
  transaction: Transaction;
}

export default function ReprintButton({ transaction }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const { paperWidth, savedDeviceId } = usePrinterStore();
  const { getCustomerById } = useCustomerStore();
  const { toast } = useToast();

  const customer = transaction.customerId ? getCustomerById(transaction.customerId) : null;
  const customerPhone = customer?.phone;

  const handlePrint = async () => {
    setLoading("print");
    try {
      let device: BluetoothDevice | null = null;

      if (savedDeviceId) {
        device = await reconnectPrinter(savedDeviceId);
      }

      if (!device) {
        device = await requestPrinter();
      }

      const receiptText = buildReceiptText({
        items: transaction.items,
        totalAmount: transaction.totalAmount,
        amountPaid: transaction.amountPaid,
        change: transaction.change,
        paymentMethod: transaction.paymentMethod,
        receiptNumber: transaction.receiptNumber ?? "",
        date: transaction.date,
        customerName: customer?.name,
        paperWidth,
      });

      await printReceipt(device, receiptText, paperWidth);
      toast("Nota berhasil dicetak.", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Gagal mencetak nota.",
        "error",
      );
    } finally {
      setLoading(null);
    }
  };

  const handleWhatsApp = () => {
    if (!customerPhone) {
      toast("Nomor WhatsApp pelanggan belum tersedia.", "error");
      return;
    }

    sendWhatsAppReceipt(customerPhone, {
      items: transaction.items,
      totalAmount: transaction.totalAmount,
      amountPaid: transaction.amountPaid,
      change: transaction.change,
      paymentMethod: transaction.paymentMethod,
      receiptNumber: transaction.receiptNumber ?? "",
      date: transaction.date,
      customerName: customer?.name,
      paperWidth,
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-secondary font-bold text-label-md flex items-center gap-1"
      >
        <Icon name="receipt_long" size={16} />
        Cetak Ulang
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-[320px] w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <h3 className="text-headline-md font-bold">Cetak Ulang Nota</h3>
          <p className="text-label-md text-on-surface-variant mt-1">
            {transaction.receiptNumber || "Tanpa nomor nota"}
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={handlePrint}
            disabled={loading === "print"}
            className="w-full h-touch-target-min bg-secondary text-on-secondary rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            <Icon name="print" size={20} />
            {loading === "print" ? "Mencetak..." : "Cetak Nota"}
          </button>
          <button
            onClick={handleWhatsApp}
            disabled={loading === "wa"}
            className={`w-full h-touch-target-min rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 ${
              customerPhone
                ? "border-2 border-secondary text-secondary"
                : "border border-border-standard text-on-surface-variant cursor-not-allowed"
            }`}
          >
            <Icon name="message_circle" size={20} />
            Kirim WhatsApp
          </button>
        </div>

        <button
          onClick={() => setOpen(false)}
          className="w-full h-12 text-on-surface-variant font-bold active:opacity-80"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
