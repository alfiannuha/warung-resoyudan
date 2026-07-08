"use client";

interface Props {
  quantity: number;
  maxStock?: number;
  onDecrement: () => void;
  onIncrement: () => void;
}

export default function QuantityControl({
  quantity,
  maxStock,
  onDecrement,
  onIncrement,
}: Props) {
  return (
    <div className="flex items-center gap-3 bg-surface-container rounded-lg p-1">
      <button
        onClick={onDecrement}
        disabled={quantity <= 1}
        className="touch-target w-8 h-8 flex items-center justify-center rounded-md bg-white border border-border-standard shadow-sm disabled:opacity-40 transition-opacity"
        aria-label="Kurangi jumlah"
      >
        <span className="text-[18px] font-bold leading-none">−</span>
      </button>
      <span className="font-bold min-w-[20px] text-center text-sm">
        {quantity}
      </span>
      <button
        onClick={onIncrement}
        disabled={maxStock !== undefined && quantity >= maxStock}
        className="touch-target w-8 h-8 flex items-center justify-center rounded-md bg-white border border-border-standard shadow-sm disabled:opacity-40 transition-opacity"
        aria-label="Tambah jumlah"
      >
        <span className="text-[18px] font-bold leading-none">+</span>
      </button>
    </div>
  );
}
