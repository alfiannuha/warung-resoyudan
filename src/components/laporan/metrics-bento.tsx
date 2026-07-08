"use client";

import { formatCurrency, formatCurrencyCompact } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";

interface Props {
  totalSales: number;
  totalProfit: number;
  totalCash: number;
  totalKasbon: number;
  transactionCount: number;
}

export default function MetricsBento({
  totalSales,
  totalProfit,
  totalCash,
  totalKasbon,
  transactionCount,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2 p-5 rounded-xl border border-border-standard bg-white shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
        <div className="z-10">
          <p className="text-label-md text-on-surface-variant font-medium">Total Omzet</p>
          <h2 className="text-[28px] font-bold text-primary mt-1">{formatCurrency(totalSales)}</h2>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-10">
          <Icon name="payments" size={100} />
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border-standard bg-white flex flex-col gap-1">
        <p className="text-label-md text-on-surface-variant font-medium">Profit</p>
        <h3 className="text-numeric-display font-bold text-success-paid">{formatCurrencyCompact(totalProfit)}</h3>
      </div>
      <div className="p-4 rounded-xl border border-border-standard bg-white flex flex-col gap-1">
        <p className="text-label-md text-on-surface-variant font-medium">Kas Masuk</p>
        <h3 className="text-numeric-display font-bold text-secondary">{formatCurrencyCompact(totalCash)}</h3>
      </div>
      <div className="p-4 rounded-xl border border-border-standard bg-white flex flex-col gap-1">
        <p className="text-label-md text-on-surface-variant font-medium">Piutang (Kasbon)</p>
        <h3 className="text-numeric-display font-bold text-warning-debt">{formatCurrencyCompact(totalKasbon)}</h3>
      </div>
      <div className="p-4 rounded-xl border border-border-standard bg-white flex flex-col gap-1">
        <p className="text-label-md text-on-surface-variant font-medium">Transaksi</p>
        <h3 className="text-numeric-display font-bold text-on-surface">{transactionCount} Pesanan</h3>
      </div>
    </div>
  );
}
