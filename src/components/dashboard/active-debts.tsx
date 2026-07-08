"use client";

import { useShallow } from "zustand/react/shallow";
import Link from "next/link";
import { useCustomerStore } from "@/stores/use-customer-store";
import { formatCurrency } from "@/lib/formatters";

export default function ActiveDebts() {
  const debtors = useCustomerStore(
    useShallow((s) => s.customers.filter((c) => c.currentDebt > 0))
  );

  if (debtors.length === 0) return null;

  return (
    <section className="space-y-3">
      <h3 className="text-label-xl font-bold">Kasbon Aktif</h3>
      <div className="bg-surface-container-lowest border border-border-standard rounded-xl divide-y divide-border-standard">
        {debtors.map((customer) => (
          <div
            key={customer.id}
            className="p-4 flex items-center justify-between"
          >
            <div className="space-y-1">
              <div className="text-body-lg font-bold">{customer.name}</div>
              <div className="text-label-md text-warning-debt font-bold">
                {formatCurrency(customer.currentDebt)}
              </div>
            </div>
            <Link
              href="/kasbon"
              className="px-4 py-2 bg-secondary text-on-secondary rounded-lg text-label-md font-bold active:opacity-80 transition-opacity"
            >
              Lunasi
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
