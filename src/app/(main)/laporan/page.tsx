"use client";

import { useMemo } from "react";
import PeriodFilter from "@/components/laporan/period-filter";
import { Icon } from "@/lib/icon-map";
import { useReportStore } from "@/stores/use-report-store";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { formatCurrency, formatDateShort, getTodayISO } from "@/lib/formatters";
import { PERIOD_LABELS } from "@/lib/constants";
import { exportToPDF } from "@/lib/export";

function getDateRange(period: string, customStart?: string | null, customEnd?: string | null) {
  const today = getTodayISO();
  switch (period) {
    case "today":
      return { start: today, end: today };
    case "week": {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return { start: start.toISOString().split("T")[0], end: today };
    }
    case "month": {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: start.toISOString().split("T")[0], end: today };
    }
    case "custom":
      return { start: customStart || today, end: customEnd || today };
    default:
      return { start: today, end: today };
  }
}

function generateChartData(start: string, end: string) {
  const days = Math.ceil(
    (new Date(end).getTime() - new Date(start).getTime()) / 86400000
  );
  const numPoints = Math.min(days + 1, 30);
  return Array.from({ length: numPoints }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return {
      label: formatDateShort(d.toISOString().split("T")[0]),
      value: Math.floor(Math.random() * 3000000) + 500000,
    };
  });
}

export default function LaporanPage() {
  const period = useReportStore((s) => s.period);
  const customStart = useReportStore((s) => s.customStart);
  const customEnd = useReportStore((s) => s.customEnd);
  const getTransactionsByDateRange = useTransactionStore((s) => s.getTransactionsByDateRange);
  const getTopProducts = useTransactionStore((s) => s.getTopProducts);

  const { start, end } = useMemo(
    () => getDateRange(period, customStart, customEnd),
    [period, customStart, customEnd]
  );

  const transactions = useMemo(
    () => getTransactionsByDateRange(start, end),
    [start, end, getTransactionsByDateRange]
  );

  const totalSales = transactions.reduce((s, t) => s + t.totalAmount, 0);
  const totalProfit = transactions.reduce((s, t) => s + t.totalProfit, 0);
  const totalCash = transactions
    .filter((t) => t.paymentMethod === "cash")
    .reduce((s, t) => s + t.totalAmount, 0);
  const totalKasbon = transactions
    .filter((t) => t.paymentMethod === "kasbon")
    .reduce((s, t) => s + t.totalAmount, 0);

  const chartData = useMemo(() => generateChartData(start, end), [start, end]);

  const topProducts = useMemo(
    () => getTopProducts(start, end),
    [start, end, getTopProducts]
  );

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  const profitMargin = totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0;

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
            <span>+12% vs bln lalu</span>
          </div>
        </div>
        <div className="bg-white border border-border-standard p-5 rounded-lg">
          <p className="text-label-md text-on-surface-variant">Laba Bersih</p>
          <h3 className="text-numeric-display font-bold text-secondary mt-1">{formatCurrency(totalProfit)}</h3>
          <div className="flex items-center gap-1 mt-3 text-success-paid text-sm">
            <Icon name="trending_up" size={16} />
            <span>+5% vs bln lalu</span>
          </div>
        </div>
        <div className="bg-white border border-border-standard p-5 rounded-lg">
          <p className="text-label-md text-on-surface-variant">Total Transaksi</p>
          <h3 className="text-numeric-display font-bold text-primary mt-1">{transactions.length}</h3>
          <div className="flex items-center gap-1 mt-3 text-on-surface-variant text-sm">
            <Icon name="history_edu" size={16} />
            <span>Rata-rata {Math.max(1, Math.round(transactions.length / Math.max(1, chartData.length)))}/hari</span>
          </div>
        </div>
        <div className="bg-white border border-border-standard p-5 rounded-lg">
          <p className="text-label-md text-on-surface-variant">Kasbon Aktif</p>
          <h3 className="text-numeric-display font-bold text-warning-debt mt-1">{formatCurrency(totalKasbon)}</h3>
          <div className="flex items-center gap-1 mt-3 text-danger-alert text-sm">
            <Icon name="warning" size={16} />
            <span>Belum dibayar</span>
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
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-on-surface-variant/50">
              Belum ada data
            </div>
          ) : (
            <div className="h-64 w-full flex items-end gap-1 pb-6 relative">
              <div className="absolute inset-0 grid grid-rows-4 pointer-events-none">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="border-t border-surface-variant"></div>
                ))}
              </div>
              {chartData.map((point, i) => {
                const height = (point.value / maxValue) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div
                      className={`w-full rounded-t-sm transition-all hover:opacity-80 ${
                        point.value === maxValue ? "bg-secondary" : "bg-secondary opacity-40 hover:opacity-60"
                      }`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    ></div>
                    <span className="text-[10px] text-outline text-center absolute bottom-0">
                      {point.label}
                    </span>
                  </div>
                );
              })}
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
                <span className="text-xs text-on-surface-variant">Margin</span>
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
                  <span className="text-label-md">Modal</span>
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
                totalSales,
                totalProfit,
                totalCash,
                totalKasbon,
                transactionCount: transactions.length,
                topProducts,
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
