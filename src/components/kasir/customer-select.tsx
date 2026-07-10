"use client";

import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useCartStore } from "@/stores/use-cart-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { Icon } from "@/lib/icon-map";

export default function CustomerSelect() {
  const paymentMethod = useCartStore((s) => s.paymentMethod);
  const selectedCustomerId = useCartStore((s) => s.selectedCustomerId);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const { customers, addCustomer } = useCustomerStore(
    useShallow((s) => ({
      customers: s.customers,
      addCustomer: s.addCustomer,
    }))
  );
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const id = await addCustomer({
      name: newName.trim(),
      phone: newPhone.trim() || "",
      currentDebt: 0,
    });
    setCustomer(id);
    setNewName("");
    setNewPhone("");
    setAddOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-label-md block text-on-surface-variant">
        Pelanggan
      </label>
      <div className="flex gap-2">
        <select
          value={selectedCustomerId || ""}
          onChange={(e) => setCustomer(e.target.value || null)}
          className="flex-1 h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-white transition-all text-body-md"
        >
          <option value="">{paymentMethod === "kasbon" ? "Pilih pelanggan..." : "Tanpa pelanggan"}</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.phone ? ` (${c.phone})` : ""} — {c.currentDebt > 0 ? `Rp ${c.currentDebt.toLocaleString("id-ID")}` : "Lunas"}
            </option>
          ))}
        </select>
        <button
          onClick={() => setAddOpen(true)}
          className="h-12 w-12 flex items-center justify-center border border-border-standard rounded-xl text-secondary active:bg-surface-container transition-colors shrink-0"
          aria-label="Tambah pelanggan baru"
        >
          <Icon name="add" size={20} />
        </button>
      </div>

      {/* Add Customer Dialog */}
      {addOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setAddOpen(false)}>
          <div className="bg-white rounded-xl max-w-[360px] w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-headline-md font-bold">Pelanggan Baru</h3>
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">Nama</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none"
                placeholder="Nama pelanggan"
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
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 h-12 px-3 outline-none"
                  placeholder="81x-xxxx-xxxx"
                  inputMode="numeric"
                />
              </div>
              <p className="text-xs text-outline mt-1">Diperlukan untuk kirim nota via WhatsApp</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setAddOpen(false); setNewName(""); setNewPhone(""); }}
                className="flex-1 h-12 border border-border-standard rounded-xl font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="flex-1 h-12 bg-secondary text-on-secondary rounded-xl font-bold active:scale-95 transition-transform disabled:opacity-50"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
