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

  const debtors = customers.filter((c) => c.currentDebt > 0);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addCustomer({ name: newName.trim(), phone: "", currentDebt: 0 });
    // Select the newly added customer
    const updated = useCustomerStore.getState().customers;
    const newest = updated[updated.length - 1];
    setCustomer(newest.id);
    setNewName("");
    setAddOpen(false);
  };

  if (paymentMethod !== "kasbon") return null;

  return (
    <div className="space-y-2">
      <label className="text-label-md block text-on-surface-variant">
        Nama Pelanggan (Kasbon)
      </label>
      <div className="flex gap-2">
        <select
          value={selectedCustomerId || ""}
          onChange={(e) => setCustomer(e.target.value || null)}
          className="flex-1 h-12 px-4 border border-border-standard rounded-xl focus:border-warning-debt outline-none bg-white transition-all text-body-md"
        >
          <option value="">Pilih pelanggan...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.currentDebt > 0 ? `Rp ${c.currentDebt.toLocaleString("id-ID")}` : "Lunas"}
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
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none"
              placeholder="Nama pelanggan"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setAddOpen(false)}
                className="flex-1 h-12 border border-border-standard rounded-xl font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 h-12 bg-secondary text-on-secondary rounded-xl font-bold active:scale-95 transition-transform"
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
