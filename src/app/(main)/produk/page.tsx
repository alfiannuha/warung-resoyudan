"use client";

import { useState, useMemo } from "react";
import { Icon } from "@/lib/icon-map";
import { formatCurrency } from "@/lib/formatters";
import { lookupBarcode } from "@/lib/barcode-lookup";
import { useProductStore } from "@/stores/use-product-store";
import { useShallow } from "zustand/react/shallow";
import StockBadge from "@/components/produk/stock-badge";
import ProductForm from "@/components/produk/product-form";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import ScannerDialog from "@/components/shared/scanner-dialog";
import { useToast } from "@/components/shared/toast-provider";

export default function ProdukPage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [scannedName, setScannedName] = useState<string>("");
  const [scannedCategory, setScannedCategory] = useState<string>("");

  const { products, quickAddStock, deleteProduct } = useProductStore(
    useShallow((s) => ({
      products: s.products,
      quickAddStock: s.quickAddStock,
      deleteProduct: s.deleteProduct,
    }))
  );
  const { toast } = useToast();

  const allActive = products.filter((p) => p.isActive);
  const lowStockCount = allActive.filter((p) => p.stock <= p.minStock).length;
  const totalStockValue = allActive.reduce((s, p) => s + p.buyPrice * p.stock, 0);

  const filtered = useMemo(
    () =>
      search.trim()
        ? allActive.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase())
          )
        : allActive,
    [allActive, search]
  );

  const handleEdit = (id: string) => {
    setEditId(id);
    setFormOpen(true);
    setMenuOpenId(null);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setMenuOpenId(null);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteProduct(deleteId);
      setDeleteId(null);
      toast("Produk berhasil dihapus.");
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditId(null);
    setScannedBarcode(null);
    setScannedName("");
    setScannedCategory("");
  };

  const handleManualAdd = () => {
    setSpeedDialOpen(false);
    setEditId(null);
    setScannedBarcode(null);
    setScannedName("");
    setScannedCategory("");
    setFormOpen(true);
  };

  const handleScanProduct = () => {
    setSpeedDialOpen(false);
    setScannerOpen(true);
  };

  const handleScanResult = async (barcode: string) => {
    // Check duplicate
    const existing = useProductStore.getState().findProductByBarcode(barcode);
    if (existing) {
      toast(`Barcode sudah digunakan oleh produk "${existing.name}".`, "error");
      return;
    }

    // Try to look up product details from barcode database
    setScannedBarcode(barcode);

    let name = "";
    let category = "Makanan";
    try {
      const result = await lookupBarcode(barcode);
      if (result) {
        name = result.name;
        category = result.category;
      }
    } catch {
      // Lookup failed, leave name empty for manual input
    }

    setScannedName(name);
    setScannedCategory(category);
    setScannerOpen(false);
    setEditId(null);
    setFormOpen(true);
  };

  return (
    <div className="pb-4 space-y-6">
      {/* Mobile: search */}
      <div className="relative md:hidden">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-10 pr-4 bg-white border border-border-standard rounded-lg focus:border-secondary outline-none text-body-md transition-all"
          placeholder="Cari nama produk..."
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-border-standard">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="inventory_2" size={20} className="text-secondary" />
            <span className="text-label-md text-on-surface-variant font-medium">Total Produk</span>
          </div>
          <span className="text-[28px] font-bold text-primary">{allActive.length}</span>
          <p className="text-body-md text-success-paid flex items-center gap-1 mt-1">
            <Icon name="trending_up" size={16} /> {allActive.length} produk
          </p>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-border-standard">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="warning" size={20} className="text-warning-debt" />
            <span className="text-label-md text-on-surface-variant font-medium">Stok Menipis</span>
          </div>
          <span className="text-[28px] font-bold text-primary">{lowStockCount} <span className="text-lg">Item</span></span>
          <button className="mt-2 text-secondary text-label-md flex items-center gap-1 hover:underline">
            Lihat Daftar <Icon name="chevron_right" size={16} />
          </button>
        </div>
        <div className="bg-secondary p-5 rounded-xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-on-secondary/80">
            <Icon name="receipt" size={20} />
            <span className="text-label-md">Nilai Stok</span>
          </div>
          <span className="text-[28px] font-bold text-on-secondary">{formatCurrency(totalStockValue)}</span>
          <p className="mt-2 text-on-secondary/80 text-label-md">Total nilai inventaris</p>
          <div className="absolute -right-4 -bottom-4 opacity-20">
            <Icon name="package" size={120} />
          </div>
        </div>
      </div>

      {/* Tablet: Header with Search + Add */}
      <div className="hidden md:flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-border-standard rounded-full text-body-md focus:border-secondary outline-none transition-all"
            placeholder="Cari nama produk atau SKU..."
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleScanProduct}
            className="px-6 h-10 rounded-full border border-border-standard flex items-center gap-2 text-on-surface font-label-md hover:bg-surface-container active:scale-95 transition-all"
          >
            <Icon name="qr_code_scanner" size={20} />
            Scan Produk
          </button>
          <button
            onClick={() => { setEditId(null); setFormOpen(true); }}
            className="bg-secondary text-on-secondary px-6 h-10 rounded-full flex items-center gap-2 font-label-md hover:brightness-110 active:scale-95 transition-all"
          >
            <Icon name="add" size={20} />
            Tambah Produk
          </button>
        </div>
      </div>

      {/* Product Table (tablet) */}
      <div className="hidden md:block bg-surface-container-lowest rounded-xl border border-border-standard overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low border-b border-border-standard">
            <tr>
              <th className="px-6 py-4 text-label-md text-on-surface-variant">Info Produk</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant text-center">Harga Beli</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant text-center">Harga Jual</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant text-center">Stok</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-standard">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant/50">
                  <Icon name="inventory_2" size={48} className="mx-auto mb-2" />
                  <p>Tidak ada produk</p>
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr key={product.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                        <Icon name="package" size={24} className="text-outline opacity-40" />
                      </div>
                      <div>
                        <div className="text-body-lg font-bold text-primary">{product.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-label-md text-[12px] uppercase text-on-surface-variant bg-surface-container-high px-1.5 rounded">{product.category}</span>
                          {product.barcode && <span className="text-[11px] text-outline">• {product.barcode}</span>}
                          <StockBadge stock={product.stock} minStock={product.minStock} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-numeric-display text-on-surface-variant">{formatCurrency(product.buyPrice)}</td>
                  <td className="px-6 py-4 text-center font-numeric-display text-primary">{formatCurrency(product.sellPrice)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-numeric-display ${product.stock <= product.minStock ? "text-danger-alert" : "text-primary"}`}>
                      {product.stock} <span className="text-[14px] text-on-surface-variant font-normal">pcs</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 relative">
                      <button
                        onClick={() => quickAddStock(product.id, 1)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-border-standard hover:bg-surface-container-high active:scale-95 transition-all text-secondary"
                      >
                        <Icon name="add" size={16} />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === product.id ? null : product.id)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <Icon name="more_vert" size={18} />
                        </button>
                        {menuOpenId === product.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                            <div className="absolute right-0 top-full mt-1 bg-white border border-border-standard rounded-xl shadow-lg z-20 w-36 py-1">
                              <button
                                onClick={() => handleEdit(product.id)}
                                className="w-full px-4 py-2.5 text-left text-body-md hover:bg-surface-container flex items-center gap-2"
                              >
                                <Icon name="edit" size={16} />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="w-full px-4 py-2.5 text-left text-body-md hover:bg-surface-container flex items-center gap-2 text-danger-alert"
                              >
                                <Icon name="delete" size={16} />
                                Hapus
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: product rows */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant/50">
            <Icon name="inventory_2" size={48} className="block mb-2 mx-auto" />
            <p>Tidak ada produk</p>
          </div>
        ) : (
          filtered.map((product) => (
            <div key={product.id} className="bg-white border border-border-standard rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <span className="text-label-xl font-bold">{product.name}</span>
                  <span className="block text-[12px] text-outline">{product.category}</span>
                  {product.barcode && <span className="text-[11px] text-outline">• {product.barcode}</span>}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <StockBadge stock={product.stock} minStock={product.minStock} />
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === product.id ? null : product.id)}
                      className="w-8 h-8 flex items-center justify-center"
                    >
                      <Icon name="more_vert" size={16} className="text-outline" />
                    </button>
                    {menuOpenId === product.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                        <div className="absolute right-0 top-full mt-1 bg-white border border-border-standard rounded-xl shadow-lg z-20 w-32 py-1">
                          <button
                            onClick={() => handleEdit(product.id)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-surface-container flex items-center gap-2"
                          >
                            <Icon name="edit" size={14} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-surface-container flex items-center gap-2 text-danger-alert"
                          >
                            <Icon name="delete" size={14} /> Hapus
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 border-y border-border-standard/50">
                <div>
                  <span className="text-[12px] text-outline">Beli</span>
                  <span className="block font-bold text-on-surface-variant">{formatCurrency(product.buyPrice)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[12px] text-outline">Jual</span>
                  <span className="block font-bold text-secondary">{formatCurrency(product.sellPrice)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className={`font-numeric-display font-bold ${product.stock <= product.minStock ? "text-danger-alert" : "text-primary"}`}>
                  {product.stock} <span className="text-[14px] text-outline font-normal">pcs</span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => quickAddStock(product.id, 1)}
                    className="touch-target w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center active:opacity-80 transition-opacity"
                  >
                    <Icon name="add" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile: FAB Speed Dial */}
      <div className="md:hidden fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
        {/* Speed dial options */}
        {speedDialOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setSpeedDialOpen(false)} />
            <div className="relative z-30 flex flex-col items-end gap-3">
              <button
                onClick={handleScanProduct}
                className="flex items-center gap-2 bg-white border border-border-standard shadow-lg rounded-xl px-4 py-3 text-body-md font-bold active:scale-95 transition-transform"
              >
                <Icon name="qr_code_scanner" size={20} className="text-secondary" />
                Scan Produk
              </button>
              <button
                onClick={handleManualAdd}
                className="flex items-center gap-2 bg-white border border-border-standard shadow-lg rounded-xl px-4 py-3 text-body-md font-bold active:scale-95 transition-transform"
              >
                <Icon name="edit" size={20} className="text-secondary" />
                Tambah Manual
              </button>
            </div>
          </>
        )}

        {/* FAB button */}
        <button
          onClick={() => setSpeedDialOpen(!speedDialOpen)}
          className={`relative z-30 w-14 h-14 bg-secondary text-on-secondary rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-transform ${
            speedDialOpen ? "rotate-45" : ""
          }`}
          aria-label="Tambah produk"
        >
          <Icon name="add" size={32} />
        </button>
      </div>

      {/* Scanner Dialog */}
      <ScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScanResult}
        mode="product"
      />

      {/* Product Form */}
      <ProductForm
        open={formOpen}
        onOpenChange={handleFormClose}
        editId={editId || undefined}
        initialBarcode={scannedBarcode || undefined}
        initialName={scannedName || undefined}
        initialCategory={scannedCategory || undefined}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Hapus Produk"
        description="Apakah yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        variant="danger"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
