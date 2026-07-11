"use client";

import { useReportStore } from "@/stores/use-report-store";
import { Icon } from "@/lib/icon-map";
import { PERIOD_OPTIONS } from "@/lib/constants";
import type { PeriodFilter } from "@/types";

export default function PeriodFilter() {
  const period = useReportStore((s) => s.period);
  const customStart = useReportStore((s) => s.customStart);
  const customEnd = useReportStore((s) => s.customEnd);
  const setPeriod = useReportStore((s) => s.setPeriod);
  const setCustomRange = useReportStore((s) => s.setCustomRange);

  const handleCustomStart = (val: string) => {
    setCustomRange(val, customEnd || val);
  };

  const handleCustomEnd = (val: string) => {
    setCustomRange(customStart || val, val);
  };

  return (
    <div className="space-y-3">
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

      {period === "custom" && (
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <label className="text-label-md text-on-surface-variant block mb-1">Dari</label>
            <input
              type="date"
              value={customStart || ""}
              onChange={(e) => handleCustomStart(e.target.value)}
              className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none text-body-md"
            />
          </div>
          <span className="text-on-surface-variant mt-6">—</span>
          <div className="flex-1">
            <label className="text-label-md text-on-surface-variant block mb-1">Sampai</label>
            <input
              type="date"
              value={customEnd || ""}
              onChange={(e) => handleCustomEnd(e.target.value)}
              className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none text-body-md"
            />
          </div>
        </div>
      )}
    </div>
  );
}
