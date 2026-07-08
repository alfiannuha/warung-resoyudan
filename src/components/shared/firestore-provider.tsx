"use client";

import { useEffect, useRef } from "react";
import { useProductStore } from "@/stores/use-product-store";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useDebtPaymentStore } from "@/stores/use-debt-payment-store";

export default function FirestoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const unsubProducts = useProductStore.getState().loadProducts();
    const unsubTransactions = useTransactionStore.getState().loadTransactions();
    const unsubCustomers = useCustomerStore.getState().loadCustomers();
    const unsubPayments = useDebtPaymentStore.getState().loadPayments();

    return () => {
      unsubProducts();
      unsubTransactions();
      unsubCustomers();
      unsubPayments();
    };
  }, []);

  return <>{children}</>;
}
