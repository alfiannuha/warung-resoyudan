"use client";

import { Icon } from "@/lib/icon-map";

interface Props {
  icon: string;
  message: string;
}

export default function EmptyState({ icon, message }: Props) {
  return (
    <div className="text-center py-12 text-on-surface-variant/50">
      <Icon name={icon} size={48} className="block mb-2 mx-auto" />
      <p>{message}</p>
    </div>
  );
}
