import type { DebtPayment } from "@/types";
import { generateId } from "@/lib/formatters";
import { mockCustomers } from "./customers";

function makeDate(daysAgo: number, hours: number): string {
  const d = new Date("2026-07-08T06:00:00.000Z");
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, 0, 0, 0);
  return d.toISOString();
}

const [pakBudi, ibuAni, mbakSri, pakHaji, masWahyu, buEni] = mockCustomers;

export const mockDebtPayments: DebtPayment[] = [
  {
    id: generateId(),
    customerId: buEni.id,
    amount: 45000,
    paymentDate: makeDate(0, 8),
    notes: "Pelunasan penuh",
  },
  {
    id: generateId(),
    customerId: pakBudi.id,
    amount: 50000,
    paymentDate: makeDate(5, 10),
    notes: "Bayar cicilan",
  },
  {
    id: generateId(),
    customerId: mbakSri.id,
    amount: 30000,
    paymentDate: makeDate(3, 14),
    notes: "Bayar sebagian",
  },
  {
    id: generateId(),
    customerId: ibuAni.id,
    amount: 25000,
    paymentDate: makeDate(7, 9),
    notes: "Cicilan mingguan",
  },
  {
    id: generateId(),
    customerId: pakBudi.id,
    amount: 75000,
    paymentDate: makeDate(12, 11),
    notes: "Pembayaran",
  },
  {
    id: generateId(),
    customerId: buEni.id,
    amount: 35000,
    paymentDate: makeDate(10, 16),
    notes: "Bayar hutang",
  },
];
