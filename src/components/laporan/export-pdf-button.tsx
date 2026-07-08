"use client";

import { Icon } from "@/lib/icon-map";

interface Props {
  totalSales: number;
  totalProfit: number;
  totalCash: number;
  totalKasbon: number;
  transactionCount: number;
}

export default function ExportPdfButton({
  totalSales,
  totalProfit,
  totalCash,
  totalKasbon,
  transactionCount,
}: Props) {
  const handleExportPdf = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan Usaha Warung Resoyudan", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Tanggal: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
      pageWidth / 2,
      28,
      { align: "center" }
    );

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan Usaha", 14, 40);

    autoTable(doc, {
      startY: 45,
      head: [["Metrik", "Nilai"]],
      body: [
        ["Total Omzet", formatCurrency(totalSales)],
        ["Total Profit", formatCurrency(totalProfit)],
        ["Kas Masuk", formatCurrency(totalCash)],
        ["Piutang Kasbon", formatCurrency(totalKasbon)],
        ["Jumlah Transaksi", `${transactionCount} transaksi`],
      ],
      theme: "striped",
      headStyles: { fillColor: [0, 81, 213] },
      styles: { fontSize: 10 },
    });

    doc.save(`laporan-warung-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <button
      onClick={handleExportPdf}
      className="w-full h-touch-target-min bg-primary text-on-primary rounded-xl text-label-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
    >
      <Icon name="picture_as_pdf" />
      Export Laporan PDF
    </button>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
