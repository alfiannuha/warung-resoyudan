import type { DigitalServicePayment } from "@/types";

/**
 * A selectable sub-option within a service (e.g. the specific game for a
 * "Game Top Up" transaction). Extending this is pure configuration.
 */
export interface DigitalServiceOption {
  id: string;
  label: string;
  icon: string;
}

/**
 * Digital Services catalog.
 *
 * The service list is a pure configuration array — adding a new service
 * (game voucher, ticketing, insurance, ...) only requires appending an
 * entry here (plus optionally a matching icon in icon-map.tsx). No core
 * logic changes are needed.
 */
export interface DigitalServiceConfig {
  id: string;
  label: string;
  icon: string;
  /** Placeholder shown for the customer identifier field. */
  identifierLabel: string;
  identifierPlaceholder: string;
  /** Identifier kind used on the printed receipt (e.g. "No. Pelanggan"). */
  identifierReceiptLabel: string;
  /** Input type hint for the identifier field. */
  identifierInputMode?: "text" | "numeric" | "tel";
  /** Default service fee charged when the field is left blank. */
  defaultFee: number;
  /**
   * Optional sub-options the user picks from before entering the rest of
   * the form (e.g. specific games for game top-up). When present, the form
   * renders an extra selector and stores the choice in `subService`.
   */
  options?: DigitalServiceOption[];
  /** Label for the sub-option selector, when `options` is present. */
  optionsLabel?: string;
}

export const DIGITAL_SERVICES: DigitalServiceConfig[] = [
  {
    id: "bpjs",
    label: "BPJS",
    icon: "health",
    identifierLabel: "No. Peserta BPJS",
    identifierPlaceholder: "0001234567890",
    identifierReceiptLabel: "No. Peserta",
    identifierInputMode: "numeric",
    defaultFee: 2000,
  },
  {
    id: "pdam",
    label: "PDAM",
    icon: "water_drop",
    identifierLabel: "No. Pelanggan PDAM",
    identifierPlaceholder: "Contoh: 1234567890",
    identifierReceiptLabel: "No. Pelanggan",
    identifierInputMode: "numeric",
    defaultFee: 2000,
  },
  {
    id: "internet",
    label: "Internet",
    icon: "wifi",
    identifierLabel: "No. Pelanggan",
    identifierPlaceholder: "Nomor ID pelanggan internet",
    identifierReceiptLabel: "No. Pelanggan",
    identifierInputMode: "numeric",
    defaultFee: 2000,
  },
  {
    id: "cable_tv",
    label: "TV Kabel",
    icon: "tv",
    identifierLabel: "No. Pelanggan TV",
    identifierPlaceholder: "Nomor ID pelanggan TV kabel",
    identifierReceiptLabel: "No. Pelanggan",
    identifierInputMode: "numeric",
    defaultFee: 2000,
  },
  {
    id: "pln_prepaid",
    label: "Token PLN",
    icon: "zap",
    identifierLabel: "No. Meter / ID Pelanggan",
    identifierPlaceholder: "Contoh: 123456789012",
    identifierReceiptLabel: "No. Meter",
    identifierInputMode: "numeric",
    defaultFee: 2000,
  },
  {
    id: "pln_postpaid",
    label: "Listrik PLN",
    icon: "zap",
    identifierLabel: "No. Meter / ID Pelanggan",
    identifierPlaceholder: "Contoh: 123456789012",
    identifierReceiptLabel: "No. Meter",
    identifierInputMode: "numeric",
    defaultFee: 2000,
  },
  {
    id: "pulsa",
    label: "Pulsa",
    icon: "smartphone",
    identifierLabel: "No. HP",
    identifierPlaceholder: "Contoh: 081234567890",
    identifierReceiptLabel: "No. HP",
    identifierInputMode: "tel",
    defaultFee: 1500,
  },
  {
    id: "data",
    label: "Paket Data",
    icon: "data",
    identifierLabel: "No. HP",
    identifierPlaceholder: "Contoh: 081234567890",
    identifierReceiptLabel: "No. HP",
    identifierInputMode: "tel",
    defaultFee: 1500,
  },
  {
    id: "ewallet",
    label: "E-Wallet",
    icon: "account_balance_wallet",
    identifierLabel: "No. HP / Akun",
    identifierPlaceholder: "Contoh: 081234567890",
    identifierReceiptLabel: "No. Akun",
    identifierInputMode: "tel",
    defaultFee: 1500,
  },
  {
    id: "transfer",
    label: "Transfer Uang",
    icon: "swap",
    identifierLabel: "No. Rekening / No. HP",
    identifierPlaceholder: "Tujuan transfer",
    identifierReceiptLabel: "No. Tujuan",
    identifierInputMode: "tel",
    defaultFee: 2500,
  },
  {
    id: "game_topup",
    label: "Top Up Game",
    icon: "gamepad",
    identifierLabel: "User ID / Player ID",
    identifierPlaceholder: "Contoh: 123456789",
    identifierReceiptLabel: "User ID",
    identifierInputMode: "numeric",
    defaultFee: 2000,
    optionsLabel: "Pilih Game",
    options: [
      { id: "free_fire", label: "Free Fire", icon: "flame" },
      { id: "mobile_legends", label: "Mobile Legends", icon: "swords" },
      { id: "pubg_mobile", label: "PUBG Mobile", icon: "crosshair" },
      { id: "genshin_impact", label: "Genshin Impact", icon: "sparkles" },
      { id: "cod_mobile", label: "COD Mobile", icon: "crosshair" },
      { id: "honor_of_kings", label: "Honor of Kings", icon: "crown" },
      { id: "roblox", label: "Roblox", icon: "dices" },
      { id: "steam", label: "Steam Wallet", icon: "gamepad" },
      { id: "point_blank", label: "Point Blank", icon: "target" },
      { id: "valorant", label: "Valorant", icon: "target" },
      { id: "domino_higgs", label: "Higgs Domino", icon: "clover" },
      { id: "epep", label: "E-PEP", icon: "shield" },
    ],
  },
];

const SERVICE_BY_ID = new Map(DIGITAL_SERVICES.map((s) => [s.id, s]));

export function getServiceConfig(serviceType: string): DigitalServiceConfig {
  return (
    SERVICE_BY_ID.get(serviceType) ?? {
      id: serviceType,
      label: serviceType,
      icon: "receipt_long",
      identifierLabel: "No. Pelanggan",
      identifierPlaceholder: "Nomor pelanggan",
      identifierReceiptLabel: "No. Pelanggan",
      identifierInputMode: "text",
      defaultFee: 0,
    }
  );
}

/** Resolves a sub-option label from a service config (e.g. a game name). */
export function getSubServiceLabel(
  serviceType: string,
  subServiceId: string | null | undefined,
): string | null {
  if (!subServiceId) return null;
  const cfg = getServiceConfig(serviceType);
  const opt = cfg.options?.find((o) => o.id === subServiceId);
  return opt?.label ?? subServiceId;
}

/** All payment options offered on a digital service transaction. */
export const DIGITAL_SERVICE_PAYMENTS: {
  value: DigitalServicePayment;
  label: string;
  icon: string;
}[] = [
  { value: "cash", label: "Tunai", icon: "payments" },
  { value: "qris", label: "QRIS", icon: "qr_code_2" },
];
