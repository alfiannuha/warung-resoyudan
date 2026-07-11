"use client";

import { useState, useMemo } from "react";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { formatCurrency, formatDateTime, getTodayISO } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import ReprintButton from "@/components/kasbon/reprint-button";
import type { Transaction, PaymentMethod } from "@/types";

export default function TransaksiPage() {
  const transactions = useTransactionStore((s) => s.transactions);
  const { getCustomerById } = useCustomerStore();
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = transactions;

    if (filterMethod !== "all") {
      result = result.filter((t) => t.paymentMethod === filterMethod);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => {
        const customer = t.customerId ? getCustomerById(t.customerId) : null;
        return (
          t.receiptNumber?.toLowerCase().includes(q) ||
          t.items.some((i) => i.name.toLowerCase().includes(q)) ||
          customer?.name.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [transactions, filterMethod, search, getCustomerById]);

  const paymentMethods: { label: string; value: PaymentMethod | "all"; icon: string }[] = [
    { label: "Semua", value: "all", icon: "receipt_long" },
    { label: "Tunai", value: "cash", icon: "payments" },
    { label: "Kasbon", value: "kasbon", icon: "menu_book" },
    { label: "QRIS", value: "qris", icon: "qr_code_2" },
  ];

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <h1 className="text-headline-md font-bold pt-4">Transaksi</h1>

      {/* Search */}
      <div className="relative">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 h-12 bg-surface border border-border-standard rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary outline-none text-body-md transition-all"
          placeholder="Cari No. nota, produk, atau pelanggan..."
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {paymentMethods.map((pm) => (
          <button
            key={pm.value}
            onClick={() => setFilterMethod(pm.value)}
            className={`touch-target flex items-center gap-1.5 px-4 rounded-xl font-bold text-label-md whitespace-nowrap transition-all active:scale-[0.98] ${
              filterMethod === pm.value
                ? "bg-secondary text-on-secondary"
                : "border border-border-standard text-on-surface-variant"
            }`}
          >
            <Icon name={pm.icon} size={16} />
            {pm.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-label-md text-on-surface-variant">
        {filtered.length} transaksi
      </p>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant/50">
            <Icon name="receipt_long" size={48} className="mx-auto mb-2" />
            <p>Tidak ada transaksi</p>
          </div>
        ) : (
          filtered.map((t) => {
            const customer = t.customerId ? getCustomerById(t.customerId) : null;
            const isExpanded = expandedId === t.id;

            return (
              <div key={t.id}>
                {/* Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : t.id)}
                  className="bg-white border border-border-standard rounded-xl p-4 active:scale-[0.99] transition-transform cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="text-label-md text-secondary font-mono font-bold">
                        {t.receiptNumber || "—"}
                      </p>
                      <p className="text-xs text-outline mt-0.5">
                        {formatDateTime(t.date)}
                      </p>
                      {customer && (
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {customer.name}
                        </p>
                      )}
                      {t.items.length > 0 && (
                        <p className="text-xs text-outline mt-0.5 truncate">
                          {t.items.map((i) => i.name).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-bold text-body-md">{formatCurrency(t.totalAmount)}</p>
                      <span
                        className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-bold mt-1 ${
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
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="bg-surface-container-low border border-border-standard rounded-xl mx-2 mt-1 p-4 space-y-3 text-sm">
                    {t.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-xs text-outline">{item.quantity} x {formatCurrency(item.sellPrice)}</p>
                        </div>
                        <p className="font-medium shrink-0 ml-3">{formatCurrency(item.subtotal)}</p>
                      </div>
                    ))}

                    <div className="border-t border-border-standard pt-2 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-outline">Subtotal</span>
                        <span className="font-medium">{formatCurrency(t.totalAmount)}</span>
                      </div>
                      {t.paymentMethod === "cash" && t.amountPaid > 0 && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-outline">Bayar</span>
                            <span>{formatCurrency(t.amountPaid)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-outline">Kembali</span>
                            <span className="text-success-paid font-medium">{formatCurrency(t.change)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between items-center pt-1 border-t border-border-standard">
                        <span className="font-bold">Total</span>
                        <span className="font-bold text-secondary">{formatCurrency(t.totalAmount)}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-border-standard">
                      <ReprintButton transaction={t} />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
