"use client";

import { useMemo, useState } from "react";
import PeriodFilter from "@/components/laporan/period-filter";
import { Icon } from "@/lib/icon-map";
import { useReportStore } from "@/stores/use-report-store";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useExpenseStore } from "@/stores/use-expense-store";
import { useCapitalStore } from "@/stores/use-capital-store";
import { formatCurrency, formatDateShort, getTodayISO } from "@/lib/formatters";
import { PERIOD_LABELS } from "@/lib/constants";
import { exportToPDF } from "@/lib/export";
import LineChart from "@/components/laporan/line-chart";
import PageHeader from "@/components/shared/page-header";
import KpiCard from "@/components/shared/kpi-card";
import { useToast } from "@/components/shared/toast-provider";
import type { Transaction } from "@/types";

function getDateRange(period: string, customStart?: string | null, customEnd?: string | null) {
  const today = getTodayISO();
  switch (period) {
    case "today":
      return { start: today, end: today };
    case "yesterday": {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const date = `${y}-${m}-${day}`;
      return { start: date, end: date };
    }
    case "week": {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      // Local time, matching the other periods.
      const y = start.getFullYear();
      const m = String(start.getMonth() + 1).padStart(2, "0");
      const day = String(start.getDate()).padStart(2, "0");
      return { start: `${y}-${m}-${day}`, end: today };
    }
    case "month": {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const fmt = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };
      return { start: fmt(start), end: fmt(end) };
    }
    case "custom":
      return { start: customStart || today, end: customEnd || today };
    default:
      return { start: today, end: today };
  }
}

/** Local-time YYYY-MM-DD stepping forward from `start`. */
function getDateOffsetISO(base: string, offsetDays: number): string {
  const d = new Date(`${base}T00:00:00`);
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function generateChartData(
  start: string,
  end: string,
  transactions: Transaction[],
) {
  const days = Math.ceil(
    (new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000,
  );
  const numPoints = Math.min(days + 1, 30);
  return Array.from({ length: numPoints }, (_, i) => {
    const day = getDateOffsetISO(start, i);
    const value = transactions
      .filter((t) => t.date.startsWith(day))
      .reduce((sum, t) => sum + t.totalAmount, 0);
    return {
      label: formatDateShort(day),
      value,
    };
  });
}

export default function LaporanPage() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const period = useReportStore((s) => s.period);
  const customStart = useReportStore((s) => s.customStart);
  const customEnd = useReportStore((s) => s.customEnd);
  const getTransactionsByDateRange = useTransactionStore((s) => s.getTransactionsByDateRange);
  const getTopProducts = useTransactionStore((s) => s.getTopProducts);
  const transactions = useTransactionStore((s) => s.transactions);
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);
  const expenses = useExpenseStore((s) => s.expenses);

  const { start, end } = useMemo(
    () => getDateRange(period, customStart, customEnd),
    [period, customStart, customEnd]
  );

  const filteredTransactions = useMemo(
    () => getTransactionsByDateRange(start, end),
    [start, end, getTransactionsByDateRange]
  );

  // Unpaid QRIS is not yet revenue — exclude from sales metrics & charts.
  const reportedTransactions = useMemo(
    () =>
      filteredTransactions.filter(
        (t) => !(t.paymentMethod === "qris" && t.status === "debt")
      ),
    [filteredTransactions]
  );

  const totalSales = reportedTransactions.reduce((s, t) => s + t.totalAmount, 0);
  const totalProfit = reportedTransactions.reduce((s, t) => s + t.totalProfit, 0);
  const totalCash = reportedTransactions
    .filter((t) => t.paymentMethod === "cash")
    .reduce((s, t) => s + t.totalAmount, 0);
  const totalKasbon = reportedTransactions
    .filter((t) => t.paymentMethod === "kasbon")
    .reduce((s, t) => s + t.totalAmount, 0);
  const totalExpenses = expenses
    .filter((e) => e.expenseDate >= start && e.expenseDate <= end)
    .reduce((s, e) => s + e.totalAmount, 0);
  const netProfit = totalProfit - totalExpenses;

  // ── Capital summary (lifetime values, not period-scoped) ──
  const capitalTransactions = useCapitalStore((s) => s.capitalTransactions);
  const currentCapital = capitalTransactions.reduce((sum, t) => {
    return t.type === "withdrawal" ? sum - t.amount : sum + t.amount;
  }, 0);
  const initialCapital = capitalTransactions
    .filter((t) => t.type === "initial")
    .reduce((s, t) => s + t.amount, 0);
  const additionCapital = capitalTransactions
    .filter((t) => t.type === "addition")
    .reduce((s, t) => s + t.amount, 0);
  const withdrawalCapital = capitalTransactions
    .filter((t) => t.type === "withdrawal")
    .reduce((s, t) => s + t.amount, 0);
  const lifetimeProfit = transactions
    .filter((t) => !(t.paymentMethod === "qris" && t.status === "debt"))
    .reduce((s, t) => s + t.totalProfit, 0);
  const lifetimeExpenses = expenses.reduce((s, e) => s + e.totalAmount, 0);
  const lifetimeNetProfit = lifetimeProfit - lifetimeExpenses;
  const breakEvenPercent =
    currentCapital > 0 ? (lifetimeNetProfit / currentCapital) * 100 : 0;
  const remainingCapital = currentCapital - lifetimeNetProfit;

  const chartData = useMemo(
    () => generateChartData(start, end, reportedTransactions),
    [start, end, reportedTransactions]
  );

  const topProducts = useMemo(
    () => getTopProducts(start, end),
    [start, end, getTopProducts]
  );

  // Cash advance (kasbon) summary for the PDF.
  const kasbonTxns = filteredTransactions.filter((t) => t.paymentMethod === "kasbon");
  const activeKasbonTxns = kasbonTxns.filter((t) => t.status === "debt");
  const paidKasbonTxns = kasbonTxns.filter((t) => t.status === "paid");
  const cashAdvanceSummary = {
    activeCount: activeKasbonTxns.length,
    activeTotal: activeKasbonTxns.reduce((s, t) => s + t.totalAmount, 0),
    paidCount: paidKasbonTxns.length,
    paidTotal: paidKasbonTxns.reduce((s, t) => s + t.totalAmount, 0),
  };

  const filteredExpenses = expenses
    .filter((e) => e.expenseDate >= start && e.expenseDate <= end)
    .sort((a, b) => a.expenseDate.localeCompare(b.expenseDate));

  const profitMargin = totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0;

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportToPDF({
        periodLabel: PERIOD_LABELS[period] || period,
        startDate: start,
        endDate: end,
        totalSales,
        totalProfit,
        totalExpenses,
        totalCash,
        totalKasbon,
        transactionCount: reportedTransactions.length,
        topProducts,
        cashAdvanceSummary,
        capitalSummary: {
          initialCapital,
          additionCapital,
          withdrawalCapital,
          currentCapital,
          netProfit: lifetimeNetProfit,
          breakEvenPercent,
          remainingCapital,
        },
        transactions: filteredTransactions.map((t) => ({
          receiptNumber: t.receiptNumber,
          date: t.date,
          customerName: t.customerId
            ? getCustomerById(t.customerId)?.name ?? null
            : null,
          paymentMethod: t.paymentMethod,
          status: t.status === "paid" ? "Lunas" : "Belum Lunas",
          totalAmount: t.totalAmount,
        })),
        expenses: filteredExpenses.map((e) => ({
          expenseNumber: e.expenseNumber,
          expenseDate: e.expenseDate,
          title: e.title,
          totalAmount: e.totalAmount,
        })),
      });
      toast("Laporan berhasil diexport.", "success");
    } catch {
      toast("Gagal mengexport laporan.", "error");
    } finally {
      setExporting(false);
    }
  };

  const chartHasData = chartData.some((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        subtitle={`Periode: ${PERIOD_LABELS[period] || period}`}
        actions={
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-secondary px-5 font-semibold text-white shadow-fab transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <Icon name="picture_as_pdf" size={18} />
            {exporting ? "Mengexport…" : "Export PDF"}
          </button>
        }
      />

      <PeriodFilter />

      {/* Metric Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Penjualan"
          value={formatCurrency(totalSales)}
          icon="payments"
          tone="info"
          footer={PERIOD_LABELS[period] || period}
        />
        <KpiCard
          label="Laba Kotor"
          value={formatCurrency(totalProfit)}
          icon="trending_up"
          tone="success"
          footer="Penjualan − HPP"
        />
        <KpiCard
          label="Total Pengeluaran"
          value={formatCurrency(totalExpenses)}
          icon="receipt_long"
          tone="warning"
          footer={`${filteredExpenses.length} pengeluaran`}
        />
        <KpiCard
          label="Laba Bersih"
          value={formatCurrency(netProfit)}
          icon="account_balance_wallet"
          tone={netProfit < 0 ? "danger" : "default"}
          footer="Laba Kotor − Pengeluaran"
        />
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales Trend */}
        <div className="rounded-lg border border-border-standard bg-card p-5 shadow-card">
          <div className="mb-5 flex items-center justify-between">
            <h4 className="text-label-xl font-bold text-on-surface">Tren Penjualan</h4>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-secondary" />
              <span className="text-caption text-on-surface-variant">Pendapatan</span>
            </div>
          </div>
          <LineChart data={chartData} />
          {chartHasData && (
            <div className="mt-2 flex justify-between overflow-hidden">
              {chartData.map((point, i) => (
                <span key={i} className="truncate text-caption text-on-surface-variant">
                  {point.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Profit Margin */}
        <div className="rounded-lg border border-border-standard bg-card p-5 shadow-card">
          <h4 className="mb-5 text-label-xl font-bold text-on-surface">Margin Laba</h4>
          {totalSales === 0 ? (
            <div className="flex h-64 items-center justify-center text-body-md text-on-surface-variant/60">
              Belum ada data penjualan
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="relative size-44">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="var(--color-border-standard)" strokeWidth="12" />
                  <circle
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="var(--color-secondary)"
                    strokeDasharray={`${profitMargin * 2.51}, 251`}
                    strokeWidth="12"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-on-surface">{profitMargin}%</span>
                  <span className="text-caption text-on-surface-variant">Margin Bersih</span>
                </div>
              </div>
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full bg-secondary" />
                    <span className="text-label-md text-on-surface">Laba Bersih</span>
                  </div>
                  <span className="text-label-md font-semibold text-on-surface">{profitMargin}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full bg-surface-container-high" />
                    <span className="text-label-md text-on-surface-variant">Biaya (Modal + Pengeluaran)</span>
                  </div>
                  <span className="text-label-md font-semibold text-on-surface-variant">{100 - profitMargin}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Capital Summary */}
      <section className="overflow-hidden rounded-lg border border-border-standard bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border-standard px-5 py-4">
          <h4 className="text-label-xl font-bold text-on-surface">Ringkasan Modal</h4>
          <span className="text-caption text-on-surface-variant">Seumur hidup (tidak mengikuti filter)</span>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border-standard md:grid-cols-4">
          <div className="bg-card p-5">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Modal Awal</p>
            <p className="mt-1 text-numeric-display font-bold text-on-surface">{formatCurrency(initialCapital)}</p>
          </div>
          <div className="bg-card p-5">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Penambahan Modal</p>
            <p className="mt-1 text-numeric-display font-bold text-success">{formatCurrency(additionCapital)}</p>
          </div>
          <div className="bg-card p-5">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Penarikan Modal</p>
            <p className="mt-1 text-numeric-display font-bold text-danger">{formatCurrency(withdrawalCapital)}</p>
          </div>
          <div className="bg-card p-5">
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Total Modal Aktif</p>
            <p className="mt-1 text-numeric-display font-bold text-secondary">{formatCurrency(currentCapital)}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 border-t border-border-standard px-5 py-5 md:grid-cols-3">
          <div>
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Laba Bersih (Kumulatif)</p>
            <p className={`mt-1 text-numeric-display font-bold ${lifetimeNetProfit < 0 ? "text-danger" : "text-secondary"}`}>
              {formatCurrency(lifetimeNetProfit)}
            </p>
          </div>
          <div>
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Progres Balik Modal</p>
            <p className="mt-1 text-numeric-display font-bold text-on-surface">{Math.round(breakEvenPercent)}%</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container">
              <div
                className={`h-full rounded-full ${breakEvenPercent >= 100 ? "bg-success" : "bg-secondary"}`}
                style={{ width: `${Math.min(breakEvenPercent, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <p className="text-overline uppercase tracking-[0.08em] text-on-surface-variant">Sisa Modal</p>
            <p className={`mt-1 text-numeric-display font-bold ${remainingCapital < 0 ? "text-danger" : "text-on-surface"}`}>
              {formatCurrency(remainingCapital)}
            </p>
            {breakEvenPercent >= 100 ? (
              <p className="mt-1 text-caption font-bold text-success">✅ Sudah Balik Modal</p>
            ) : (
              <p className="mt-1 text-caption text-on-surface-variant">
                Perlu {formatCurrency(remainingCapital)} lagi untuk balik modal
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Top Products Table */}
      <section className="overflow-hidden rounded-lg border border-border-standard bg-card shadow-card">
        <div className="border-b border-border-standard px-5 py-4">
          <h4 className="text-label-xl font-bold text-on-surface">Produk Terlaris</h4>
        </div>
        {topProducts.length === 0 ? (
          <div className="px-6 py-10 text-center text-body-md text-on-surface-variant/60">
            Belum ada produk terjual
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-border-standard bg-surface-muted">
                <tr>
                  <th className="px-5 py-3 text-label-md text-on-surface-variant">Produk</th>
                  <th className="px-5 py-3 text-label-md text-on-surface-variant">Terjual</th>
                  <th className="px-5 py-3 text-right text-label-md text-on-surface-variant">Pendapatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-standard">
                {topProducts.map((product, i) => (
                  <tr key={i} className="transition-colors hover:bg-surface-container-low">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-md bg-surface-container">
                          <Icon name="package" size={20} className="text-on-surface-variant" />
                        </div>
                        <p className="font-semibold text-on-surface">{product.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-body-sm text-on-surface">{product.qty} Unit</td>
                    <td className="px-5 py-4 text-right text-body-sm font-semibold text-on-surface">
                      {formatCurrency(product.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
