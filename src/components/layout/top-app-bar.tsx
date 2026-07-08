"use client";

import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/use-ui-store";
import { APP_NAME } from "@/lib/constants";
import { Icon } from "@/lib/icon-map";

const pageTitles: Record<string, string> = {
  "/": "Warung Resoyudan",
  "/dashboard": "Dashboard",
  "/produk": "Produk",
  "/kasbon": "Kasbon",
  "/laporan": "Laporan",
};

export default function TopAppBar() {
  const pathname = usePathname();
  const toggleSideNav = useUIStore((s) => s.toggleSideNav);
  const title = pageTitles[pathname] || APP_NAME;

  return (
    <header className="fixed top-0 w-full z-50 bg-surface border-b border-border-standard flex items-center justify-between px-gutter h-touch-target-min">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSideNav}
          className="text-primary touch-target active:scale-95 transition-transform flex items-center justify-center"
          aria-label="Buka menu navigasi"
        >
          <Icon name="menu" />
        </button>
        <h1 className="text-headline-md-mobile font-bold text-on-surface">
          {title}
        </h1>
      </div>
      <button
        className="text-primary touch-target active:scale-95 transition-transform flex items-center justify-center"
        aria-label="Profil"
      >
        <Icon name="account_circle" />
      </button>
    </header>
  );
}
