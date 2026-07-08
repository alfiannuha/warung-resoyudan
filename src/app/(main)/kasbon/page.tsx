"use client";

import { useState } from "react";
import { useCustomerStore } from "@/stores/use-customer-store";
import { formatCurrency, getRelativeTime } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import TransactionHistory from "@/components/kasbon/transaction-history";
import PaymentInput from "@/components/kasbon/payment-input";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import type { Customer } from "@/types";

export default function KasbonPage() {
  const { customers, addCustomer } = useCustomerStore();
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const totalPiutang = customers.reduce((s, c) => s + c.currentDebt, 0);
  const activeCount = customers.filter((c) => c.currentDebt > 0).length;

  const filtered = search.trim()
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : customers;

  const handleOpenDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailOpen(true);
  };

  const handleAddCustomer = async () => {
    if (!newName.trim()) return;
    await addCustomer({ name: newName.trim(), phone: newPhone.trim(), currentDebt: 0 });
    setNewName("");
    setNewPhone("");
    setAddOpen(false);
  };

  return (
    <div className="flex h-full">
      {/* ===== MOBILE VIEW ===== */}
      <div className="md:hidden w-full space-y-4">
        {/* Summary Header */}
        <div className="p-5 bg-primary-container rounded-xl flex flex-col gap-1 shadow-sm border border-border-standard">
          <p className="text-label-md text-label-md opacity-80">Total Piutang Kasbon</p>
          <h2 className="text-headline-lg-mobile font-bold text-on-secondary">
            {formatCurrency(totalPiutang)}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-1 bg-warning-debt/20 text-warning-debt rounded-full font-bold">
              {activeCount} Pelanggan
            </span>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface border border-border-standard rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary outline-none text-body-md transition-all"
              placeholder="Cari nama pelanggan..."
              type="text"
            />
          </div>
          <button className="w-touch-target-min h-touch-target-min flex items-center justify-center border border-border-standard rounded-xl bg-surface hover:bg-surface-container transition-colors">
            <Icon name="filter_list" size={24} className="text-outline" />
          </button>
        </div>

        {/* Customer List */}
        <div className="flex flex-col gap-3 pb-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant/50">
              <Icon name="person_search" size={48} className="block mb-2 mx-auto" />
              <p>Tidak ada pelanggan</p>
            </div>
          ) : (
            filtered.map((customer) => {
              const isPaid = customer.currentDebt === 0;
              const isOverdue = customer.currentDebt > 100000;
              return (
                <div
                  key={customer.id}
                  onClick={() => handleOpenDetail(customer)}
                  className={`bg-surface border border-border-standard p-4 rounded-xl flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer ${
                    isOverdue ? "border-l-4 border-l-danger-alert" : ""
                  } ${isPaid ? "bg-surface-muted opacity-70" : ""}`}
                >
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-body-lg font-bold truncate">{customer.name}</h3>
                      {isOverdue && (
                        <span className="bg-error-container text-on-error-container text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                          Overdue
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-outline">
                      {isPaid
                        ? `Lunas: ${getRelativeTime(customer.updatedAt)}`
                        : `Terakhir: ${getRelativeTime(customer.updatedAt)}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-numeric-display font-bold ${isPaid ? "text-on-surface-variant" : "text-warning-debt"}`}>
                      {formatCurrency(customer.currentDebt)}
                    </p>
                    {isPaid ? (
                      <Icon name="check_circle" size={20} className="text-success-paid" />
                    ) : (
                      <Icon name="chevron_right" size={20} className="text-outline" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FAB */}
        <button
          onClick={() => setAddOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-on-primary rounded-2xl flex items-center justify-center shadow-xl z-30 active:scale-95 transition-transform"
          aria-label="Tambah pelanggan"
        >
          <Icon name="person_add" size={28} />
        </button>

        {/* Mobile: Detail Bottom Sheet */}
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent side="bottom" className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto hide-scrollbar">
            {selectedCustomer && <MobileDetailContent customer={selectedCustomer} onClose={() => setDetailOpen(false)} />}
          </SheetContent>
        </Sheet>
      </div>

      {/* ===== TABLET VIEW ===== */}
      <div className="hidden md:flex w-full min-h-0">
        {/* Left: Customer List */}
        <aside className="w-[400px] border-r border-border-standard flex flex-col bg-surface-muted min-h-0">
          <div className="p-4 border-b border-border-standard bg-surface">
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-border-standard rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary outline-none text-body-md transition-all"
                placeholder="Cari nama pelanggan..."
                type="text"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant/50">
                <Icon name="person_search" size={48} className="block mb-2 mx-auto" />
                <p>Tidak ada pelanggan</p>
              </div>
            ) : (
              filtered.map((customer) => {
                const isSelected = selectedCustomer?.id === customer.id;
                const isOverdue = customer.currentDebt > 100000;
                return (
                  <div
                    key={customer.id}
                    onClick={() => { setSelectedCustomer(customer); setDetailOpen(true); }}
                    className={`p-4 border-b border-border-standard cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-white border-l-4 border-l-secondary shadow-sm"
                        : "hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-label-xl font-bold">{customer.name}</h3>
                      {isOverdue && (
                        <span className="px-2 py-0.5 bg-error-container text-on-error-container text-[10px] font-bold rounded uppercase">Overdue</span>
                      )}
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-sm text-on-surface-variant">
                        Terakhir: {getRelativeTime(customer.updatedAt)}
                      </p>
                      <p className={`text-numeric-display font-bold ${customer.currentDebt > 0 ? "text-danger-alert" : "text-on-surface"}`}>
                        {formatCurrency(customer.currentDebt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-4 border-t border-border-standard">
            <button
              onClick={() => setAddOpen(true)}
              className="w-full py-3 bg-secondary text-on-secondary rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Icon name="add" size={20} />
              Tambah Pelanggan
            </button>
          </div>
        </aside>

        {/* Right: Customer Detail */}
        <section className="flex-1 flex flex-col bg-white min-h-0">
          {!selectedCustomer || !detailOpen ? (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant/50">
              <div className="text-center">
                <Icon name="person_search" size={64} className="mx-auto mb-3" />
                <p>Pilih pelanggan untuk melihat detail</p>
              </div>
            </div>
          ) : (
            <TabletDetailContent customer={selectedCustomer} />
          )}
        </section>
      </div>

      {/* ===== ADD CUSTOMER DIALOG (shared) ===== */}
      {addOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setAddOpen(false)}>
          <div className="bg-white rounded-xl max-w-[360px] w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-headline-md font-bold">Tambah Pelanggan</h3>
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">Nama Pelanggan</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none"
                placeholder="Nama"
                autoFocus
              />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">No. Telepon</label>
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none"
                placeholder="0812..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setAddOpen(false)}
                className="flex-1 h-12 border border-border-standard rounded-xl font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleAddCustomer}
                className="flex-1 h-12 bg-secondary text-on-secondary rounded-xl font-bold active:scale-95 transition-transform"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Mobile detail content inside bottom sheet */
function MobileDetailContent({ customer, onClose }: { customer: Customer; onClose: () => void }) {
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
          <p className="text-warning-debt font-bold text-label-xl">
            {formatCurrency(customer.currentDebt)}
          </p>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container active:scale-90 transition-transform">
          <Icon name="close" size={24} />
        </button>
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
function TabletDetailContent({ customer }: { customer: Customer }) {
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
        <div className="text-right">
          <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Total Hutang Aktif</p>
          <p className="text-3xl font-bold text-danger-alert">{formatCurrency(customer.currentDebt)}</p>
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
            <p className={`text-xl font-bold ${customer.currentDebt > 0 ? "text-warning-debt" : "text-success-paid"}`}>
              {customer.currentDebt > 0 ? "Aktif" : "Lunas"}
            </p>
          </div>
          <div className="p-4 border border-border-standard rounded-xl bg-white">
            <p className="text-xs font-semibold text-on-surface-variant mb-1">Telepon</p>
            <p className="text-xl font-bold text-secondary">{customer.phone || "-"}</p>
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
