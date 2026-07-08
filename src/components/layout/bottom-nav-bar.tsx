"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { Icon } from "@/lib/icon-map";

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface border-t border-border-standard flex justify-around items-center h-[64px] px-2 pb-safe">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" || pathname === "/cart" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center transition-opacity active:opacity-80 px-4 py-1 rounded-lg ${
              isActive
                ? "text-secondary font-bold"
                : "text-on-surface-variant"
            }`}
          >
            <Icon name={item.icon} size={24} />
            <span className="text-label-md font-label-md">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
