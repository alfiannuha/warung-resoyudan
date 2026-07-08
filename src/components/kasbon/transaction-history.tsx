"use client";

import { useShallow } from "zustand/react/shallow";
import type { Customer, Transaction, DebtPayment } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useDebtPaymentStore } from "@/stores/use-debt-payment-store";

interface Props {
  customerId: string;
}

export default function TransactionHistory({ customerId }: Props) {
  const transactions = useTransactionStore(
    useShallow((s) => s.getTransactionsByCustomer(customerId))
  );
  const payments = useDebtPaymentStore(
    useShallow((s) => s.getPaymentsByCustomer(customerId))
  );

  // Merge and sort by date
  const events: {
    date: string;
    type: "debt" | "payment";
    description: string;
    amount: number;
  }[] = [
    ...transactions.map((t) => ({
      date: t.createdAt,
      type: "debt" as const,
      description: `Pembelian ${t.items.map((i) => i.name).join(", ")}`,
      amount: t.totalAmount,
    })),
    ...payments.map((p) => ({
      date: p.paymentDate,
      type: "payment" as const,
      description: p.notes || "Pembayaran hutang",
      amount: -p.amount,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-on-surface-variant/50">
        <p>Belum ada transaksi</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, i) => (
        <div
          key={i}
          className="flex justify-between items-start py-3 border-b border-border-standard/50"
        >
          <div>
            <p className="font-bold text-body-md">{event.description}</p>
            <p className="text-xs text-outline">{formatDateTime(event.date)}</p>
          </div>
          <p
            className={`font-bold ${
              event.type === "debt" ? "text-danger-alert" : "text-success-paid"
            }`}
          >
            {event.type === "debt" ? "+" : "-"}
            {formatCurrency(Math.abs(event.amount))}
          </p>
        </div>
      ))}
    </div>
  );
}
