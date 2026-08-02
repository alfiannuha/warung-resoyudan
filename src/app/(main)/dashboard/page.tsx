"use client";

import { useMemo } from "react";
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
  const report = useTransactionStore(
    useShallow((s) => s.getDailyReport(today))
  );
  const transactions = useTransactionStore(useShallow((s) => s.transactions));

  const debtors = useCustomerStore(
    useShallow((s) => s.customers.filter((c) => c.currentDebt > 0))
  );

  const lowStockProducts = useProductStore(
    useShallow((s) =>
      s.products.filter((p) => p.isActive && p.stock <= p.minStock)
    )
  );

  const activeDebtTotal = debtors.reduce((s, c) => s + c.currentDebt, 0);

  const expenses = useExpenseStore(useShallow((s) => s.expenses));
  const todayExpenses = expenses
    .filter((e) => e.expenseDate.startsWith(today))
    .reduce((s, e) => s + e.totalAmount, 0);
  const netProfit = report.totalProfit - todayExpenses;

  // ── Capital / Break-even ──
  const currentCapital = useCapitalStore(useShallow((s) => s.getCurrentCapital()));
  const capitalTransactions = useCapitalStore(
    useShallow((s) => s.capitalTransactions)
  );
  // Lifetime net profit (all transactions, excluding unpaid QRIS) minus expenses.
  const lifetimeNetProfit = useMemo(() => {
    const profit = transactions
      .filter((t) => !(t.paymentMethod === "qris" && t.status === "debt"))
      .reduce((s, t) => s + t.totalProfit, 0);
    return profit - expenses.reduce((s, e) => s + e.totalAmount, 0);
  }, [transactions, expenses]);
  const breakEvenPercent =
    currentCapital > 0 ? (lifetimeNetProfit / currentCapital) * 100 : 0;
  const remainingCapital = currentCapital - lifetimeNetProfit;
  const isBreakEven = breakEvenPercent >= 100;

  // Sales trend: last 7 days (local time) — unpaid QRIS excluded from revenue.
  const chart = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => getDateOffsetISO(6 - i));
    const values = days.map(
      (day) =>
        transactions
          .filter(
            (t) =>
              t.date.startsWith(day) &&
              !(t.paymentMethod === "qris" && t.status === "debt")
          )
          .reduce((sum, t) => sum + t.totalAmount, 0)
    );
    return { days, values };
  }, [transactions]);

  const total7Days = chart.values.reduce((s, v) => s + v, 0);
  const maxValue = Math.max(...chart.values, 0);

  const buildLine = (values: number[], w: number, h: number) => {
    const n = values.length;
    if (n === 0) return "";
    const max = Math.max(...values, 0);
    const minY = 0;
    const step = w / (n - 1);
    const points = values.map((v, i) => {
      const x = i * step;
      const ratio = max > 0 ? v / max : 0;
      const y = h - (minY + ratio * (h - minY));
      return { x, y };
    });

    if (n === 1) return `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;

    // Catmull-Rom to cubic Bézier for a smooth line through all points.
    let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const linePath = buildLine(chart.values, 100, 40);

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-border-standard p-5 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-container/10 text-secondary rounded-lg">
              <Icon name="payments" size={24} />
            </div>
            <span className="text-success-paid text-xs font-bold bg-success-paid/10 px-2 py-0.5 rounded-full">Hari Ini</span>
          </div>
          <p className="text-label-md text-on-surface-variant uppercase tracking-wide">Total Penjualan</p>
          <h3 className="text-numeric-display font-bold text-primary mt-1">{formatCurrency(report.totalSales)}</h3>
        </div>

        <div className="bg-white border border-border-standard p-5 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tertiary-fixed/30 text-tertiary-fixed-dim rounded-lg">
              <Icon name="trending_up" size={24} className="text-[#574425]" />
            </div>
            <span className="text-success-paid text-xs font-bold bg-success-paid/10 px-2 py-0.5 rounded-full">Hari Ini</span>
          </div>
          <p className="text-label-md text-on-surface-variant uppercase tracking-wide">Laba Kotor</p>
          <h3 className="text-numeric-display font-bold text-primary mt-1">{formatCurrency(report.totalProfit)}</h3>
        </div>

        <div className="bg-white border border-border-standard p-5 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-error-container text-error rounded-lg">
              <Icon name="receipt_long" size={24} />
            </div>
            <span className="text-danger-alert text-xs font-bold bg-danger-alert/10 px-2 py-0.5 rounded-full">Hari Ini</span>
          </div>
          <p className="text-label-md text-on-surface-variant uppercase tracking-wide">Pengeluaran</p>
          <h3 className="text-numeric-display font-bold text-danger-alert mt-1">{formatCurrency(todayExpenses)}</h3>
        </div>

        <div className="bg-white border border-border-standard p-5 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-container/10 text-secondary rounded-lg">
              <Icon name="account_balance_wallet" size={24} />
            </div>
            <span className="text-success-paid text-xs font-bold bg-success-paid/10 px-2 py-0.5 rounded-full">Hari Ini</span>
          </div>
          <p className="text-label-md text-on-surface-variant uppercase tracking-wide">Laba Bersih</p>
          <h3 className={`text-numeric-display font-bold mt-1 ${netProfit < 0 ? "text-danger-alert" : "text-primary"}`}>{formatCurrency(netProfit)}</h3>
        </div>
      </section>

      {/* Capital / Break-even Summary */}
      <section className="bg-white border border-border-standard rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Icon name="account_balance_wallet" size={24} className="text-secondary" />
            <h4 className="text-label-xl font-bold">Modal & Balik Modal</h4>
          </div>
          <a href="/capital" className="text-secondary text-label-md hover:underline">
            Lihat Semua
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border-standard">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              Current Capital
            </p>
            <p className="text-numeric-display font-bold text-primary mt-1">
              {formatCurrency(currentCapital)}
            </p>
            <p className="text-[10px] text-on-surface-variant mt-1">
              {capitalTransactions.length} transaksi modal
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border-standard">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              Break-even Progress
            </p>
            <p className="text-numeric-display font-bold text-secondary mt-1">
              {Math.round(breakEvenPercent)}%
            </p>
            <div className="h-1.5 bg-surface-variant rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${isBreakEven ? "bg-success-paid" : "bg-secondary"}`}
                style={{ width: `${Math.min(breakEvenPercent, 100)}%` }}
              />
            </div>
          </div>
          <div className="p-4 rounded-xl border border-border-standard">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              Remaining Capital
            </p>
            <p className={`text-numeric-display font-bold mt-1 ${remainingCapital < 0 ? "text-danger-alert" : "text-primary"}`}>
              {formatCurrency(remainingCapital)}
            </p>
            <p className="text-[10px] text-on-surface-variant mt-1">Modal − Laba bersih</p>
          </div>
          <div className="p-4 rounded-xl border border-border-standard bg-surface-container-low flex items-center">
            {isBreakEven ? (
              <p className="text-label-md font-bold text-success-paid">
                ✅ Business has reached Break-even Point
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
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Alerts */}
        <div className="bg-white border border-border-standard rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Icon name="error" size={24} className="text-danger-alert" />
              <h4 className="text-label-xl font-bold">Stock Alerts</h4>
            </div>
            <a href="/produk" className="text-secondary text-label-md hover:underline">Lihat Semua</a>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-on-surface-variant/50 text-center py-8">Semua stok aman</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lowStockProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="p-4 rounded-lg border border-border-standard hover:border-danger-alert transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center shrink-0">
                      <Icon name="package" size={24} className="text-outline" />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">{product.name}</p>
                      <p className="text-xs text-on-surface-variant">{product.category}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-danger-alert font-bold uppercase">
                        {product.stock <= 2 ? "Critical" : "Low Stock"}
                      </p>
                      <p className="text-headline-md font-bold">{product.stock} <span className="text-sm font-normal">pcs</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Debts */}
        <div className="bg-white border border-border-standard rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Icon name="history_edu" size={24} className="text-warning-debt" />
              <h4 className="text-label-xl font-bold">Kasbon Aktif</h4>
            </div>
            <a href="/kasbon" className="text-secondary text-label-md hover:underline">Lihat Semua</a>
          </div>
          {debtors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-on-surface-variant/50">Tidak ada kasbon aktif</p>
            </div>
          ) : (
            <>
              <div className="flex gap-3 mb-4">
                <div className="flex-1 p-3 rounded-xl bg-surface-container-low">
                  <p className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wide">Pelanggan</p>
                  <p className="text-numeric-display font-bold text-on-surface">{debtors.length}</p>
                </div>
                <div className="flex-1 p-3 rounded-xl bg-surface-container-low">
                  <p className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wide">Total Piutang</p>
                  <p className="text-numeric-display font-bold text-warning-debt">{formatCurrency(activeDebtTotal)}</p>
                </div>
              </div>
              <div className="space-y-1 max-h-[260px] overflow-y-auto">
                {debtors.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold shrink-0">
                        {customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-on-surface truncate">{customer.name}</p>
                        <p className="text-xs text-on-surface-variant">Terakhir: {getRelativeTime(customer.updatedAt)}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3 shrink-0 ml-3">
                      <div>
                        <p className="font-bold text-danger-alert">{formatCurrencyCompact(customer.currentDebt)}</p>
                        {customer.currentDebt > 100000 && (
                          <span className="text-[10px] font-bold bg-error-container text-error px-2 py-0.5 rounded-full uppercase">Overdue</span>
                        )}
                      </div>
                      <Icon name="chevron_right" size={16} className="text-outline group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Sales Trend */}
      <section className="bg-white border border-border-standard rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-label-xl font-bold">Tren Penjualan</h4>
            <p className="text-body-md text-on-surface-variant">
              {formatDateShort(chart.days[0])} — {formatDateShort(chart.days[6])}
            </p>
          </div>
          <span className="text-label-md text-on-surface-variant">7 hari terakhir</span>
        </div>

        <div className="relative h-64">
          {/* Horizontal gridlines + Y-axis labels */}
          <div className="absolute inset-0 grid grid-rows-5 pointer-events-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-surface-variant relative">
                <span className="absolute -top-2 left-0 text-[9px] text-outline">
                  {maxValue > 0 ? formatCurrencyCompact(maxValue - (maxValue / 4) * i) : "Rp 0"}
                </span>
              </div>
            ))}
          </div>

          {total7Days === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Icon name="trending_up" size={40} className="text-outline/50" />
              <p className="text-on-surface-variant/50">Belum ada penjualan 7 hari terakhir</p>
            </div>
          ) : (
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
              {/* Area fill */}
              <path
                d={`M0,40 ${linePath.slice(1)} L100,40 Z`}
                fill="rgba(37, 99, 235, 0.08)"
                stroke="none"
              />
              {/* Line */}
              <path
                d={linePath}
                fill="none"
                stroke="var(--color-secondary, #2563eb)"
                strokeWidth="0.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}

          {/* Points (HTML dots so they stay round despite SVG stretch) */}
          {total7Days > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {chart.values.map((v, i) => {
                const x = (i / (chart.values.length - 1)) * 100;
                const ratio = maxValue > 0 ? v / maxValue : 0;
                const y = 100 - ratio * 100;
                return (
                  <div
                    key={i}
                    className="group absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary ring-2 ring-white"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    title={`${formatDateShort(chart.days[i])}: ${formatCurrency(v)}`}
                  />
                );
              })}
            </div>
          )}

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between">
            {chart.days.map((day, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-[10px] text-on-surface-variant font-medium">
                  {new Date(day).getDate()}
                </span>
                <span className="text-[9px] text-outline">
                  {DAY_LABELS[new Date(day).getDay()]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
