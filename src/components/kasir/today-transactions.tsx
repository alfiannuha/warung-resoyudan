"use client";

import { useState, useMemo } from "react";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useDebtPaymentStore } from "@/stores/use-debt-payment-store";
import { formatCurrency, formatTime } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import ReprintButton from "@/components/kasbon/reprint-button";
import { useToast } from "@/components/shared/toast-provider";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import type { Transaction } from "@/types";

interface Props {
  variant?: "inline" | "sheet";
}

const MAX_DISPLAY = 10;

export default function TodayTransactions({ variant = "inline" }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [payConfirm, setPayConfirm] = useState<Transaction | null>(null);
  const [paying, setPaying] = useState(false);
  const { getTodayTransactions } = useTransactionStore();
  const { getCustomerById, updateDebt } = useCustomerStore();
  const { addPayment } = useDebtPaymentStore();
  const { toast } = useToast();

  const rows = useMemo(() => {
    let list = getTodayTransactions()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, MAX_DISPLAY);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => {
        const customer = t.customerId ? getCustomerById(t.customerId) : null;
        return (
          t.receiptNumber?.toLowerCase().includes(q) ||
          customer?.name.toLowerCase().includes(q) ||
          t.items.some((i) => i.name.toLowerCase().includes(q))
        );
      });
    }
    return list;
  }, [getTodayTransactions, search, getCustomerById]);

  const handlePayDebt = async () => {
    if (!payConfirm) return;
    setPaying(true);
    try {
      const customerId = payConfirm.customerId!;
      await addPayment({
        customerId,
        amount: payConfirm.totalAmount,
        paymentDate: new Date().toISOString(),
        notes: "Pelunasan via Riwayat Hari Ini",
      });
      await updateDebt(customerId, -payConfirm.totalAmount);
      toast("Kasbon berhasil dilunasi.", "success");
      setPayConfirm(null);
    } catch {
      toast("Gagal melunasi kasbon.", "error");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className={variant === "sheet" ? "p-4" : ""}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-label-xl font-bold">Riwayat Hari Ini</h3>
        <span className="text-label-md text-outline">{rows.length} transaksi</span>
      </div>

      <div className="relative mb-3">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={14} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-3 bg-surface-container border border-border-standard rounded-lg text-[13px] outline-none focus:border-secondary transition-all"
          placeholder="Cari No. nota atau pelanggan..."
        />
      </div>

      {rows.length === 0 ? (
        <p className="text-center py-6 text-on-surface-variant/50 text-label-md">
          {search ? "Tidak ditemukan" : "Belum ada transaksi hari ini"}
        </p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((t) => {
            const customer = t.customerId ? getCustomerById(t.customerId) : null;
            const isOpen = expandedId === t.id;
            return (
              <div key={t.id}>
                <div
                  onClick={() => setExpandedId(isOpen ? null : t.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container cursor-pointer active:bg-surface-container-high transition-colors"
                >
                  <span className="text-[13px] font-mono text-outline min-w-[44px]">
                    {formatTime(t.date)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold truncate">
                      {t.receiptNumber || "—"}
                    </p>
                    {customer && (
                      <p className="text-[11px] text-outline truncate">{customer.name}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-bold">{formatCurrency(t.totalAmount)}</p>
                    <span
                      className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        t.paymentMethod === "cash"
                          ? "bg-success-paid/10 text-success-paid"
                          : t.paymentMethod === "kasbon"
                          ? "bg-warning-debt/10 text-warning-debt"
                          : "bg-secondary/10 text-secondary"
                      }`}
                    >
                      {t.paymentMethod === "cash" ? "Tunai" : t.paymentMethod === "kasbon" ? "Kasbon" : "QRIS"}
                    </span>
                  </div>
                </div>

                {isOpen && (
                  <div className="bg-surface-container-low rounded-lg mx-2 mb-1.5 p-3 space-y-2 text-[13px]">
                    {t.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-start">
                        <span className="truncate flex-1">{item.name}</span>
                        <span className="shrink-0 ml-2">
                          {item.quantity}x {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-border-standard pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(t.totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border-standard">
                      <ReprintButton transaction={t} />
                      {t.paymentMethod === "kasbon" && t.status === "debt" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPayConfirm(t);
                          }}
                          className="h-7 px-3 rounded-lg bg-success-paid text-white text-[11px] font-bold active:scale-95 transition-transform"
                        >
                          Lunasi
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={payConfirm !== null}
        onOpenChange={(o) => !o && setPayConfirm(null)}
        title="Lunasi Kasbon"
        description={
          payConfirm
            ? `Lunasi kasbon sebesar ${formatCurrency(payConfirm.totalAmount)}?`
            : ""
        }
        confirmLabel={paying ? "Memproses..." : "Lunasi"}
        variant="default"
        onConfirm={handlePayDebt}
      />
    </div>
  );
}
