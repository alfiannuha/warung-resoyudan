"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Customer } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import TransactionHistory from "./transaction-history";
import PaymentInput from "./payment-input";

interface Props {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DebtDetailSheet({
  customer,
  open,
  onOpenChange,
}: Props) {
  const [activeTab, setActiveTab] = useState<"history" | "info">("history");
  const [refreshKey, setRefreshKey] = useState(0);

  if (!customer) return null;

  const handlePaymentSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <SheetTitle className="text-headline-md font-bold text-left">
                {customer.name}
              </SheetTitle>
              <p className="text-warning-debt font-bold text-label-xl">
                {formatCurrency(customer.currentDebt)}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex border-b border-border-standard mb-6">
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 text-label-md font-bold border-b-2 transition-colors ${
              activeTab === "history"
                ? "text-secondary border-secondary"
                : "text-outline border-transparent"
            }`}
          >
            Riwayat Transaksi
          </button>
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-3 text-label-md font-medium border-b-2 transition-colors ${
              activeTab === "info"
                ? "text-secondary border-secondary"
                : "text-outline border-transparent"
            }`}
          >
            Info Kontak
          </button>
        </div>

        {activeTab === "history" ? (
          <>
            <div className="mb-8">
              <TransactionHistory key={refreshKey} customerId={customer.id} />
            </div>
            {customer.currentDebt > 0 && (
              <PaymentInput customerId={customer.id} />
            )}
          </>
        ) : (
          <div className="space-y-4 pb-8">
            <div>
              <p className="text-label-md text-on-surface-variant">Nama</p>
              <p className="text-body-lg font-bold">{customer.name}</p>
            </div>
            <div>
              <p className="text-label-md text-on-surface-variant">Telepon</p>
              <p className="text-body-lg font-bold">{customer.phone || "-"}</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
