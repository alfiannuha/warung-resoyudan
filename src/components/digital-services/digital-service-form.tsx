"use client";

import { useState } from "react";
import type { DigitalServiceTransaction } from "@/types";
import {
  DIGITAL_SERVICES,
  DIGITAL_SERVICE_PAYMENTS,
  getServiceConfig,
} from "@/lib/digital-services";
import { formatCurrency } from "@/lib/formatters";
import { Icon } from "@/lib/icon-map";
import CurrencyInput from "@/components/shared/currency-input";

export interface DigitalServiceFormValues {
  serviceType: string;
  customerIdentifier: string;
  subService: string | null;
  tokenCode: string | null;
  customerName: string | null;
  nominalAmount: number;
  serviceFee: number;
  paymentMethod: "cash" | "qris";
  transactionDate: string;
  notes: string | null;
}

/** Internal form state — optional text fields are strings while editing. */
type FormFields = Pick<
  DigitalServiceFormValues,
  | "customerIdentifier"
  | "tokenCode"
  | "customerName"
  | "nominalAmount"
  | "serviceFee"
  | "notes"
> & {
  tokenCode: string;
  customerName: string;
  notes: string;
};

interface Props {
  initial?: DigitalServiceTransaction | null;
  onSubmit: (values: DigitalServiceFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
}

const EMPTY_FIELDS: FormFields = {
  customerIdentifier: "",
  tokenCode: "",
  customerName: "",
  nominalAmount: 0,
  serviceFee: 0,
  notes: "",
};

const inputClass =
  "h-12 w-full rounded-md border border-border-standard bg-card px-4 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15";

/**
 * Reusable digital-service transaction form. Handles both new transactions
 * (service preselected via prop) and edits (populated from an existing record).
 */
export default function DigitalServiceForm({
  initial = null,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel,
}: Props) {
  const [serviceType, setServiceType] = useState(initial?.serviceType ?? "");
  const [subService, setSubService] = useState<string | null>(
    initial?.subService ?? null,
  );
  const [fields, setFields] = useState(() =>
    initial
      ? {
          customerIdentifier: initial.customerIdentifier ?? "",
          tokenCode: initial.tokenCode ?? "",
          customerName: initial.customerName ?? "",
          nominalAmount: initial.nominalAmount,
          serviceFee: initial.serviceFee,
          notes: initial.notes ?? "",
        }
      : EMPTY_FIELDS,
  );
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris">(
    initial?.paymentMethod ?? "cash",
  );
  const [transactionDate, setTransactionDate] = useState(
    initial?.transactionDate ?? new Date().toISOString().slice(0, 10),
  );

  const service = serviceType ? getServiceConfig(serviceType) : null;
  const total = fields.nominalAmount + fields.serviceFee;

  const handleServiceSelect = (id: string) => {
    setServiceType(id);
    // A sub-option (game) choice is scoped to a service — reset it and
    // re-apply the default fee when switching.
    setSubService(null);
    setFields((f) => ({
      ...f,
      serviceFee: f.serviceFee > 0 ? f.serviceFee : getServiceConfig(id).defaultFee,
    }));
  };

  const handleSubmit = () => {
    if (!serviceType || !fields.customerIdentifier.trim() || !(fields.nominalAmount > 0)) {
      return;
    }
    const requiresSub = (getServiceConfig(serviceType).options?.length ?? 0) > 0;
    if (requiresSub && !subService) {
      return;
    }
    const isTokenService = !!getServiceConfig(serviceType).tokenLabel;
    if (isTokenService && !fields.tokenCode.trim()) {
      return;
    }
    onSubmit({
      serviceType,
      customerIdentifier: fields.customerIdentifier.trim(),
      subService,
      tokenCode: fields.tokenCode.trim() || null,
      customerName: fields.customerName.trim() || null,
      nominalAmount: fields.nominalAmount,
      serviceFee: fields.serviceFee,
      paymentMethod,
      transactionDate,
      notes: fields.notes.trim() || null,
    });
  };

  return (
    <div className="space-y-4">
      {/* Service selector — hidden in edit mode (service type immutable). */}
      {!initial && (
        <div>
          <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
            Jenis Layanan <span className="text-danger">*</span>
          </label>
          <ServiceTypePicker selected={serviceType} onSelect={handleServiceSelect} />
        </div>
      )}

      {service && service.options && service.options.length > 0 && (
        <div>
          <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
            {service.optionsLabel ?? "Pilih Opsi"} <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {service.options.map((opt) => {
              const isActive = subService === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSubService(opt.id)}
                  className={`flex h-12 items-center gap-2 rounded-md border px-3 font-medium transition-all active:scale-[0.98] ${
                    isActive
                      ? "border-secondary bg-secondary/5 text-secondary"
                      : "border-border-standard bg-card text-on-surface-variant"
                  }`}
                >
                  <Icon name={opt.icon} size={16} />
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {service && (
        <>
          {/* Customer identifier */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              {service.identifierLabel} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              inputMode={service.identifierInputMode ?? "text"}
              value={fields.customerIdentifier}
              onChange={(e) =>
                setFields((f) => ({ ...f, customerIdentifier: e.target.value }))
              }
              placeholder={service.identifierPlaceholder}
              className={inputClass}
            />
          </div>

          {/* Token code — large, emphasized input for PLN prepaid */}
          {service.tokenLabel && (
            <div>
              <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
                {service.tokenLabel} <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                inputMode="text"
                value={fields.tokenCode}
                onChange={(e) =>
                  setFields((f) => ({ ...f, tokenCode: e.target.value }))
                }
                placeholder="Contoh: 1234-5678-9012-3456"
                className="h-16 w-full rounded-md border-2 border-secondary bg-card px-4 text-center text-xl font-bold tracking-[0.2em] text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 placeholder:tracking-normal focus:ring-4 focus:ring-secondary/20"
              />
              <p className="mt-1.5 text-caption text-on-surface-variant">
                Masukkan kode token PLN yang ditampilkan setelah pembayaran.
              </p>
            </div>
          )}

          {/* Customer name */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              Nama Pelanggan{" "}
              <span className="font-normal text-on-surface-variant/60">(opsional)</span>
            </label>
            <input
              type="text"
              value={fields.customerName}
              onChange={(e) => setFields((f) => ({ ...f, customerName: e.target.value }))}
              placeholder="Nama pemilik akun"
              className={inputClass}
            />
          </div>

          {/* Nominal */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              Nominal <span className="text-danger">*</span>
            </label>
            <CurrencyInput
              value={fields.nominalAmount}
              onChange={(v) => setFields((f) => ({ ...f, nominalAmount: v }))}
              placeholder="0"
            />
          </div>

          {/* Service fee */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              Biaya Layanan <span className="text-on-surface-variant/60">(opsional)</span>
            </label>
            <CurrencyInput
              value={fields.serviceFee}
              onChange={(v) => setFields((f) => ({ ...f, serviceFee: v }))}
              placeholder="0"
            />
            {fields.serviceFee === 0 && service.defaultFee > 0 && (
              <p className="mt-1 text-caption text-on-surface-variant">
                Disarankan: {formatCurrency(service.defaultFee)}
              </p>
            )}
          </div>

          {/* Payment method */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DIGITAL_SERVICE_PAYMENTS.map((pm) => {
                const isActive = paymentMethod === pm.value;
                return (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setPaymentMethod(pm.value)}
                    className={`flex h-12 items-center justify-center gap-1.5 rounded-md border font-semibold transition-all active:scale-[0.98] ${
                      isActive
                        ? "border-secondary bg-secondary/5 text-secondary"
                        : "border-border-standard bg-card text-on-surface-variant"
                    }`}
                  >
                    <Icon name={pm.icon} size={18} />
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              Tanggal
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
              Catatan <span className="text-on-surface-variant/60">(opsional)</span>
            </label>
            <textarea
              value={fields.notes}
              onChange={(e) => setFields((f) => ({ ...f, notes: e.target.value }))}
              className="w-full resize-none rounded-md border border-border-standard bg-card px-4 py-3 text-base outline-none transition-all focus:border-secondary focus:ring-4 focus:ring-secondary/15"
              rows={2}
              placeholder="Catatan transaksi..."
            />
          </div>

          {/* Total */}
          <div className="rounded-md bg-surface-container p-4">
            <div className="flex items-center justify-between">
              <span className="text-label-md text-on-surface-variant">Total</span>
              <span className="text-headline-md font-extrabold text-secondary">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="h-12 flex-1 rounded-md border border-border-standard bg-card font-semibold text-on-surface-variant transition-colors active:bg-surface-container"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                submitting ||
                !serviceType ||
                !fields.customerIdentifier.trim() ||
                !(fields.nominalAmount > 0) ||
                ((service.options?.length ?? 0) > 0 && !subService) ||
                (!!service.tokenLabel && !fields.tokenCode.trim())
              }
              className="h-12 flex-1 rounded-md bg-secondary font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {submitting
                ? "Menyimpan..."
                : submitLabel ?? (initial ? "Simpan Perubahan" : "Simpan Transaksi")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** Compact service type picker used inside the new-transaction form. */
function ServiceTypePicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {DIGITAL_SERVICES.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelect(s.id)}
          className={`flex h-12 items-center gap-2 rounded-md border px-3 font-medium transition-all active:scale-[0.98] ${
            selected === s.id
              ? "border-secondary bg-secondary/5 text-secondary"
              : "border-border-standard bg-card text-on-surface-variant"
          }`}
        >
          <Icon name={s.icon} size={16} />
          <span className="truncate">{s.label}</span>
        </button>
      ))}
    </div>
  );
}
