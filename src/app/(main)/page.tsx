"use client";

import { useState, useCallback, useEffect } from "react";
import KasirHeader from "@/components/kasir/kasir-header";
import ProductGrid from "@/components/kasir/product-grid";
import CartBar from "@/components/kasir/cart-bar";
import CartDrawer from "@/components/kasir/cart-drawer";
import CartItemRow from "@/components/kasir/cart-item";
import PaymentMethod from "@/components/kasir/payment-method";
import CustomerSelect from "@/components/kasir/customer-select";
import QrisPaymentDialog from "@/components/kasir/qris-payment-dialog";
import CashPaymentDialog from "@/components/kasir/cash-payment-dialog";
import ReceiptSuccessDialog from "@/components/kasir/receipt-success-dialog";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import EmptyState from "@/components/shared/empty-state";
import ScannerDialog from "@/components/shared/scanner-dialog";
import { useToast } from "@/components/shared/toast-provider";
import FlyingBalls from "@/components/kasir/flying-balls";
import { Icon } from "@/lib/icon-map";
import { formatCurrency } from "@/lib/formatters";
import { generateReceiptNumber } from "@/lib/receipt-counter";
import { buildReceiptText } from "@/utils/receipt";
import { sendWhatsAppReceipt } from "@/utils/whatsapp";
import { requestPrinter, reconnectPrinter, printReceipt } from "@/utils/bluetooth-printer";
import { usePrinterStore } from "@/stores/use-printer-store";
import { useCartStore } from "@/stores/use-cart-store";
import { useProductStore } from "@/stores/use-product-store";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useCustomerStore } from "@/stores/use-customer-store";

export default function KasirPage() {
  const { items, paymentMethod, selectedCustomerId, clearCart, addToCart } = useCartStore();
  const products = useProductStore((s) => s.products);
  const reduceStock = useProductStore((s) => s.reduceStock);
  const findProductByBarcode = useProductStore((s) => s.findProductByBarcode);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateDebt = useCustomerStore((s) => s.updateDebt);
  const { toast } = useToast();
  const { paperWidth, savedDeviceId } = usePrinterStore();
  const [cartOpen, setCartOpen] = useState(false);
  const [showQris, setShowQris] = useState(false);
  const [confirmCheckout, setConfirmCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Auto-recover cart on mount
  useEffect(() => {
    useCartStore.getState().recoverCart();
  }, []);
  const [scannerOpen, setScannerOpen] = useState(false);
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

    // Generate receipt number
    const rn = await generateReceiptNumber();
    setReceiptNumber(rn);
    setAmountPaid(0);
    setChange(0);

    if (paymentMethod === "cash") {
      setShowCashPayment(true);
      return;
    }

    // Non-cash: reduce stock and save
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

    // Kasbon
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
      customerId: selectedCustomerId,
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
    setCartOpen(false);
    toast("Transaksi QRIS dibatalkan.", "info");
  };

  const handleReceiptDone = () => {
    clearCart();
    setShowReceiptSuccess(false);
    setCartOpen(false);
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

  const handleScanResult = useCallback(
    (barcode: string) => {
      const product = findProductByBarcode(barcode);
      if (!product) {
        toast("Produk belum tersedia. Silakan tambahkan melalui menu Produk.", "error");
        return;
      }
      if (product.stock <= 0) {
        toast("Stok produk habis.", "error");
        return;
      }
      addToCart(product);
      toast(`${product.name} ditambahkan ke keranjang.`, "success");
    },
    [findProductByBarcode, addToCart, toast]
  );

  const checkoutMessage =
    checkoutError ||
    (paymentMethod === "qris"
      ? `Lanjutkan pembayaran QRIS sebesar ${formatCurrency(totalAmount)}?`
      : paymentMethod === "kasbon"
      ? `Simpan transaksi kasbon sebesar ${formatCurrency(totalAmount)}?`
      : `Simpan transaksi tunai sebesar ${formatCurrency(totalAmount)}?`);

  return (
    <div className="flex h-screen kasir-layout">
      {/* Left: Header + Product grid */}
      <div className="flex-[3] flex flex-col min-h-0 min-w-0 border-r border-border-standard">
        <KasirHeader />
        <div className="flex-1 overflow-y-auto">
          <ProductGrid />
        </div>
        {/* Scan FAB — mobile only */}
        <button
          onClick={() => setScannerOpen(true)}
          className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-white border-2 border-secondary text-secondary rounded-2xl shadow-xl items-center justify-center z-30 active:scale-90 transition-transform hover:bg-secondary hover:text-on-secondary flex"
          aria-label="Scan barcode"
        >
          <Icon name="scan_barcode" size={28} />
        </button>
      </div>

      {/* Right: Cart panel — tablet only */}
      <aside className="hidden md:flex flex-1 flex-col min-h-0 bg-white" data-cart-target>
        <div className="flex items-center justify-between px-4 py-4 border-b border-border-standard shrink-0">
          <h2 className="text-headline-md font-bold">Keranjang</h2>
          {items.length > 0 && (
            <button onClick={clearCart} className="text-error text-label-md font-bold flex items-center gap-1">
              <Icon name="delete" size={16} />
              Hapus
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <EmptyState icon="shopping_cart" message="Keranjang masih kosong" />
            </div>
          ) : (
            <div className="divide-y divide-border-standard">
              {items.map((item) => (
                <div key={item.productId} className="px-4 py-4">
                  <CartItemRow item={item} />
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-4 py-4 bg-surface-container-low border-t border-border-standard space-y-4 shrink-0">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-on-surface-variant text-body-md">
                <span>Subtotal</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant text-body-md">
                <span>Diskon</span>
                <span className="text-error">- Rp 0</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border-standard">
                <span className="text-headline-md">Total</span>
                <span className="text-headline-md text-secondary font-bold">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
            <PaymentMethod />
            <CustomerSelect />
            <div className="flex gap-2">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-draft"))}
                className="w-touch-target-min h-touch-target-min flex items-center justify-center rounded-xl border border-border-standard active:scale-[0.98] transition-transform shrink-0"
                title="Simpan Draft"
              >
                <Icon name="save" size={20} />
              </button>
              <button
                onClick={() => setScannerOpen(true)}
                className="w-touch-target-min h-touch-target-min flex items-center justify-center rounded-xl border border-border-standard active:scale-[0.98] transition-transform shrink-0"
                title="Scan Barcode"
              >
                <Icon name="scan_barcode" size={20} />
              </button>
              <button
                onClick={handleCheckoutStart}
                className="flex-1 h-touch-target-min bg-secondary text-white rounded-xl font-headline-md font-bold shadow-lg shadow-secondary/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <Icon name="check_circle" size={24} />
                {paymentMethod === "qris" ? "Bayar QRIS" : "Simpan Transaksi"}
              </button>
            </div>
          </div>
        )}

        {/* Empty state: still show scan button even when cart is empty */}
        {items.length === 0 && (
          <div className="px-4 py-4 border-t border-border-standard shrink-0">
            <button
              onClick={() => setScannerOpen(true)}
              className="w-full h-touch-target-min rounded-xl border-2 border-secondary text-secondary font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Icon name="scan_barcode" size={24} />
              Scan Barcode
            </button>
          </div>
        )}
      </aside>

      {/* CartBar + CartDrawer + FlyingBalls + QRIS Dialog */}
      <CartBar onOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={handleCheckoutStart} onScan={() => { setCartOpen(false); setScannerOpen(true); }} />
      <FlyingBalls />

      {/* Scanner Dialog — cashier mode */}
      <ScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScanResult}
        mode="cashier"
      />

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
