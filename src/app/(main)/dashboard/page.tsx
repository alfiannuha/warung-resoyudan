"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDateShort,
  getRelativeTime,
  getTodayISO,
} from "@/lib/formatters";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useProductStore } from "@/stores/use-product-store";
import { useExpenseStore } from "@/stores/use-expense-store";
import { useCapitalStore } from "@/stores/use-capital-store";
import { useShallow } from "zustand/react/shallow";
import { Icon } from "@/lib/icon-map";
import PageHeader from "@/components/shared/page-header";
import KpiCard from "@/components/shared/kpi-card";
import StatusBadge from "@/components/shared/status-badge";
import { SkeletonCard, SkeletonText } from "@/components/shared/skeleton";
import LineChart from "@/components/laporan/line-chart";

/** Local-time YYYY-MM-DD for a date offset from today. */
function getDateOffsetISO(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function DashboardPage() {
  const today = getTodayISO();
  const report = useTransactionStore(useShallow((s) => s.getDailyReport(today)));
  const transactions = useTransactionStore(useShallow((s) => s.transactions));
  const txnLoading = useTransactionStore((s) => s.loading);
  const productsLoading = useProductStore((s) => s.loading);

  const debtors = useCustomerStore(
    useShallow((s) => s.customers.filter((c) => c.currentDebt > 0))
  );
  const lowStockProducts = useProductStore(
    useShallow((s) => s.products.filter((p) => p.isActive && p.stock <= p.minStock))
  );
  const activeDebtTotal = debtors.reduce((s, c) => s + c.currentDebt, 0);

  const expenses = useExpenseStore(useShallow((s) => s.expenses));
  const todayExpenses = expenses
    .filter((e) => e.expenseDate.startsWith(today))
    .reduce((s, e) => s + e.totalAmount, 0);
  const netProfit = report.totalProfit - todayExpenses;

  // ── Capital / Break-even ──
  const currentCapital = useCapitalStore(useShallow((s) => s.getCurrentCapital()));
  const capitalTransactions = useCapitalStore(useShallow((s) => s.capitalTransactions));
  const lifetimeNetProfit = useMemo(() => {
    const profit = transactions
      .filter((t) => !(t.paymentMethod === "qris" && t.status === "debt"))
      .reduce((s, t) => s + t.totalProfit, 0);
    return profit - expenses.reduce((s, e) => s + e.totalAmount, 0);
  }, [transactions, expenses]);
  const breakEvenPercent = currentCapital > 0 ? (lifetimeNetProfit / currentCapital) * 100 : 0;
  const remainingCapital = currentCapital - lifetimeNetProfit;
  const isBreakEven = breakEvenPercent >= 100;

  // Sales trend: last 7 days (local time) — unpaid QRIS excluded from revenue.
  const chart = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => getDateOffsetISO(6 - i));
    const values = days.map(
      (day) =>
        transactions
          .filter((t) => t.date.startsWith(day) && !(t.paymentMethod === "qris" && t.status === "debt"))
          .reduce((sum, t) => sum + t.totalAmount, 0)
    );
    return { days, values };
  }, [transactions]);

  const chartData = useMemo(
    () =>
      chart.days.map((day, i) => ({
        label: `${formatDateShort(day)} (${DAY_LABELS[new Date(day).getDay()]})`,
        value: chart.values[i],
      })),
    [chart]
  );

  const loading = txnLoading || productsLoading;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Ringkasan usaha hari ini" />

      {/* Metric Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Penjualan Hari Ini"
            value={formatCurrency(report.totalSales)}
            icon="payments"
            tone="info"
            footer={`${report.transactionCount} transaksi`}
          />
          <KpiCard
            label="Laba Hari Ini"
            value={formatCurrency(report.totalProfit)}
            icon="trending_up"
            tone="success"
          />
          <KpiCard
            label="Pengeluaran Hari Ini"
            value={formatCurrency(todayExpenses)}
            icon="receipt_long"
            tone="warning"
          />
          <KpiCard
            label="Laba Bersih"
            value={formatCurrency(netProfit)}
            icon="account_balance_wallet"
            tone={netProfit < 0 ? "danger" : "default"}
            footer={netProfit < 0 ? "Pengeluaran melebihi laba" : "Laba setelah pengeluaran"}
          />
        </section>
      )}

      {/* Capital / Break-even Summary */}
      <section className="rounded-lg border border-border-standard bg-card p-5 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-md bg-info/10 text-info">
              <Icon name="account_balance_wallet" size={20} />
            </span>
            <h4 className="text-label-xl font-bold text-on-surface">Modal & Balik Modal</h4>
          </div>
          <Link href="/capital" className="text-label-md font-semibold text-secondary hover:underline">
            Lihat Semua
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-border-standard bg-card p-4">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Modal Aktif</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-on-surface">
              {formatCurrency(currentCapital)}
            </p>
            <p className="mt-1 text-caption text-on-surface-variant">{capitalTransactions.length} transaksi modal</p>
          </div>
          <div className="rounded-md border border-border-standard bg-card p-4">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Progres Balik Modal</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-secondary">
              {Math.round(breakEvenPercent)}%
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container">
              <div
                className={`h-full rounded-full ${isBreakEven ? "bg-success" : "bg-secondary"}`}
                style={{ width: `${Math.min(breakEvenPercent, 100)}%` }}
              />
            </div>
          </div>
          <div className="rounded-md border border-border-standard bg-card p-4">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Sisa Modal</p>
            <p className={`mt-1 text-2xl font-bold tracking-tight ${remainingCapital < 0 ? "text-danger" : "text-on-surface"}`}>
              {formatCurrency(remainingCapital)}
            </p>
            <p className="mt-1 text-caption text-on-surface-variant">Modal − Laba bersih</p>
          </div>
          <div className="flex items-center rounded-md border border-border-standard bg-surface-container-low p-4">
            {isBreakEven ? (
              <p className="text-label-md font-bold text-success">
                ✅ Sudah Balik Modal
              </p>
            ) : (
              <p className="text-label-md font-bold text-on-surface-variant">
                {currentCapital > 0
                  ? `Perlu ${formatCurrency(remainingCapital)} lagi untuk balik modal`
                  : "Belum ada modal tercatat"}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Middle: Stock Alerts & Active Debts */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stock Alerts */}
        <div className="rounded-lg border border-border-standard bg-card p-5 shadow-card">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-md bg-danger/10 text-danger">
                <Icon name="error" size={20} />
              </span>
              <h4 className="text-label-xl font-bold text-on-surface">Stok Menipis</h4>
            </div>
            <Link href="/produk" className="text-label-md font-semibold text-secondary hover:underline">
              Lihat Semua
            </Link>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="py-8 text-center text-body-md text-on-surface-variant/60">Semua stok aman</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {lowStockProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="rounded-md border border-border-standard bg-card p-4 transition-colors hover:border-danger/30">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-container">
                      <Icon name="package" size={22} className="text-on-surface-variant" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-body-sm font-bold text-on-surface">{product.name}</p>
                      <p className="text-caption text-on-surface-variant">{product.category}</p>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <StatusBadge
                        label={product.stock <= 2 ? "Kritis" : "Stok Tipis"}
                        variant={product.stock <= 2 ? "danger" : "warning"}
                      />
                      <p className="mt-1.5 text-headline-md font-bold text-on-surface">
                        {product.stock} <span className="text-body-sm font-normal text-on-surface-variant">pcs</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Debts */}
        <div className="rounded-lg border border-border-standard bg-card p-5 shadow-card">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-md bg-warning/10 text-warning">
                <Icon name="history_edu" size={20} />
              </span>
              <h4 className="text-label-xl font-bold text-on-surface">Kasbon Aktif</h4>
            </div>
            <Link href="/kasbon" className="text-label-md font-semibold text-secondary hover:underline">
              Lihat Semua
            </Link>
          </div>
          {debtors.length === 0 ? (
            <p className="py-8 text-center text-body-md text-on-surface-variant/60">Tidak ada kasbon aktif</p>
          ) : (
            <>
              <div className="mb-4 flex gap-3">
                <div className="flex-1 rounded-md bg-surface-container-low p-3">
                  <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Pelanggan</p>
                  <p className="mt-0.5 text-numeric-display font-bold text-on-surface">{debtors.length}</p>
                </div>
                <div className="flex-1 rounded-md bg-surface-container-low p-3">
                  <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Total Piutang</p>
                  <p className="mt-0.5 text-numeric-display font-bold text-warning">{formatCurrency(activeDebtTotal)}</p>
                </div>
              </div>
              <div className="max-h-[260px] space-y-1 overflow-y-auto">
                {debtors.map((customer) => (
                  <div key={customer.id} className="group flex items-center justify-between rounded-md p-3 transition-colors hover:bg-surface-container-low">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-info/10 font-bold text-info">
                        {customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-body-sm font-bold text-on-surface">{customer.name}</p>
                        <p className="text-caption text-on-surface-variant">
                          Terakhir: {getRelativeTime(customer.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-3 text-right">
                      <div>
                        <p className="font-bold text-on-surface">{formatCurrencyCompact(customer.currentDebt)}</p>
                        {customer.currentDebt > 100000 && (
                          <StatusBadge label="Overdue" variant="danger" className="mt-1" />
                        )}
                      </div>
                      <Icon name="chevron_right" size={16} className="text-outline" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Sales Trend */}
      <section className="rounded-lg border border-border-standard bg-card p-5 shadow-card">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-label-xl font-bold text-on-surface">Tren Penjualan</h4>
            <p className="text-body-sm text-on-surface-variant">
              {formatDateShort(chart.days[0])} — {formatDateShort(chart.days[6])}
            </p>
          </div>
          <span className="text-caption text-on-surface-variant">7 hari terakhir</span>
        </div>
        {loading ? (
          <SkeletonText lines={5} />
        ) : chartData.some((d) => d.value > 0) ? (
          <LineChart data={chartData} />
        ) : (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-on-surface-variant/60">
            <Icon name="trending_up" size={40} />
            <p className="text-body-md">Belum ada penjualan 7 hari terakhir</p>
          </div>
        )}
      </section>
    </div>
  );
}
