"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "default",
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white rounded-xl max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="text-headline-md font-bold">{title}</DialogTitle>
          <DialogDescription className="text-body-md text-on-surface-variant mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 border border-border-standard rounded-xl font-bold text-on-surface-variant active:bg-surface-container transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={`flex-1 h-12 rounded-xl font-bold active:scale-[0.98] transition-transform ${
              variant === "danger"
                ? "bg-danger-alert text-white"
                : "bg-secondary text-on-secondary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
