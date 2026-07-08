"use client";

import { useState } from "react";
import { useCustomerStore } from "@/stores/use-customer-store";
import { formatCurrency } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import CustomerCard from "./customer-card";
import DebtDetailSheet from "./debt-detail-sheet";
import type { Customer } from "@/types";

export default function CustomerList() {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const customers = useCustomerStore((s) => s.customers);
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

  return (
    <>
      <div className="mb-6 p-6 bg-primary-container rounded-xl flex flex-col gap-1 shadow-sm border border-border-standard">
        <p className="text-label-md opacity-80">Total Piutang Kasbon</p>
        <h2 className="text-headline-lg-mobile font-bold text-on-secondary">
          {formatCurrency(totalPiutang)}
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs px-2 py-1 bg-warning-debt/20 text-warning-debt rounded-full font-bold">
            {activeCount} Pelanggan
          </span>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface border border-border-standard rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none text-body-md transition-all"
            placeholder="Cari nama pelanggan..."
            type="text"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 pb-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant/50">
            <Icon name="person_search" size={48} className="block mb-2 mx-auto" />
            <p>Tidak ada pelanggan</p>
          </div>
        ) : (
          filtered.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onClick={() => handleOpenDetail(customer)}
            />
          ))
        )}
      </div>

      <DebtDetailSheet
        customer={selectedCustomer}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
