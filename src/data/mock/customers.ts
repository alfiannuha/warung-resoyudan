import type { Customer } from "@/types";
import { generateId } from "@/lib/formatters";

const now = "2026-07-08T06:00:00.000Z";

export const mockCustomers: Customer[] = [
  {
    id: generateId(),
    name: "Pak Budi (RT 02)",
    phone: "081234567890",
    currentDebt: 125000,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: generateId(),
    name: "Ibu Ani",
    phone: "081234567891",
    currentDebt: 45500,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: generateId(),
    name: "Mbak Sri",
    phone: "081234567892",
    currentDebt: 79500,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: generateId(),
    name: "Pak Haji Murod",
    phone: "081234567893",
    currentDebt: 450000,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: generateId(),
    name: "Mas Wahyu",
    phone: "081234567894",
    currentDebt: 880000,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: generateId(),
    name: "Bu Eni",
    phone: "081234567895",
    currentDebt: 0,
    createdAt: now,
    updatedAt: now,
  },
];
