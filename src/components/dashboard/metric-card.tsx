"use client";

import { Icon } from "@/lib/icon-map";

interface Props {
  icon: string;
  label: string;
  value: string;
  isHighlighted?: boolean;
}

export default function MetricCard({
  icon,
  label,
  value,
  isHighlighted,
}: Props) {
  return (
    <div
      className={`p-4 rounded-xl flex flex-col justify-between h-[120px] ${
        isHighlighted
          ? "bg-secondary-container text-on-secondary-container"
          : "bg-surface-container-lowest border border-border-standard text-on-surface"
      }`}
    >
      <div className={`flex items-center gap-2 ${isHighlighted ? "opacity-90" : ""}`}>
        <Icon name={icon} size={20} />
        <span className="text-label-md font-medium">{label}</span>
      </div>
      <div className="text-numeric-display font-bold">{value}</div>
    </div>
  );
}
