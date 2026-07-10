"use client";

import CartItemRow from "@/components/kasir/cart-item";
import PaymentMethod from "@/components/kasir/payment-method";
import CustomerSelect from "@/components/kasir/customer-select";
import QrisPaymentDialog from "@/components/kasir/qris-payment-dialog";
import CashPaymentDialog from "@/components/kasir/cash-payment-dialog";
import ReceiptSuccessDialog from "@/components/kasir/receipt-success-dialog";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import EmptyState from "@/components/shared/empty-state";
import { useToast } from "@/components/shared/toast-provider";
import { Icon } from "@/lib/icon-map";
import { formatCurrency } from "@/lib/formatters";
import { generateReceiptNumber } from "@/lib/receipt-counter";
import { buildReceiptText } from "@/utils/receipt";
import { sendWhatsAppReceipt } from "@/utils/whatsapp";
import { requestPrinter, reconnectPrinter, printReceipt } from "@/utils/bluetooth-printer";
import { usePrinterStore } from "@/stores/use-printer-store";
import { useState } from "react";
import { useCartStore } from "@/stores/use-cart-store";
import { useProductStore } from "@/stores/use-product-store";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const { items, paymentMethod, selectedCustomerId, clearCart } = useCartStore();
  const products = useProductStore((s) => s.products);
  const reduceStock = useProductStore((s) => s.reduceStock);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateDebt = useCustomerStore((s) => s.updateDebt);
  const { toast } = useToast();
  const { paperWidth, savedDeviceId } = usePrinterStore();
  const [showQris, setShowQris] = useState(false);
  const [confirmCheckout, setConfirmCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [showCashPayment, setShowCashPayment] = useState(false);
  const [showReceiptSuccess, setShowReceiptSuccess] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [amountPaid, setAmountPaid] = useState(0);
  const [change, setChange] = useState(0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);
  const totalProfit = items.reduce((sum, i) => sum + i.profit, 0);

  const getSelectedCustomer = () => {
    if (!selectedCustomerId) return undefined;
    return useCustomerStore.getState().customers.find((c) => c.id === selectedCustomerId);
  };

  const customerPhone = getSelectedCustomer()?.phone;

  const handleCheckoutStart = () => {
    if (items.length === 0) return;
    if (paymentMethod === "kasbon" && !selectedCustomerId) {
      setCheckoutError("Silakan pilih pelanggan untuk transaksi kasbon.");
      setConfirmCheckout(true);
      return;
    }
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        setCheckoutError(`Stok ${item.name} tidak mencukupi.`);
        setConfirmCheckout(true);
        return;
      }
    }
    setCheckoutError("");
    setConfirmCheckout(true);
  };

  const handleConfirmTransaction = async () => {
    setConfirmCheckout(false);
    if (checkoutError) return;

    const rn = await generateReceiptNumber();
    setReceiptNumber(rn);
    setAmountPaid(0);
    setChange(0);

    if (paymentMethod === "cash") {
      setShowCashPayment(true);
      return;
    }

    for (const item of items) {
      const ok = await reduceStock(item.productId, item.quantity);
      if (!ok) {
        toast(`Stok ${item.name} tidak mencukupi.`, "error");
        return;
      }
    }

    await addTransaction({
      date: new Date().toISOString(),
      items: items.map((i) => ({ ...i })),
      totalAmount,
      totalProfit,
      paymentMethod,
      status: paymentMethod === "kasbon" ? "debt" : "paid",
      customerId: selectedCustomerId,
      receiptNumber: rn,
      amountPaid: 0,
      change: 0,
    });

    if (paymentMethod === "kasbon" && selectedCustomerId) {
      await updateDebt(selectedCustomerId, totalAmount);
    }

    if (paymentMethod === "qris") {
      setShowQris(true);
      return;
    }

    setShowReceiptSuccess(true);
  };

  const handleCashPaymentConfirm = async (paid: number) => {
    setShowCashPayment(false);
    const chg = paid - totalAmount;
    setAmountPaid(paid);
    setChange(chg);

    for (const item of items) {
      const ok = await reduceStock(item.productId, item.quantity);
      if (!ok) {
        toast(`Stok ${item.name} tidak mencukupi.`, "error");
        return;
      }
    }

    await addTransaction({
      date: new Date().toISOString(),
      items: items.map((i) => ({ ...i })),
      totalAmount,
      totalProfit,
      paymentMethod: "cash",
      status: "paid",
      customerId: null,
      receiptNumber,
      amountPaid: paid,
      change: chg,
    });

    setShowReceiptSuccess(true);
  };

  const handleQrisConfirm = () => {
    setShowQris(false);
    setShowReceiptSuccess(true);
  };

  const handleQrisClose = () => {
    setShowQris(false);
    clearCart();
    router.push("/");
    toast("Transaksi QRIS dibatalkan.", "info");
  };

  const handleReceiptDone = () => {
    clearCart();
    setShowReceiptSuccess(false);
    router.push("/");
    toast("Transaksi berhasil disimpan!");
  };

  const handlePrint = async () => {
    try {
      let device = savedDeviceId ? await reconnectPrinter(savedDeviceId) : null;
      if (!device) {
        device = await requestPrinter();
      }

      const customer = getSelectedCustomer();
      const receiptText = buildReceiptText({
        items,
        totalAmount,
        amountPaid,
        change,
        paymentMethod,
        receiptNumber,
        date: new Date().toISOString(),
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
    }
  };

  const handleWhatsApp = () => {
    if (!customerPhone) {
      toast("Nomor WhatsApp pelanggan belum tersedia.", "error");
      return;
    }
    const customer = getSelectedCustomer();
    sendWhatsAppReceipt(customerPhone, {
      items,
      totalAmount,
      amountPaid,
      change,
      paymentMethod,
      receiptNumber,
      date: new Date().toISOString(),
      customerName: customer?.name,
      paperWidth,
    });
  };

  if (items.length === 0) {
    return <EmptyState icon="shopping_cart" message="Keranjang masih kosong" />;
  }

  const checkoutMessage =
    checkoutError ||
    (paymentMethod === "qris"
      ? `Lanjutkan pembayaran QRIS sebesar ${formatCurrency(totalAmount)}?`
      : paymentMethod === "kasbon"
      ? `Simpan transaksi kasbon sebesar ${formatCurrency(totalAmount)}?`
      : `Simpan transaksi tunai sebesar ${formatCurrency(totalAmount)}?`);

  return (
    <div className="mt-4 pb-8 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="touch-target w-10 h-10 flex items-center justify-center rounded-full border border-border-standard active:bg-surface-container transition-colors"
          aria-label="Kembali"
        >
          <Icon name="chevron_right" size={20} className="rotate-180" />
        </button>
        <h1 className="text-headline-md font-bold">Keranjang ({totalItems})</h1>
        <button onClick={clearCart} className="ml-auto text-danger-alert text-label-md font-bold">
          Kosongkan
        </button>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <CartItemRow key={item.productId} item={item} />
        ))}
      </div>

      {/* Payment & Checkout */}
      <div className="space-y-4">
        <PaymentMethod />
        <CustomerSelect />

        <div className="flex items-center justify-between pt-4 border-t border-border-standard">
          <span className="text-on-surface-variant text-body-md">Total Pembayaran</span>
          <span className="text-headline-md font-extrabold text-secondary">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        <button
          onClick={handleCheckoutStart}
          className="w-full touch-target bg-secondary text-white font-bold text-body-lg rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Icon name="check_circle" />
          {paymentMethod === "qris" ? "Bayar QRIS" : "Simpan Transaksi"}
        </button>
      </div>

      {/* Cash Payment Dialog */}
      <CashPaymentDialog
        open={showCashPayment}
        totalAmount={totalAmount}
        onConfirm={handleCashPaymentConfirm}
        onCancel={() => setShowCashPayment(false)}
      />

      {/* QRIS Dialog */}
      <QrisPaymentDialog
        open={showQris}
        amount={totalAmount}
        onConfirm={handleQrisConfirm}
        onClose={handleQrisClose}
      />

      {/* Receipt Success Dialog */}
      <ReceiptSuccessDialog
        open={showReceiptSuccess}
        receiptNumber={receiptNumber}
        totalAmount={totalAmount}
        amountPaid={amountPaid}
        change={change}
        paymentMethod={paymentMethod}
        customerPhone={customerPhone}
        onPrint={handlePrint}
        onWhatsApp={handleWhatsApp}
        onDone={handleReceiptDone}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmCheckout}
        onOpenChange={setConfirmCheckout}
        title={checkoutError ? "Perhatian" : "Konfirmasi Transaksi"}
        description={checkoutMessage}
        confirmLabel={checkoutError ? "Tutup" : "Simpan"}
        variant={checkoutError ? "danger" : "default"}
        onConfirm={handleConfirmTransaction}
      />
    </div>
  );
}
