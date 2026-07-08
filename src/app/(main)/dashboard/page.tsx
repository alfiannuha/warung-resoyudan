"use client";

import { formatDate, formatCurrency, formatCurrencyCompact } from "@/lib/formatters";
import { useTransactionStore } from "@/stores/use-transaction-store";
import { useCustomerStore } from "@/stores/use-customer-store";
import { useProductStore } from "@/stores/use-product-store";
import { useShallow } from "zustand/react/shallow";
import { Icon } from "@/lib/icon-map";
import { getTodayISO } from "@/lib/formatters";

export default function DashboardPage() {
  const today = formatDate(getTodayISO());
  const report = useTransactionStore(
    useShallow((s) => s.getDailyReport(getTodayISO()))
  );

  const debtors = useCustomerStore(
    useShallow((s) => s.customers.filter((c) => c.currentDebt > 0))
  );

  const lowStockProducts = useProductStore(
    useShallow((s) =>
      s.products.filter((p) => p.isActive && p.stock <= p.minStock)
    )
  );

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-border-standard p-5 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-container/10 text-secondary rounded-lg">
              <Icon name="payments" size={24} />
            </div>
            <span className="text-success-paid text-xs font-bold bg-success-paid/10 px-2 py-0.5 rounded-full">Hari Ini</span>
          </div>
          <p className="text-label-md text-on-surface-variant uppercase tracking-wide">Penjualan</p>
          <h3 className="text-numeric-display font-bold text-primary mt-1">{formatCurrency(report.totalSales)}</h3>
        </div>

        <div className="bg-white border border-border-standard p-5 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tertiary-fixed/30 text-tertiary-fixed-dim rounded-lg">
              <Icon name="trending_up" size={24} className="text-[#574425]" />
            </div>
            <span className="text-success-paid text-xs font-bold bg-success-paid/10 px-2 py-0.5 rounded-full">+8.2%</span>
          </div>
          <p className="text-label-md text-on-surface-variant uppercase tracking-wide">Profit</p>
          <h3 className="text-numeric-display font-bold text-primary mt-1">{formatCurrency(report.totalProfit)}</h3>
        </div>

        <div className="bg-white border border-border-standard p-5 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-error-container text-error rounded-lg">
              <Icon name="history_edu" size={24} />
            </div>
            <span className="text-danger-alert text-xs font-bold bg-danger-alert/10 px-2 py-0.5 rounded-full">Aktif</span>
          </div>
          <p className="text-label-md text-on-surface-variant uppercase tracking-wide">Kasbon</p>
          <h3 className="text-numeric-display font-bold text-warning-debt mt-1">{formatCurrency(report.totalKasbon)}</h3>
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
            <p className="text-on-surface-variant/50 text-center py-8">Tidak ada kasbon aktif</p>
          ) : (
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {debtors.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">
                      {customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">{customer.name}</p>
                      <p className="text-xs text-on-surface-variant">Terakhir: 2 hari lalu</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
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
          )}
        </div>
      </section>

      {/* Sales Trend (simplified) */}
      <section className="bg-white border border-border-standard rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-label-xl font-bold">Tren Penjualan</h4>
            <p className="text-body-md text-on-surface-variant">{today}</p>
          </div>
        </div>
        <div className="h-64 w-full flex items-end gap-2 pb-2 relative">
          <div className="absolute inset-0 grid grid-rows-4 pointer-events-none">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="border-t border-surface-variant"></div>
            ))}
          </div>
          {[40, 60, 55, 85, 70, 95, 45].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div
                className="w-full rounded-t-sm bg-secondary transition-all hover:opacity-80"
                style={{ height: `${h}%` }}
              ></div>
              <span className="text-[10px] text-outline text-center">
                {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"][i]}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
