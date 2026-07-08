"use client";

import { useReportStore } from "@/stores/use-report-store";
import { Icon } from "@/lib/icon-map";
import { PERIOD_OPTIONS } from "@/lib/constants";
import type { PeriodFilter } from "@/types";

export default function PeriodFilter() {
  const period = useReportStore((s) => s.period);
  const setPeriod = useReportStore((s) => s.setPeriod);

  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2">
      {PERIOD_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => setPeriod(option.value as PeriodFilter)}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-label-md font-medium active:scale-95 transition-all ${
            period === option.value
              ? "bg-secondary-container text-on-secondary-container"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          {option.value === "custom" && (
            <Icon name="calendar_month" size={18} className="mr-1 align-middle" />
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
}
