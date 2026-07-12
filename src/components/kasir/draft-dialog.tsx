"use client";

import { useState, useMemo } from "react";
import { useDraftStore } from "@/stores/use-draft-store";
import { useCartStore } from "@/stores/use-cart-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { formatCurrency, formatTime } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import { useToast } from "@/components/shared/toast-provider";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Draft } from "@/stores/use-draft-store";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DraftDialog({ open, onOpenChange }: Props) {
  const [mode, setMode] = useState<"list" | "save">("save");
  const [search, setSearch] = useState("");
  const [draftName, setDraftName] = useState("");
  const [restoreConfirm, setRestoreConfirm] = useState<Draft | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const { drafts, saveDraft, deleteDraft } = useDraftStore();
  const { items, paymentMethod, selectedCustomerId, setCustomer } = useCartStore();
  const { getCustomerById } = useCustomerStore();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    if (!search.trim()) return drafts;
    const q = search.toLowerCase();
    return drafts.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.draftNumber.toLowerCase().includes(q),
    );
  }, [drafts, search]);

  // Pre-fill name from selected customer
  const customerName = selectedCustomerId
    ? getCustomerById(selectedCustomerId)?.name
    : "";

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveDraft(
        draftName || customerName || "",
        items,
        paymentMethod,
        selectedCustomerId,
      );
      toast("Draft berhasil disimpan.", "success");
      setMode("list");
      setDraftName("");
    } catch {
      toast("Gagal menyimpan draft.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = (draft: Draft) => {
    if (items.length > 0) {
      setRestoreConfirm(draft);
    } else {
      doRestore(draft);
    }
  };

  const doRestore = (draft: Draft) => {
    useCartStore.setState({
      items: draft.items,
      paymentMethod: draft.paymentMethod,
      selectedCustomerId: draft.selectedCustomerId,
    });
    setCustomer(draft.selectedCustomerId);
    toast("Draft berhasil dimuat.", "success");
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteDraft(deleteConfirm.id);
    toast("Draft berhasil dihapus.", "success");
    setDeleteConfirm(null);
  };

  const hasItems = items.length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-white rounded-xl max-w-[480px] max-h-[85dvh] overflow-y-auto">
          {mode === "save" ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-headline-md font-bold">
                  Simpan Draft
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-label-md text-on-surface-variant block mb-1">
                    Nama Draft <span className="text-outline">(opsional)</span>
                  </label>
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none"
                    placeholder={customerName || "Misal: Pesanan Pak Joko"}
                    autoFocus
                  />
                  {!draftName && customerName && (
                    <p className="text-xs text-outline mt-1">
                      Akan menggunakan &ldquo;{customerName}&rdquo;
                    </p>
                  )}
                </div>

                {/* Cart summary */}
                <div className="bg-surface-container rounded-xl p-3 space-y-1 text-sm">
                  <p className="font-bold">{items.length} produk</p>
                  <p className="text-on-surface-variant">
                    {formatCurrency(items.reduce((s, i) => s + i.subtotal, 0))}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] px-1.5 py-0.5 rounded font-bold bg-secondary/10 text-secondary">
                      {paymentMethod === "cash"
                        ? "Tunai"
                        : paymentMethod === "kasbon"
                        ? "Kasbon"
                        : "QRIS"}
                    </span>
                    {customerName && (
                      <span className="text-[11px] text-outline">
                        {customerName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setMode("list")}
                    className="flex-1 h-12 border border-border-standard rounded-xl font-bold"
                  >
                    Lihat Draft
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !hasItems}
                    className="flex-1 h-12 bg-secondary text-on-secondary rounded-xl font-bold active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {saving ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-headline-md font-bold">
                  Draft Transaksi
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="relative">
                  <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={14} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 bg-surface-container border border-border-standard rounded-lg text-[13px] outline-none focus:border-secondary transition-all"
                    placeholder="Cari draft..."
                  />
                </div>

                {hasItems && (
                  <button
                    onClick={() => {
                      setMode("save");
                      setDraftName(customerName || "");
                    }}
                    className="w-full h-10 border-2 border-dashed border-border-standard rounded-xl text-label-md font-bold text-secondary flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                  >
                    <Icon name="add" size={16} />
                    Simpan Draft Baru
                  </button>
                )}

                {filtered.length === 0 ? (
                  <p className="text-center py-6 text-on-surface-variant/50 text-label-md">
                    {search ? "Tidak ditemukan" : "Belum ada draft"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filtered.map((d) => {
                      const customer = d.selectedCustomerId
                        ? getCustomerById(d.selectedCustomerId)
                        : null;
                      return (
                        <div
                          key={d.id}
                          className="border border-border-standard rounded-xl p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-bold text-sm">{d.name}</p>
                              <p className="text-[11px] text-outline font-mono mt-0.5">
                                {d.draftNumber}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                d.paymentMethod === "cash"
                                  ? "bg-success-paid/10 text-success-paid"
                                  : d.paymentMethod === "kasbon"
                                  ? "bg-warning-debt/10 text-warning-debt"
                                  : "bg-secondary/10 text-secondary"
                              }`}
                            >
                              {d.paymentMethod === "cash"
                                ? "Tunai"
                                : d.paymentMethod === "kasbon"
                                ? "Kasbon"
                                : "QRIS"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-outline">
                              {d.items.length} produk ·{" "}
                              {formatCurrency(d.totalAmount)}
                            </span>
                            <span className="text-[11px] text-outline">
                              {formatTime(d.createdAt)}
                            </span>
                          </div>
                          {customer && (
                            <p className="text-[11px] text-outline">
                              {customer.name}
                            </p>
                          )}
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleRestore(d)}
                              className="flex-1 h-9 rounded-lg bg-secondary text-on-secondary text-[12px] font-bold active:scale-95 transition-transform"
                            >
                              Lanjutkan
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(d)}
                              className="h-9 px-4 rounded-lg border border-border-standard text-[12px] font-bold text-danger-alert active:scale-95 transition-transform"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={restoreConfirm !== null}
        onOpenChange={(o) => !o && setRestoreConfirm(null)}
        title="Ganti Keranjang"
        description="Keranjang saat ini akan diganti dengan draft ini. Lanjutkan?"
        confirmLabel="Lanjutkan"
        onConfirm={() => {
          if (restoreConfirm) doRestore(restoreConfirm);
          setRestoreConfirm(null);
        }}
      />

      <ConfirmDialog
        open={deleteConfirm !== null}
        onOpenChange={(o) => !o && setDeleteConfirm(null)}
        title="Hapus Draft"
        description="Yakin ingin menghapus draft ini?"
        confirmLabel="Hapus"
        variant="danger"
        onConfirm={handleDelete}
      />
    </>
  );
}
