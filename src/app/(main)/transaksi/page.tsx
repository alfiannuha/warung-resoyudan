"use client";

import { useState, useMemo, useCallback } from "react";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { formatCurrency, formatDateTime, getTodayISO } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import { useToast } from "@/components/shared/toast-provider";
import ReprintButton from "@/components/kasbon/reprint-button";
import PinDialog from "@/components/transaksi/pin-dialog";
import EditTransactionDialog from "@/components/transaksi/edit-transaction-dialog";
import QrisImageDialog from "@/components/transaksi/qris-image-dialog";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import type { Transaction, PaymentMethod, TransactionStatus } from "@/types";

export default function TransaksiPage() {
  const transactions = useTransactionStore((s) => s.transactions);
  const updateTransactionStatus = useTransactionStore((s) => s.updateTransactionStatus);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const { getCustomerById } = useCustomerStore();
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [qrisImageOpen, setQrisImageOpen] = useState(false);
  const [qrisImageTarget, setQrisImageTarget] = useState<Transaction | null>(null);
  const [statusTarget, setStatusTarget] = useState<Transaction | null>(null);
  const [statusAction, setStatusAction] = useState<TransactionStatus>("paid");
  const [statusBusy, setStatusBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { toast } = useToast();

  const copyReceipt = useCallback(async (receiptNumber: string) => {
    try {
      await navigator.clipboard.writeText(receiptNumber);
      toast("Nomor nota disalin.", "success");
    } catch {
      toast("Gagal menyalin nomor nota.", "error");
    }
  }, [toast]);

  const handleStatusChange = async () => {
    if (!statusTarget || statusBusy) return;
    setStatusBusy(true);
    try {
      await updateTransactionStatus(statusTarget.id, statusAction);
      toast(
        statusAction === "paid"
          ? "Transaksi ditandai Sudah Dibayar."
          : "Transaksi ditandai Belum Dibayar.",
        "success"
      );
    } catch {
      toast("Gagal mengubah status transaksi.", "error");
    } finally {
      setStatusBusy(false);
      setStatusTarget(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteTransaction(deleteTarget.id);
      toast("Transaksi berhasil dihapus.", "success");
      if (expandedId === deleteTarget.id) setExpandedId(null);
      setDeleteTarget(null);
    } catch {
      toast("Gagal menghapus transaksi.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const openQrisImage = (t: Transaction) => {
    setQrisImageTarget(t);
    setQrisImageOpen(true);
  };

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
                      <div className="flex items-center gap-1.5">
                        <p className="text-label-md text-secondary font-mono font-bold">
                          {t.receiptNumber || "—"}
                        </p>
                        {t.receiptNumber && (
                          <button
                            onClick={(e) => { e.stopPropagation(); copyReceipt(t.receiptNumber!); }}
                            className="text-outline hover:text-secondary active:scale-90 transition-all"
                            title="Salin nomor nota"
                          >
                            <Icon name="content_copy" size={14} />
                          </button>
                        )}
                      </div>
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
                      <div className="flex gap-1 mt-1 justify-end flex-wrap">
                        <span
                          className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${
                            t.paymentMethod === "cash"
                              ? "bg-success-paid/10 text-success-paid"
                              : t.paymentMethod === "kasbon"
                              ? "bg-warning-debt/10 text-warning-debt"
                              : "bg-secondary/10 text-secondary"
                          }`}
                        >
                          {t.paymentMethod === "cash" ? "Tunai" : t.paymentMethod === "kasbon" ? "Kasbon" : "QRIS"}
                        </span>
                        <span
                          className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${
                            t.status === "paid"
                              ? "bg-success-paid/10 text-success-paid"
                              : "bg-warning-debt/10 text-warning-debt"
                          }`}
                        >
                          {t.status === "paid" ? "Lunas" : "Belum Lunas"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="bg-surface-container-low border border-border-standard rounded-xl mx-2 mt-1 p-4 space-y-3 text-sm">
                    {/* Customer info */}
                    {customer && (
                      <div className="bg-surface-container rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Icon name="account_circle" size={16} className="text-outline shrink-0" />
                          <span className="font-medium">{customer.name}</span>
                        </div>
                        {customer.phone && (
                          <a
                            href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-secondary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon name="message_circle" size={16} className="shrink-0" />
                            <span>{customer.phone}</span>
                          </a>
                        )}
                        {t.paymentMethod === "kasbon" && customer.currentDebt > 0 && (
                          <div className="flex items-center gap-2 text-warning-debt">
                            <Icon name="menu_book" size={16} className="shrink-0" />
                            <span>Utang: {formatCurrency(customer.currentDebt)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {t.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-xs text-outline">{item.quantity} x {formatCurrency(item.sellPrice)}</p>
                        </div>
                        <p className="font-medium shrink-0 ml-3">{formatCurrency(item.subtotal)}</p>
                      </div>
                    ))}

                    {t.notes && (
                      <div className="bg-surface-container rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Icon name="lightbulb" size={16} className="text-outline shrink-0 mt-0.5" />
                          <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{t.notes}</p>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-border-standard pt-2 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-outline">Subtotal</span>
                        <span className="font-medium">{formatCurrency(t.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-outline">Laba</span>
                        <span className="text-success-paid font-medium">{formatCurrency(t.totalProfit)}</span>
                      </div>
                      {(t.amountPaid > 0) && (
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

                    <div className="flex items-center justify-between pt-2 border-t border-border-standard">
                      <span className="text-[10px] text-outline font-mono">
                        {t.receiptNumber || "—"}
                      </span>
                      <div className="flex items-center gap-4">
                        {t.paymentMethod === "qris" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openQrisImage(t);
                            }}
                            className="text-secondary font-bold text-label-md flex items-center gap-1 active:scale-95 transition-transform"
                          >
                            <Icon name="qr_code_2" size={16} />
                            Show QRIS
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditTarget(t);
                            setPinOpen(true);
                          }}
                          className="text-secondary font-bold text-label-md flex items-center gap-1 active:scale-95 transition-transform"
                        >
                          <Icon name="edit" size={16} />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(t);
                          }}
                          className="text-danger-alert font-bold text-label-md flex items-center gap-1 active:scale-95 transition-transform"
                        >
                          <Icon name="delete" size={16} />
                          Hapus
                        </button>
                        <ReprintButton transaction={t} />
                      </div>
                    </div>

                    {/* QRIS status actions */}
                    {t.paymentMethod === "qris" && (
                      <div className="flex gap-2 pt-1">
                        {t.status === "debt" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusTarget(t);
                              setStatusAction("paid");
                            }}
                            className="flex-1 h-11 bg-success-paid text-white rounded-xl font-bold text-label-md flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                          >
                            <Icon name="check_circle" size={16} />
                            Sudah Dibayar
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusTarget(t);
                              setStatusAction("debt");
                            }}
                            className="flex-1 h-11 border border-warning-debt text-warning-debt rounded-xl font-bold text-label-md flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                          >
                            <Icon name="close" size={16} />
                            Belum Dibayar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* PIN dialog — gates the edit flow */}
      <PinDialog
        open={pinOpen}
        onOpenChange={setPinOpen}
        onSuccess={() => {
          setEditOpen(true);
        }}
      />

      {/* Edit Transaction dialog — remounted per transaction so form state
          is initialized fresh from the transaction being edited. */}
      <EditTransactionDialog
        key={editTarget?.id ?? "none"}
        open={editOpen}
        onOpenChange={setEditOpen}
        transaction={editTarget}
      />

      {/* Show QRIS (re-scan) dialog */}
      <QrisImageDialog
        open={qrisImageOpen}
        onClose={() => setQrisImageOpen(false)}
        amount={qrisImageTarget?.totalAmount}
        receiptNumber={qrisImageTarget?.receiptNumber}
      />

      {/* QRIS status change confirmation */}
      <ConfirmDialog
        open={statusTarget !== null}
        onOpenChange={(o) => {
          if (!o) setStatusTarget(null);
        }}
        title={statusAction === "paid" ? "Tandai Sudah Dibayar?" : "Tandai Belum Dibayar?"}
        description={
          statusTarget
            ? `Transaksi ${statusTarget.receiptNumber || statusTarget.id} sebesar ${formatCurrency(
                statusTarget.totalAmount
              )} akan ditandai ${
                statusAction === "paid" ? "Sudah Dibayar" : "Belum Dibayar"
              }.`
            : ""
        }
        confirmLabel={statusBusy ? "Menyimpan..." : "Ya"}
        confirmDisabled={statusBusy}
        onConfirm={handleStatusChange}
      />

      {/* Delete Transaction confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title="Hapus Transaksi"
        description={
          deleteTarget
            ? `Yakin ingin menghapus transaksi ${deleteTarget.receiptNumber || deleteTarget.id} sebesar ${formatCurrency(
                deleteTarget.totalAmount
              )}? Stok produk akan dikembalikan. Tindakan ini tidak dapat dibatalkan.`
            : ""
        }
        confirmLabel={deleting ? "Menghapus..." : "Hapus"}
        variant="danger"
        confirmDisabled={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
