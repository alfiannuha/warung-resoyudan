"use client";

import { useShallow } from "zustand/react/shallow";
import type { Transaction } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useDebtPaymentStore } from "@/stores/use-debt-payment-store";
import ReprintButton from "./reprint-button";

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
    transaction?: Transaction;
  }[] = [
    ...transactions.map((t) => ({
      date: t.createdAt,
      type: "debt" as const,
      description: `Pembelian ${t.items.map((i) => i.name).join(", ")}`,
      amount: t.totalAmount,
      transaction: t,
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
          <div className="min-w-0 flex-1">
            <p className="font-bold text-body-md truncate">{event.description}</p>
            <p className="text-xs text-outline">{formatDateTime(event.date)}</p>
            {event.transaction?.receiptNumber && (
              <p className="text-xs text-secondary font-mono mt-0.5">
                {event.transaction.receiptNumber}
              </p>
            )}
          </div>
          <div className="text-right shrink-0 ml-3">
            <p
              className={`font-bold ${
                event.type === "debt" ? "text-danger-alert" : "text-success-paid"
              }`}
            >
              {event.type === "debt" ? "+" : "-"}
              {formatCurrency(Math.abs(event.amount))}
            </p>
            {event.transaction && (
              <div className="mt-1">
                <ReprintButton transaction={event.transaction} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
