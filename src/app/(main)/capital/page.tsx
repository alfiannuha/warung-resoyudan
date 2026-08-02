"use client";

import { useState } from "react";
import { useCapitalStore } from "@/stores/use-capital-store";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useExpenseStore } from "@/stores/use-expense-store";
import { formatCurrency, formatDate, getTodayISO } from "@/lib/formatters";
import { generateCapitalNumber } from "@/lib/capital-counter";
import { Icon } from "@/lib/icon-map";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/shared/toast-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { CapitalTransaction, CapitalType } from "@/types";

const TYPE_META: Record<
  CapitalType,
  { label: string; badge: string; text: string; sign: "+" | "-" }
> = {
  initial: {
    label: "Modal Awal",
    badge: "bg-primary/10 text-primary",
    text: "text-primary",
    sign: "+",
  },
  addition: {
    label: "Penambahan",
    badge: "bg-success-paid/10 text-success-paid",
    text: "text-success-paid",
    sign: "+",
  },
  withdrawal: {
    label: "Penarikan",
    badge: "bg-danger-alert/10 text-danger-alert",
    text: "text-danger-alert",
    sign: "-",
  },
};

export default function CapitalPage() {
  const capitalTransactions = useCapitalStore((s) => s.capitalTransactions);
  const { addCapitalTransaction, updateCapitalTransaction, deleteCapitalTransaction } =
    useCapitalStore();
  const currentCapital = useCapitalStore((s) => s.getCurrentCapital());
  const hasInitial = useCapitalStore((s) => s.hasInitialCapital());
  const transactions = useTransactionStore((s) => s.transactions);
  const expenses = useExpenseStore((s) => s.expenses);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedCapital, setSelectedCapital] = useState<CapitalTransaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Add / Edit dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editCapital, setEditCapital] = useState<CapitalTransaction | null>(null);
  const [transactionDate, setTransactionDate] = useState(getTodayISO());
  const [type, setType] = useState<CapitalType>("addition");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<CapitalTransaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Break-even & Remaining Capital ──
  const grossProfit = transactions.reduce((s, t) => s + t.totalProfit, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.totalAmount, 0);
  const netProfit = grossProfit - totalExpenses;
  const breakEvenPercent =
    currentCapital > 0 ? (netProfit / currentCapital) * 100 : 0;
  const isBreakEven = breakEvenPercent >= 100;

  const filtered = search.trim()
    ? capitalTransactions.filter(
        (c) =>
          c.capitalNumber.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase())
      )
    : capitalTransactions;

  const openAdd = () => {
    setEditCapital(null);
    setTransactionDate(getTodayISO());
    setType(hasInitial ? "addition" : "initial");
    setAmount("");
    setDescription("");
    setFormOpen(true);
  };

  const openEdit = (capital: CapitalTransaction) => {
    setEditCapital(capital);
    setTransactionDate(capital.transactionDate);
    setType(capital.type);
    setAmount(String(capital.amount));
    setDescription(capital.description);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const amt = Number(amount);
    if (saving || !transactionDate || !(amt > 0)) return;
    if (type === "initial" && !editCapital && hasInitial) {
      toast("Modal awal hanya dapat dibuat satu kali.", "error");
      return;
    }
    setSaving(true);
    try {
      if (editCapital) {
        await updateCapitalTransaction(editCapital.id, {
          transactionDate,
          type,
          amount: amt,
          description: description.trim(),
        });
        toast("Transaksi modal berhasil diperbarui.", "success");
      } else {
        const capitalNumber = await generateCapitalNumber();
        await addCapitalTransaction({
          capitalNumber,
          transactionDate,
          type,
          amount: amt,
          description: description.trim(),
        });
        toast("Transaksi modal berhasil ditambahkan.", "success");
      }
      setFormOpen(false);
      setEditCapital(null);
    } catch {
      toast("Gagal menyimpan transaksi modal.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteCapitalTransaction(deleteTarget.id);
      toast("Transaksi modal berhasil dihapus.", "success");
      if (selectedCapital?.id === deleteTarget.id) {
        setSelectedCapital(null);
        setDetailOpen(false);
      }
      setDeleteTarget(null);
    } catch {
      toast("Gagal menghapus transaksi modal.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* ===== MOBILE VIEW ===== */}
      <div className="md:hidden w-full space-y-4">
        <div className="flex items-center justify-between pt-1">
          <h1 className="text-headline-md font-bold">Modal</h1>
          <button
            onClick={openAdd}
            className="h-10 px-4 bg-secondary text-on-secondary rounded-xl font-bold flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Icon name="add" size={18} />
            Tambah
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-white border border-border-standard rounded-xl">
            <p className="text-xs font-semibold text-on-surface-variant">
              Total Modal Aktif
            </p>
            <p className="text-numeric-display font-bold text-primary mt-1">
              {formatCurrency(currentCapital)}
            </p>
          </div>
          <div className="p-4 bg-white border border-border-standard rounded-xl">
            <p className="text-xs font-semibold text-on-surface-variant">
              Break-even
            </p>
            <p className="text-numeric-display font-bold mt-1 text-secondary">
              {Math.round(breakEvenPercent)}%
            </p>
            <p className="text-[10px] text-on-surface-variant">
              {isBreakEven ? "Sudah balik modal ✅" : "Belum balik modal"}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface border border-border-standard rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary outline-none text-body-md transition-all"
            placeholder="Cari nomor atau deskripsi..."
            type="text"
          />
        </div>

        {/* Capital List */}
        <div className="flex flex-col gap-3 pb-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant/50">
              <Icon name="account_balance_wallet" size={48} className="block mb-2 mx-auto" />
              <p>{search ? "Tidak ditemukan" : "Belum ada transaksi modal"}</p>
            </div>
          ) : (
            filtered.map((capital) => {
              const meta = TYPE_META[capital.type];
              return (
                <div
                  key={capital.id}
                  onClick={() => {
                    setSelectedCapital(capital);
                    setDetailOpen(true);
                  }}
                  className="bg-surface border border-border-standard p-4 rounded-xl flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${meta.badge}`}>
                        {meta.label}
                      </span>
                      <h3 className="text-body-lg font-bold truncate">
                        {capital.capitalNumber}
                      </h3>
                    </div>
                    <p className="text-xs text-outline truncate">
                      {formatDate(capital.transactionDate)}
                      {capital.description ? ` • ${capital.description}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-numeric-display font-bold ${meta.text}`}>
                      {meta.sign} {formatCurrency(capital.amount)}
                    </p>
                    <Icon name="chevron_right" size={16} className="text-outline mt-1 ml-auto" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FAB */}
        <button
          onClick={openAdd}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-on-primary rounded-2xl flex items-center justify-center shadow-xl z-30 active:scale-95 transition-transform"
          aria-label="Tambah transaksi modal"
        >
          <Icon name="add" size={28} />
        </button>

        {/* Mobile: Detail Bottom Sheet */}
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent
            side="bottom"
            className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto hide-scrollbar"
          >
            {selectedCapital && (
              <MobileDetailContent
                capital={selectedCapital}
                onClose={() => setDetailOpen(false)}
                onEdit={() => {
                  setDetailOpen(false);
                  openEdit(selectedCapital);
                }}
                onDelete={() => setDeleteTarget(selectedCapital)}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* ===== TABLET VIEW ===== */}
      <div className="hidden md:flex w-full min-h-0">
        {/* Left: Capital List */}
        <aside className="w-[400px] border-r border-border-standard flex flex-col bg-surface-muted min-h-0">
          <div className="p-4 border-b border-border-standard bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-headline-md font-bold">Modal</h1>
              <button
                onClick={openAdd}
                className="h-10 px-4 bg-secondary text-on-secondary rounded-xl font-bold flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <Icon name="add" size={18} />
                Tambah
              </button>
            </div>
            <div className="relative">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-border-standard rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary outline-none text-body-md transition-all"
                placeholder="Cari nomor atau deskripsi..."
                type="text"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant/50">
                <Icon name="account_balance_wallet" size={48} className="block mb-2 mx-auto" />
                <p>{search ? "Tidak ditemukan" : "Belum ada transaksi modal"}</p>
              </div>
            ) : (
              filtered.map((capital) => {
                const isSelected = selectedCapital?.id === capital.id;
                const meta = TYPE_META[capital.type];
                return (
                  <div
                    key={capital.id}
                    onClick={() => setSelectedCapital(capital)}
                    className={`p-4 border-b border-border-standard cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-white border-l-4 border-l-secondary shadow-sm"
                        : "hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${meta.badge}`}>
                          {meta.label}
                        </span>
                        <h3 className="text-label-xl font-bold truncate">
                          {capital.capitalNumber}
                        </h3>
                      </div>
                      <p className={`text-numeric-display font-bold shrink-0 ml-3 ${meta.text}`}>
                        {meta.sign} {formatCurrency(capital.amount)}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-on-surface-variant truncate">
                        {capital.description || "—"}
                      </p>
                      <span className="text-xs text-outline shrink-0 ml-3">
                        {formatDate(capital.transactionDate)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Capital Detail */}
        <section className="flex-1 flex flex-col bg-white min-h-0">
          {!selectedCapital ? (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant/50">
              <div className="text-center">
                <Icon name="account_balance_wallet" size={64} className="mx-auto mb-3" />
                <p>Pilih transaksi modal untuk melihat detail</p>
              </div>
            </div>
          ) : (
            <TabletDetailContent
              capital={selectedCapital}
              currentCapital={currentCapital}
              onEdit={() => openEdit(selectedCapital)}
              onDelete={() => setDeleteTarget(selectedCapital)}
            />
          )}
        </section>
      </div>

      {/* ===== ADD / EDIT CAPITAL DIALOG ===== */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-white rounded-xl max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-headline-md font-bold">
              {editCapital ? "Edit Transaksi Modal" : "Tambah Transaksi Modal"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Tanggal <span className="text-danger-alert">*</span>
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
              />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Jenis Transaksi <span className="text-danger-alert">*</span>
              </label>
              <div className="grid gap-2 grid-cols-3">
                {(
                  [
                    { value: "initial", label: "Modal Awal", disabled: hasInitial && !editCapital },
                    { value: "addition", label: "Penambahan", disabled: false },
                    { value: "withdrawal", label: "Penarikan", disabled: false },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => setType(opt.value)}
                    className={`h-12 rounded-xl font-bold text-label-md transition-all active:scale-[0.98] ${
                      type === opt.value
                        ? opt.value === "withdrawal"
                          ? "border-2 border-danger-alert bg-danger-alert/5 text-danger-alert"
                          : "border-2 border-secondary bg-secondary/5 text-secondary"
                        : "border border-border-standard text-outline"
                    } ${opt.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {type === "initial" && !editCapital && (
                <p className="text-xs text-on-surface-variant mt-1">
                  Modal awal hanya dapat dicatat satu kali.
                </p>
              )}
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Jumlah <span className="text-danger-alert">*</span>
              </label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
                placeholder="0"
                autoFocus
              />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Deskripsi <span className="text-outline">(opsional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all resize-none"
                placeholder="Contoh: Tambahan modal untuk restock"
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setFormOpen(false)}
                className="flex-1 h-12 border border-border-standard rounded-xl font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !transactionDate || !(Number(amount) > 0)}
                className="flex-1 h-12 bg-secondary text-on-secondary rounded-xl font-bold active:scale-95 transition-transform disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE CONFIRMATION ===== */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Hapus Transaksi Modal"
        description={
          deleteTarget
            ? `Yakin ingin menghapus "${deleteTarget.capitalNumber}" (${TYPE_META[deleteTarget.type].label}) sebesar ${formatCurrency(
                deleteTarget.amount
              )}? Tindakan ini dapat memengaruhi perhitungan modal.`
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

/* Mobile detail content inside bottom sheet */
function MobileDetailContent({
  capital,
  onClose,
  onEdit,
  onDelete,
}: {
  capital: CapitalTransaction;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = TYPE_META[capital.type];
  return (
    <div>
      {/* Handle */}
      <div className="w-full flex justify-center py-3">
        <div className="w-10 h-1 bg-outline-variant rounded-full"></div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-gutter">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-outline font-semibold">
            {capital.capitalNumber}
          </span>
          <h2 className="text-headline-md font-bold">{meta.label}</h2>
          <p className={`font-bold text-label-xl ${meta.text}`}>
            {meta.sign} {formatCurrency(capital.amount)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 rounded-full hover:bg-surface-container active:scale-90 transition-transform"
            aria-label="Edit transaksi modal"
          >
            <Icon name="edit" size={20} className="text-secondary" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-full hover:bg-surface-container active:scale-90 transition-transform"
            aria-label="Hapus transaksi modal"
          >
            <Icon name="delete" size={20} className="text-danger-alert" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container active:scale-90 transition-transform"
          >
            <Icon name="close" size={24} />
          </button>
        </div>
      </div>

      {/* Detail */}
      <div className="px-gutter pb-8 space-y-4">
        <div className="p-3 border border-border-standard rounded-xl bg-white">
          <p className="text-xs font-semibold text-on-surface-variant mb-1">Tanggal</p>
          <p className="text-sm font-bold">{formatDate(capital.transactionDate)}</p>
        </div>
        {capital.description && (
          <div className="p-3 border border-border-standard rounded-xl bg-white">
            <p className="text-xs font-semibold text-on-surface-variant mb-1">Deskripsi</p>
            <p className="text-sm whitespace-pre-wrap">{capital.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* Tablet detail content */
function TabletDetailContent({
  capital,
  currentCapital,
  onEdit,
  onDelete,
}: {
  capital: CapitalTransaction;
  currentCapital: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = TYPE_META[capital.type];
  return (
    <>
      <div className="p-6 border-b border-border-standard bg-surface-bright flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-secondary-container/10 text-secondary flex items-center justify-center">
            <Icon name="account_balance_wallet" size={32} />
          </div>
          <div>
            <span className="text-xs text-outline font-semibold">
              {capital.capitalNumber}
            </span>
            <h2 className="text-headline-md font-bold">{meta.label}</h2>
            <p className="text-on-surface-variant flex items-center gap-1 text-sm">
              <Icon name="calendar_month" size={14} />
              {formatDate(capital.transactionDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="h-10 px-4 rounded-xl border border-border-standard font-bold flex items-center gap-1.5 text-secondary active:scale-95 transition-transform"
          >
            <Icon name="edit" size={16} />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="h-10 px-4 rounded-xl border border-danger-alert/30 text-danger-alert font-bold flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Icon name="delete" size={16} />
            Hapus
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 border border-border-standard rounded-xl bg-white">
            <p className="text-xs font-semibold text-on-surface-variant mb-1">Jumlah</p>
            <p className={`text-xl font-bold ${meta.text}`}>
              {meta.sign} {formatCurrency(capital.amount)}
            </p>
          </div>
          <div className="p-4 border border-border-standard rounded-xl bg-white">
            <p className="text-xs font-semibold text-on-surface-variant mb-1">
              Total Modal Aktif
            </p>
            <p className="text-sm font-bold text-primary">{formatCurrency(currentCapital)}</p>
          </div>
        </div>

        {capital.description && (
          <div>
            <h3 className="text-label-xl font-bold mb-2">Deskripsi</h3>
            <p className="text-body-md text-on-surface-variant whitespace-pre-wrap">
              {capital.description}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
