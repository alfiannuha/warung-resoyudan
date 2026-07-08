"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProductStore } from "@/stores/use-product-store";
import { PRODUCT_CATEGORIES } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string;
  initialBarcode?: string;
}

export default function ProductForm({ open, onOpenChange, editId, initialBarcode }: Props) {
  const { products, addProduct, updateProduct } = useProductStore();
  const existing = editId ? products.find((p) => p.id === editId) : null;

  const [category, setCategory] = useState(existing?.category || "Makanan");
  const [name, setName] = useState(existing?.name || "");
  const [barcode, setBarcode] = useState(existing?.barcode || initialBarcode || "");
  const [buyPrice, setBuyPrice] = useState(String(existing?.buyPrice || ""));
  const [sellPrice, setSellPrice] = useState(String(existing?.sellPrice || ""));
  const [stock, setStock] = useState(String(existing?.stock || ""));
  const [minStock, setMinStock] = useState(String(existing?.minStock || "0"));

  // Sync initialBarcode when dialog opens from scan
  useEffect(() => {
    if (open && initialBarcode && !editId) {
      setBarcode(initialBarcode);
    }
  }, [open, initialBarcode, editId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      category,
      barcode: barcode.trim() || null,
      buyPrice: Number(buyPrice),
      sellPrice: Number(sellPrice),
      stock: Number(stock),
      minStock: Number(minStock),
      isActive: true,
    };

    if (editId && existing) {
      updateProduct(editId, data);
    } else {
      addProduct(data);
    }

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setCategory("Makanan");
    setBarcode("");
    setBuyPrice("");
    setSellPrice("");
    setStock("");
    setMinStock("0");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white rounded-xl max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-headline-md font-bold">
            {editId ? "Edit Produk" : "Tambah Produk"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-label-md text-on-surface-variant block mb-1">
              Nama Produk <span className="text-danger-alert">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
              placeholder="Nama produk"
              required
            />
          </div>
          <div>
            <label className="text-label-md text-on-surface-variant block mb-1">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-label-md text-on-surface-variant block mb-1">Barcode</label>
            <input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
              placeholder="Kosongkan jika tidak ada barcode"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Harga Beli <span className="text-danger-alert">*</span>
              </label>
              <input
                type="number"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
                placeholder="0"
                required
                min="0"
              />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Harga Jual <span className="text-danger-alert">*</span>
              </label>
              <input
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
                placeholder="0"
                required
                min="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Stok Awal <span className="text-danger-alert">*</span>
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
                placeholder="0"
                required
                min="0"
              />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant block mb-1">
                Minimum Stok
              </label>
              <input
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full h-12 px-4 border border-border-standard rounded-xl focus:border-secondary outline-none bg-surface transition-all"
                placeholder="0"
                min="0"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full h-touch-target-min bg-secondary text-on-secondary rounded-xl font-bold text-body-lg active:scale-[0.98] transition-transform"
          >
            Simpan
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
