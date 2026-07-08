"use client";

import { formatDateShort } from "@/lib/formatters";

interface DataPoint {
  label: string;
  value: number;
}

interface Props {
  data: DataPoint[];
}

export default function BarChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-border-standard bg-white aspect-[16/9] flex items-center justify-center text-on-surface-variant/50">
        <p>Belum ada data</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="p-4 rounded-xl border border-border-standard bg-white aspect-[16/9] flex items-end justify-between gap-2">
      {data.map((point, i) => {
        const height = (point.value / maxValue) * 100;
        const isHighest = point.value === maxValue;
        return (
          <div
            key={i}
            className="flex flex-col items-center flex-1 gap-2 h-full justify-end"
          >
            <div
              className={`w-full rounded-t-sm transition-all ${
                isHighest
                  ? "bg-secondary-container"
                  : "bg-secondary-fixed-dim"
              }`}
              style={{ height: `${Math.max(height, 4)}%` }}
              title={`${point.label}: ${point.value}`}
            ></div>
            <span
              className={`text-[10px] ${
                isHighest
                  ? "font-bold text-on-surface"
                  : "text-outline"
              } text-center truncate w-full`}
            >
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
