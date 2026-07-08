"use client";

import type { Customer } from "@/types";
import { formatCurrency, getRelativeTime } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";

interface Props {
  customer: Customer;
  onClick: () => void;
}

export default function CustomerCard({ customer, onClick }: Props) {
  const isPaid = customer.currentDebt === 0;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer ${
        isPaid
          ? "bg-surface-muted border border-border-standard opacity-70"
          : "bg-surface border border-border-standard"
      } ${!isPaid ? "hover:border-secondary" : ""}`}
    >
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <h3 className="text-body-lg font-bold truncate">{customer.name}</h3>
        <p className="text-xs text-outline">
          Terakhir: {getRelativeTime(customer.updatedAt)}
        </p>
      </div>
      <div className="text-right shrink-0 ml-3">
        {isPaid ? (
          <>
            <p className="text-numeric-display text-on-surface-variant font-bold">Rp 0</p>
            <Icon name="check_circle" size={24} className="text-success-paid" />
          </>
        ) : (
          <>
            <p className="text-numeric-display text-warning-debt font-bold">
              {formatCurrency(customer.currentDebt)}
            </p>
            <Icon name="chevron_right" size={20} className="text-outline" />
          </>
        )}
      </div>
    </div>
  );
}
