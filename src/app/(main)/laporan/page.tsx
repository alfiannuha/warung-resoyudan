"use client";

import { useMemo } from "react";
import PeriodFilter from "@/components/laporan/period-filter";
import { Icon } from "@/lib/icon-map";
import { useReportStore } from "@/stores/use-report-store";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useExpenseStore } from "@/stores/use-expense-store";
import { formatCurrency, formatDateShort, getTodayISO } from "@/lib/formatters";
import { PERIOD_LABELS } from "@/lib/constants";
import { exportToPDF } from "@/lib/export";
import LineChart from "@/components/laporan/line-chart";
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
      return { start: start.toISOString().split("T")[0], end: today };
    }
    case "month": {
      const now = new Date();
      // First day of current month
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      // Last day of current month (day 0 of next month)
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

  const totalSales = filteredTransactions.reduce((s, t) => s + t.totalAmount, 0);
  const totalProfit = filteredTransactions.reduce((s, t) => s + t.totalProfit, 0);
  const totalCash = filteredTransactions
    .filter((t) => t.paymentMethod === "cash")
    .reduce((s, t) => s + t.totalAmount, 0);
  const totalKasbon = filteredTransactions
    .filter((t) => t.paymentMethod === "kasbon")
    .reduce((s, t) => s + t.totalAmount, 0);
  const totalExpenses = expenses
    .filter((e) => e.expenseDate >= start && e.expenseDate <= end)
    .reduce((s, e) => s + e.totalAmount, 0);
  const netProfit = totalProfit - totalExpenses;

  const chartData = useMemo(
    () => generateChartData(start, end, transactions),
    [start, end, transactions]
  );

  const topProducts = useMemo(
    () => getTopProducts(start, end),
    [start, end, getTopProducts]
  );

  // Cash advance (kasbon) summary for the PDF: active = unpaid kasbon txns,
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

  return (
    <div className="space-y-6">
      <PeriodFilter />

      {/* Metric Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border-standard p-5 rounded-lg">
          <p className="text-label-md text-on-surface-variant">Total Penjualan</p>
          <h3 className="text-numeric-display font-bold text-primary mt-1">{formatCurrency(totalSales)}</h3>
          <div className="flex items-center gap-1 mt-3 text-success-paid text-sm">
            <Icon name="trending_up" size={16} />
            <span>{PERIOD_LABELS[period] || period}</span>
          </div>
        </div>
        <div className="bg-white border border-border-standard p-5 rounded-lg">
          <p className="text-label-md text-on-surface-variant">Laba Kotor</p>
          <h3 className="text-numeric-display font-bold text-secondary mt-1">{formatCurrency(totalProfit)}</h3>
          <div className="flex items-center gap-1 mt-3 text-on-surface-variant text-sm">
            <Icon name="trending_up" size={16} />
            <span>Penjualan − HPP</span>
          </div>
        </div>
        <div className="bg-white border border-border-standard p-5 rounded-lg">
          <p className="text-label-md text-on-surface-variant">Total Pengeluaran</p>
          <h3 className="text-numeric-display font-bold text-danger-alert mt-1">{formatCurrency(totalExpenses)}</h3>
          <div className="flex items-center gap-1 mt-3 text-on-surface-variant text-sm">
            <Icon name="receipt_long" size={16} />
            <span>{filteredExpenses.length} pengeluaran</span>
          </div>
        </div>
        <div className="bg-white border border-border-standard p-5 rounded-lg">
          <p className="text-label-md text-on-surface-variant">Laba Bersih</p>
          <h3 className={`text-numeric-display font-bold mt-1 ${netProfit < 0 ? "text-danger-alert" : "text-secondary"}`}>{formatCurrency(netProfit)}</h3>
          <div className="flex items-center gap-1 mt-3 text-on-surface-variant text-sm">
            <Icon name="trending_up" size={16} />
            <span>Laba Kotor − Pengeluaran</span>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white border border-border-standard p-6 rounded-lg">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-label-xl font-bold">Tren Penjualan</h4>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-secondary"></span>
              <span className="text-label-md text-on-surface-variant">Pendapatan</span>
            </div>
          </div>
          <LineChart data={chartData} />
          {/* X-axis labels */}
          {chartData.length > 0 && chartData.some((d) => d.value > 0) && (
            <div className="flex justify-between mt-2 px-0">
              {chartData.map((point, i) => (
                <span key={i} className="text-[9px] text-outline truncate">
                  {point.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Profit Margin */}
        <div className="bg-white border border-border-standard p-6 rounded-lg">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-label-xl font-bold">Margin Laba</h4>
          </div>
          <div className="flex flex-col gap-6 items-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="transparent" r="40" stroke="#E2E8F0" strokeWidth="12"></circle>
                <circle cx="50" cy="50" fill="transparent" r="40" stroke="#0051d5" strokeDasharray={`${profitMargin * 2.51}, 251`} strokeWidth="12"></circle>
                <circle cx="50" cy="50" fill="transparent" r="40" stroke="#000000" strokeDasharray={`${(100 - profitMargin) * 2.51}, 251`} strokeDashoffset={`${-profitMargin * 2.51}`} strokeWidth="12"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-primary">{profitMargin}%</span>
                <span className="text-xs text-on-surface-variant">Margin Bersih</span>
              </div>
            </div>
            <div className="w-full space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span className="text-label-md">Laba Bersih</span>
                </div>
                <span className="text-label-md">{profitMargin}%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-label-md">Biaya (Modal + Pengeluaran)</span>
                </div>
                <span className="text-label-md">{100 - profitMargin}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Products Table */}
      <section className="bg-white border border-border-standard rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-border-standard flex justify-between items-center">
          <h4 className="text-label-xl font-bold">Produk Terlaris</h4>
        </div>
        {topProducts.length === 0 ? (
          <div className="px-6 py-8 text-center text-on-surface-variant/50">
            Belum ada produk terjual
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-muted border-b border-border-standard">
                <tr>
                  <th className="px-6 py-3 text-label-md text-on-surface-variant">Produk</th>
                  <th className="px-6 py-3 text-label-md text-on-surface-variant">Terjual</th>
                  <th className="px-6 py-3 text-label-md text-on-surface-variant text-right">Pendapatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-standard">
                {topProducts.map((product, i) => (
                  <tr key={i} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-surface-variant flex items-center justify-center">
                          <Icon name="package" size={20} className="text-outline" />
                        </div>
                        <p className="font-semibold text-primary">{product.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface">{product.qty} Unit</td>
                    <td className="px-6 py-4 text-right font-numeric-display text-sm">{formatCurrency(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Export Button */}
      <div className="pb-4">
        <div className="flex justify-end">
          <button
            onClick={() =>
              exportToPDF({
                periodLabel: PERIOD_LABELS[period] || period,
                startDate: start,
                endDate: end,
                totalSales,
                totalProfit,
                totalExpenses,
                totalCash,
                totalKasbon,
                transactionCount: filteredTransactions.length,
                topProducts,
                cashAdvanceSummary,
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
              })
            }
            className="flex items-center gap-2 px-6 py-3 bg-secondary text-on-secondary rounded-lg font-bold hover:bg-secondary-container transition-all active:scale-95"
          >
            <Icon name="picture_as_pdf" size={20} />
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}
