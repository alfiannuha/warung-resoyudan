"use client";

import MetricCard from "./metric-card";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { formatCurrency } from "@/lib/formatters";
import { getTodayISO } from "@/lib/formatters";

export default function MetricsGrid() {
  const getDailyReport = useTransactionStore((s) => s.getDailyReport);
  const report = getDailyReport(getTodayISO());

  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard
        icon="payments"
        label="Total Penjualan"
        value={formatCurrency(report.totalSales)}
      />
      <MetricCard
        icon="trending_up"
        label="Total Profit"
        value={formatCurrency(report.totalProfit)}
        isHighlighted
      />
      <MetricCard
        icon="account_balance_wallet"
        label="Kas Masuk"
        value={formatCurrency(report.totalCash)}
      />
      <MetricCard
        icon="history_edu"
        label="Kasbon"
        value={formatCurrency(report.totalKasbon)}
      />
    </div>
  );
}
