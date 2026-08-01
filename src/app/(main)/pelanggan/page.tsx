"use client";

import { useState } from "react";
import { useCustomerStore } from "@/stores/use-customer-store";
import {
  formatCurrency,
  getRelativeTime,
} from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import TransactionHistory from "@/components/kasbon/transaction-history";
import PaymentInput from "@/components/kasbon/payment-input";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/shared/toast-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import type { Customer } from "@/types";

export default function PelangganPage() {
  const customers = useCustomerStore((s) => s.customers);
  const { addCustomer, updateCustomer, deleteCustomer } = useCustomerStore();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Add / Edit dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = search.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.toLowerCase().includes(search.toLowerCase())
      )
    : customers;

  const handleOpenDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailOpen(true);
  };

  const openAdd = () => {
    setEditCustomer(null);
    setName("");
    setPhone("");
    setFormOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (saving || !name.trim()) return;
    setSaving(true);
    try {
      if (editCustomer) {
        await updateCustomer(editCustomer.id, {
          name: name.trim(),
          phone: phone.trim(),
        });
        toast("Pelanggan berhasil diperbarui.", "success");
      } else {
        await addCustomer({
          name: name.trim(),
          phone: phone.trim(),
          currentDebt: 0,
        });
        toast("Pelanggan berhasil ditambahkan.", "success");
      }
      setFormOpen(false);
      setEditCustomer(null);
    } catch {
      toast("Gagal menyimpan pelanggan.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteCustomer(deleteTarget.id);
      toast("Pelanggan berhasil dihapus.", "success");
      if (selectedCustomer?.id === deleteTarget.id) {
        setSelectedCustomer(null);
        setDetailOpen(false);
      }
      setDeleteTarget(null);
    } catch {
      toast("Gagal menghapus pelanggan.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* ===== MOBILE VIEW ===== */}
      <div className="md:hidden w-full space-y-4">
        <div className="flex items-center justify-between pt-1">
          <h1 className="text-headline-md font-bold">Pelanggan</h1>
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
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface border border-border-standard rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary outline-none text-body-md transition-all"
            placeholder="Cari nama atau nomor..."
            type="text"
          />
        </div>

        {/* Customer List */}
        <div className="flex flex-col gap-3 pb-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant/50">
              <Icon name="person_search" size={48} className="block mb-2 mx-auto" />
              <p>{search ? "Tidak ditemukan" : "Belum ada pelanggan"}</p>
            </div>
          ) : (
            filtered.map((customer) => {
              const isPaid = customer.currentDebt === 0;
              return (
                <div
                  key={customer.id}
                  onClick={() => handleOpenDetail(customer)}
                  className={`bg-surface border border-border-standard p-4 rounded-xl flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer ${
                    !isPaid ? "border-l-4 border-l-danger-alert" : ""
                  }`}
                >
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <h3 className="text-body-lg font-bold truncate">{customer.name}</h3>
                    <p className="text-xs text-outline truncate">
                      {customer.phone || "—"}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-numeric-display font-bold ${isPaid ? "text-on-surface-variant" : "text-warning-debt"}`}>
                      {formatCurrency(customer.currentDebt)}
                    </p>
                    <div className="flex items-center justify-end gap-2 mt-0.5">
                      {isPaid ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-success-paid/10 text-success-paid">
                          Lunas
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-warning-debt/10 text-warning-debt">
                          Aktif
                        </span>
                      )}
                      <Icon name="chevron_right" size={16} className="text-outline" />
                    </div>
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
          aria-label="Tambah pelanggan"
        >
          <Icon name="person_add" size={28} />
        </button>

        {/* Mobile: Detail Bottom Sheet */}
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent side="bottom" className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto hide-scrollbar">
            {selectedCustomer && (
              <MobileDetailContent
                customer={selectedCustomer}
                onClose={() => setDetailOpen(false)}
                onEdit={() => {
                  setDetailOpen(false);
                  openEdit(selectedCustomer);
                }}
                onDelete={() => setDeleteTarget(selectedCustomer)}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* ===== TABLET VIEW ===== */}
      <div className="hidden md:flex w-full min-h-0">
        {/* Left: Customer List */}
        <aside className="w-[400px] border-r border-border-standard flex flex-col bg-surface-muted min-h-0">
          <div className="p-4 border-b border-border-standard bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-headline-md font-bold">Pelanggan</h1>
              <button
                onClick={openAdd}
                className="h-10 px-4 bg-secondary text-on-secondary rounded-xl font-bold flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <Icon name="add" size={18} />
                Tambah
              </button>
            </div>
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-border-standard rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary outline-none text-body-md transition-all"
                placeholder="Cari nama atau nomor..."
                type="text"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant/50">
                <Icon name="person_search" size={48} className="block mb-2 mx-auto" />
                <p>{search ? "Tidak ditemukan" : "Belum ada pelanggan"}</p>
              </div>
            ) : (
              filtered.map((customer) => {
                const isSelected = selectedCustomer?.id === customer.id;
                const isPaid = customer.currentDebt === 0;
                return (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={`p-4 border-b border-border-standard cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-white border-l-4 border-l-secondary shadow-sm"
                        : "hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-label-xl font-bold truncate">{customer.name}</h3>
                      {!isPaid && (
                        <span className="ml-2 shrink-0 px-2 py-0.5 bg-warning-debt/10 text-warning-debt text-[10px] font-bold rounded uppercase">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-sm text-on-surface-variant truncate">
                        {customer.phone || "—"}
                      </p>
                      <p className={`text-numeric-display font-bold shrink-0 ml-3 ${isPaid ? "text-on-surface" : "text-danger-alert"}`}>
                        {formatCurrency(customer.currentDebt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Customer Detail */}
        <section className="flex-1 flex flex-col bg-white min-h-0">
          {!selectedCustomer ? (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant/50">
              <div className="text-center">
                <Icon name="person_search" size={64} className="mx-auto mb-3" />
                <p>Pilih pelanggan untuk melihat detail</p>
              </div>
            </div>
          ) : (
            <TabletDetailContent
              customer={selectedCustomer}
              onEdit={() => openEdit(selectedCustomer)}
              onDelete={() => setDeleteTarget(selectedCustomer)}
            />
          )}
        </section>
      </div>

      {/* ===== ADD / EDIT CUSTOMER DIALOG ===== */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-white rounded-xl max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="text-headline-md font-bold">
              {editCustomer ? "Edit Pelanggan" : "Tambah Pelanggan"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Nama Pelanggan <span className="text-danger-alert">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
                placeholder="Nama"
                autoFocus
              />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Nomor WhatsApp <span className="text-outline">(opsional)</span>
              </label>
              <div className="flex border border-border-standard rounded-xl focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 overflow-hidden transition-all">
                <span className="flex items-center px-3 text-body-md font-bold bg-surface-container text-on-surface-variant shrink-0">
                  +62
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 h-12 px-3 outline-none"
                  placeholder="81x-xxxx-xxxx"
                  inputMode="numeric"
                />
              </div>
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
                disabled={saving || !name.trim()}
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
        title="Hapus Pelanggan"
        description={
          deleteTarget
            ? deleteTarget.currentDebt > 0
              ? `Pelanggan "${deleteTarget.name}" masih memiliki hutang ${formatCurrency(deleteTarget.currentDebt)}. Lunasi kasbon terlebih dahulu sebelum menghapus.`
              : `Yakin ingin menghapus pelanggan "${deleteTarget.name}"?`
            : ""
        }
        confirmLabel={
          (deleteTarget?.currentDebt ?? 0) > 0
            ? "Tutup"
            : deleting
            ? "Menghapus..."
            : "Hapus"
        }
        variant="danger"
        confirmDisabled={deleting}
        onConfirm={() => {
          if ((deleteTarget?.currentDebt ?? 0) > 0) {
            setDeleteTarget(null);
            return;
          }
          handleDelete();
        }}
      />
    </div>
  );
}

/* Mobile detail content inside bottom sheet */
function MobileDetailContent({
  customer,
  onClose,
  onEdit,
  onDelete,
}: {
  customer: Customer;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPaid = customer.currentDebt === 0;
  return (
    <div>
      {/* Handle */}
      <div className="w-full flex justify-center py-3">
        <div className="w-10 h-1 bg-outline-variant rounded-full"></div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-gutter">
        <div className="flex flex-col">
          <h2 className="text-headline-md font-bold">{customer.name}</h2>
          <p className={`font-bold text-label-xl ${isPaid ? "text-success-paid" : "text-warning-debt"}`}>
            {formatCurrency(customer.currentDebt)}
          </p>
          <p className="text-xs text-outline">{customer.phone || "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 rounded-full hover:bg-surface-container active:scale-90 transition-transform"
            aria-label="Edit pelanggan"
          >
            <Icon name="edit" size={20} className="text-secondary" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-full hover:bg-surface-container active:scale-90 transition-transform"
            aria-label="Hapus pelanggan"
          >
            <Icon name="delete" size={20} className="text-danger-alert" />
          </button>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container active:scale-90 transition-transform">
            <Icon name="close" size={24} />
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="mb-8 px-gutter">
        <TransactionHistory customerId={customer.id} />
      </div>

      {/* Payment Input */}
      {customer.currentDebt > 0 && (
        <div className="px-gutter pb-8">
          <PaymentInput customerId={customer.id} />
        </div>
      )}
    </div>
  );
}

/* Tablet detail content */
function TabletDetailContent({
  customer,
  onEdit,
  onDelete,
}: {
  customer: Customer;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPaid = customer.currentDebt === 0;
  return (
    <>
      <div className="p-6 border-b border-border-standard bg-surface-bright flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-2xl">
            {customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div>
            <h2 className="text-headline-md font-bold">{customer.name}</h2>
            <p className="text-on-surface-variant flex items-center gap-1 text-sm">
              <Icon name="account_circle" size={14} />
              {customer.phone || "-"}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border border-border-standard rounded-xl bg-white">
            <p className="text-xs font-semibold text-on-surface-variant mb-1">Total Hutang</p>
            <p className="text-xl font-bold text-danger-alert">{formatCurrency(customer.currentDebt)}</p>
          </div>
          <div className="p-4 border border-border-standard rounded-xl bg-white">
            <p className="text-xs font-semibold text-on-surface-variant mb-1">Status</p>
            <p className={`text-xl font-bold ${isPaid ? "text-success-paid" : "text-warning-debt"}`}>
              {isPaid ? "Lunas" : "Aktif"}
            </p>
          </div>
          <div className="p-4 border border-border-standard rounded-xl bg-white">
            <p className="text-xs font-semibold text-on-surface-variant mb-1">Terakhir Update</p>
            <p className="text-sm font-bold text-secondary">{getRelativeTime(customer.updatedAt)}</p>
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <h3 className="text-label-xl font-bold mb-4">Riwayat Transaksi & Pembayaran</h3>
          <TransactionHistory customerId={customer.id} />
        </div>

        {/* Payment Input */}
        {customer.currentDebt > 0 && (
          <PaymentInput customerId={customer.id} />
        )}
      </div>
    </>
  );
}
