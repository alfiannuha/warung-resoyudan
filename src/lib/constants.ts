import type { PeriodFilter } from "@/types";

export const PERIOD_LABELS: Record<string, string> = {
  today: "Hari Ini",
  week: "Minggu Ini",
  month: "Bulan Ini",
  custom: "Custom",
};

export const PERIOD_OPTIONS: { label: string; value: PeriodFilter }[] = [
  { label: "Hari Ini", value: "today" },
  { label: "Minggu Ini", value: "week" },
  { label: "Bulan Ini", value: "month" },
  { label: "Custom", value: "custom" },
];

export const NAV_ITEMS = [
  { label: "Kasir", href: "/", icon: "point_of_sale" as const },
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" as const },
  { label: "Produk", href: "/produk", icon: "inventory_2" as const },
  { label: "Kasbon", href: "/kasbon", icon: "menu_book" as const },
  { label: "Laporan", href: "/laporan", icon: "assessment" as const },
  { label: "Pengaturan", href: "/settings", icon: "settings" as const },
];

export const APP_NAME = "Warung Resoyudan";
