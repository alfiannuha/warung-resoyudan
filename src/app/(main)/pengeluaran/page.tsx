"use client";

import { useState } from "react";
import { useExpenseStore } from "@/stores/use-expense-store";
import { formatCurrency, formatDate, getTodayISO } from "@/lib/formatters";
import { generateExpenseNumber } from "@/lib/expense-counter";
import { processReceiptFile } from "@/lib/receipt-image";
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
import type { Expense } from "@/types";

export default function PengeluaranPage() {
  const expenses = useExpenseStore((s) => s.expenses);
  const { addExpense, updateExpense, deleteExpense } = useExpenseStore();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Add / Edit dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [expenseDate, setExpenseDate] = useState(getTodayISO());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = search.trim()
    ? expenses.filter(
        (e) =>
          e.expenseNumber.toLowerCase().includes(search.toLowerCase()) ||
          e.title.toLowerCase().includes(search.toLowerCase())
      )
    : expenses;

  const openAdd = () => {
    setEditExpense(null);
    setExpenseDate(getTodayISO());
    setTitle("");
    setDescription("");
    setTotalAmount("");
    setReceiptImage(null);
    setFormOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditExpense(expense);
    setExpenseDate(expense.expenseDate);
    setTitle(expense.title);
    setDescription(expense.description);
    setTotalAmount(String(expense.totalAmount));
    setReceiptImage(expense.receiptImage);
    setFormOpen(true);
  };

  const handleReceiptFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processReceiptFile(file);
      setReceiptImage(dataUrl);
      toast("Foto nota berhasil diproses.", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Gagal memproses foto nota.",
        "error"
      );
    }
    e.target.value = "";
  };

  const handleSubmit = async () => {
    const amount = Number(totalAmount);
    if (saving || !title.trim() || !expenseDate || !(amount > 0)) return;
    setSaving(true);
    try {
      if (editExpense) {
        await updateExpense(editExpense.id, {
          expenseDate,
          title: title.trim(),
          description: description.trim(),
          totalAmount: amount,
          receiptImage,
        });
        toast("Pengeluaran berhasil diperbarui.", "success");
      } else {
        const expenseNumber = await generateExpenseNumber();
        await addExpense({
          expenseNumber,
          expenseDate,
          title: title.trim(),
          description: description.trim(),
          totalAmount: amount,
          receiptImage,
        });
        toast("Pengeluaran berhasil ditambahkan.", "success");
      }
      setFormOpen(false);
      setEditExpense(null);
    } catch {
      toast("Gagal menyimpan pengeluaran.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteExpense(deleteTarget.id);
      toast("Pengeluaran berhasil dihapus.", "success");
      if (selectedExpense?.id === deleteTarget.id) {
        setSelectedExpense(null);
        setDetailOpen(false);
      }
      setDeleteTarget(null);
    } catch {
      toast("Gagal menghapus pengeluaran.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* ===== MOBILE VIEW ===== */}
      <div className="md:hidden w-full space-y-4">
        <div className="flex items-center justify-between pt-1">
          <h1 className="text-headline-md font-bold">Pengeluaran</h1>
          <button
            onClick={openAdd}
            className="h-10 px-4 bg-secondary text-on-secondary rounded-xl font-bold flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Icon name="add" size={18} />
            Tambah
          </button>
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
            placeholder="Cari nomor atau judul..."
            type="text"
          />
        </div>

        {/* Expense List */}
        <div className="flex flex-col gap-3 pb-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant/50">
              <Icon name="receipt_long" size={48} className="block mb-2 mx-auto" />
              <p>{search ? "Tidak ditemukan" : "Belum ada pengeluaran"}</p>
            </div>
          ) : (
            filtered.map((expense) => (
              <div
                key={expense.id}
                onClick={() => {
                  setSelectedExpense(expense);
                  setDetailOpen(true);
                }}
                className="bg-surface border border-border-standard p-4 rounded-xl flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {expense.receiptImage && (
                      <img
                        src={expense.receiptImage}
                        alt="Nota"
                        className="w-8 h-8 rounded-md object-cover shrink-0"
                      />
                    )}
                    <h3 className="text-body-lg font-bold truncate">
                      {expense.title}
                    </h3>
                  </div>
                  <p className="text-xs text-outline truncate">
                    {expense.expenseNumber} • {formatDate(expense.expenseDate)}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-numeric-display font-bold text-danger-alert">
                    {formatCurrency(expense.totalAmount)}
                  </p>
                  <Icon name="chevron_right" size={16} className="text-outline mt-1 ml-auto" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* FAB */}
        <button
          onClick={openAdd}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-on-primary rounded-2xl flex items-center justify-center shadow-xl z-30 active:scale-95 transition-transform"
          aria-label="Tambah pengeluaran"
        >
          <Icon name="add" size={28} />
        </button>

        {/* Mobile: Detail Bottom Sheet */}
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent
            side="bottom"
            className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto hide-scrollbar"
          >
            {selectedExpense && (
              <MobileDetailContent
                expense={selectedExpense}
                onClose={() => setDetailOpen(false)}
                onEdit={() => {
                  setDetailOpen(false);
                  openEdit(selectedExpense);
                }}
                onDelete={() => setDeleteTarget(selectedExpense)}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* ===== TABLET VIEW ===== */}
      <div className="hidden md:flex w-full min-h-0">
        {/* Left: Expense List */}
        <aside className="w-[400px] border-r border-border-standard flex flex-col bg-surface-muted min-h-0">
          <div className="p-4 border-b border-border-standard bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-headline-md font-bold">Pengeluaran</h1>
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
                placeholder="Cari nomor atau judul..."
                type="text"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant/50">
                <Icon name="receipt_long" size={48} className="block mb-2 mx-auto" />
                <p>{search ? "Tidak ditemukan" : "Belum ada pengeluaran"}</p>
              </div>
            ) : (
              filtered.map((expense) => {
                const isSelected = selectedExpense?.id === expense.id;
                return (
                  <div
                    key={expense.id}
                    onClick={() => setSelectedExpense(expense)}
                    className={`p-4 border-b border-border-standard cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-white border-l-4 border-l-secondary shadow-sm"
                        : "hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-label-xl font-bold truncate">
                        {expense.title}
                      </h3>
                      <p className="text-numeric-display font-bold text-danger-alert shrink-0 ml-3">
                        {formatCurrency(expense.totalAmount)}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-on-surface-variant truncate">
                        {expense.expenseNumber}
                      </p>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-xs text-outline">
                          {formatDate(expense.expenseDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Expense Detail */}
        <section className="flex-1 flex flex-col bg-white min-h-0">
          {!selectedExpense ? (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant/50">
              <div className="text-center">
                <Icon name="receipt_long" size={64} className="mx-auto mb-3" />
                <p>Pilih pengeluaran untuk melihat detail</p>
              </div>
            </div>
          ) : (
            <TabletDetailContent
              expense={selectedExpense}
              onEdit={() => openEdit(selectedExpense)}
              onDelete={() => setDeleteTarget(selectedExpense)}
            />
          )}
        </section>
      </div>

      {/* ===== ADD / EDIT EXPENSE DIALOG ===== */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-white rounded-xl max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-headline-md font-bold">
              {editExpense ? "Edit Pengeluaran" : "Tambah Pengeluaran"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Tanggal <span className="text-danger-alert">*</span>
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
              />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Judul Pengeluaran <span className="text-danger-alert">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
                placeholder="Contoh: Pembelian Gas LPG"
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
                placeholder="Catatan tambahan..."
                rows={2}
              />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Total Biaya <span className="text-danger-alert">*</span>
              </label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Foto Nota <span className="text-outline">(opsional)</span>
              </label>
              {receiptImage ? (
                <div className="flex items-center gap-3">
                  <img
                    src={receiptImage}
                    alt="Pratinjau nota"
                    className="w-16 h-16 rounded-lg object-cover border border-border-standard"
                  />
                  <button
                    onClick={() => setReceiptImage(null)}
                    className="h-10 px-3 rounded-xl border border-danger-alert/30 text-danger-alert font-bold text-sm active:scale-95 transition-transform"
                  >
                    Hapus Foto
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 h-12 border-2 border-dashed border-border-standard rounded-xl text-on-surface-variant font-bold text-sm cursor-pointer active:scale-[0.98] transition-transform">
                  <Icon name="add" size={18} />
                  Upload Foto
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleReceiptFile}
                    className="hidden"
                  />
                </label>
              )}
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
                disabled={
                  saving ||
                  !title.trim() ||
                  !expenseDate ||
                  !(Number(totalAmount) > 0)
                }
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
        title="Hapus Pengeluaran"
        description={
          deleteTarget
            ? `Yakin ingin menghapus pengeluaran "${deleteTarget.title}" (${deleteTarget.expenseNumber})?`
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
  expense,
  onClose,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
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
            {expense.expenseNumber}
          </span>
          <h2 className="text-headline-md font-bold">{expense.title}</h2>
          <p className="font-bold text-label-xl text-danger-alert">
            {formatCurrency(expense.totalAmount)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 rounded-full hover:bg-surface-container active:scale-90 transition-transform"
            aria-label="Edit pengeluaran"
          >
            <Icon name="edit" size={20} className="text-secondary" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-full hover:bg-surface-container active:scale-90 transition-transform"
            aria-label="Hapus pengeluaran"
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
          <p className="text-xs font-semibold text-on-surface-variant mb-1">
            Tanggal
          </p>
          <p className="text-sm font-bold">{formatDate(expense.expenseDate)}</p>
        </div>
        {expense.description && (
          <div className="p-3 border border-border-standard rounded-xl bg-white">
            <p className="text-xs font-semibold text-on-surface-variant mb-1">
              Deskripsi
            </p>
            <p className="text-sm whitespace-pre-wrap">{expense.description}</p>
          </div>
        )}
        {expense.receiptImage && (
          <div>
            <p className="text-xs font-semibold text-on-surface-variant mb-2">
              Foto Nota
            </p>
            <img
              src={expense.receiptImage}
              alt={`Nota ${expense.expenseNumber}`}
              className="w-full rounded-xl border border-border-standard"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* Tablet detail content */
function TabletDetailContent({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="p-6 border-b border-border-standard bg-surface-bright flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-error-container text-error flex items-center justify-center">
            <Icon name="receipt_long" size={32} />
          </div>
          <div>
            <span className="text-xs text-outline font-semibold">
              {expense.expenseNumber}
            </span>
            <h2 className="text-headline-md font-bold">{expense.title}</h2>
            <p className="text-on-surface-variant flex items-center gap-1 text-sm">
              <Icon name="calendar_month" size={14} />
              {formatDate(expense.expenseDate)}
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
            <p className="text-xs font-semibold text-on-surface-variant mb-1">
              Total Biaya
            </p>
            <p className="text-xl font-bold text-danger-alert">
              {formatCurrency(expense.totalAmount)}
            </p>
          </div>
          <div className="p-4 border border-border-standard rounded-xl bg-white">
            <p className="text-xs font-semibold text-on-surface-variant mb-1">
              Tanggal
            </p>
            <p className="text-sm font-bold text-secondary">
              {formatDate(expense.expenseDate)}
            </p>
          </div>
        </div>

        {expense.description && (
          <div>
            <h3 className="text-label-xl font-bold mb-2">Deskripsi</h3>
            <p className="text-body-md text-on-surface-variant whitespace-pre-wrap">
              {expense.description}
            </p>
          </div>
        )}

        {expense.receiptImage && (
          <div>
            <h3 className="text-label-xl font-bold mb-2">Foto Nota</h3>
            <img
              src={expense.receiptImage}
              alt={`Nota ${expense.expenseNumber}`}
              className="max-w-md rounded-xl border border-border-standard"
            />
          </div>
        )}
      </div>
    </>
  );
}
