import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { formatCurrency } from "./formatters";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const COLLECTIONS = [
  "products",
  "transactions",
  "customers",
  "debt_payments",
] as const;

// ── Excel ──

export async function exportToExcel(): Promise<void> {
  const wb = XLSX.utils.book_new();

  for (const name of COLLECTIONS) {
    const snap = await getDocs(collection(db, name));
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `warung-resoyudan-data-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── PDF ──

interface PDFReportData {
  periodLabel: string;
  totalSales: number;
  totalProfit: number;
  totalCash: number;
  totalKasbon: number;
  transactionCount: number;
  topProducts: { name: string; qty: number; revenue: number }[];
}

export async function exportToPDF(data: PDFReportData): Promise<void> {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(18);
  doc.text("Warung Resoyudan", pageW / 2, 20, { align: "center" });
  doc.setFontSize(11);
  doc.text(`Laporan ${data.periodLabel}`, pageW / 2, 28, { align: "center" });
  doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, pageW / 2, 35, { align: "center" });

  // Summary
  doc.setFontSize(12);
  doc.text("Ringkasan", 14, 48);
  doc.setFontSize(10);

  const summaryRows = [
    ["Total Penjualan", formatCurrency(data.totalSales)],
    ["Laba Bersih", formatCurrency(data.totalProfit)],
    ["Tunai", formatCurrency(data.totalCash)],
    ["Kasbon", formatCurrency(data.totalKasbon)],
    ["Jumlah Transaksi", String(data.transactionCount)],
  ];

  autoTable(doc, {
    startY: 52,
    head: [["Metrik", "Nilai"]],
    body: summaryRows,
    theme: "striped",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [0, 81, 213] },
  });

  // Top Products
  if (data.topProducts.length > 0) {
    const y = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(12);
    doc.text("Produk Terlaris", 14, y);

    const productRows = data.topProducts.map((p) => [
      p.name,
      `${p.qty} Unit`,
      formatCurrency(p.revenue),
    ]);

    autoTable(doc, {
      startY: y + 4,
      head: [["Produk", "Terjual", "Pendapatan"]],
      body: productRows,
      theme: "striped",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 81, 213] },
    });
  }

  // Footer
  const finalY = (doc as any).lastAutoTable?.finalY ?? 280;
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("Dibuat oleh Warung Resoyudan — Catat. Kelola. Tumbuh.", pageW / 2, finalY + 16, { align: "center" });

  doc.save(`laporan-${new Date().toISOString().slice(0, 10)}.pdf`);
}
