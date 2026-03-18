"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { IntelItem } from "@/types/intel";

type ExportFormat = "csv" | "pdf" | "json";

interface ExportPanelProps {
  items: IntelItem[];
  hours: number;
}

function generateCSV(items: IntelItem[]): string {
  const header = "id,title,category,severity,source,publishedAt,countryCode,lat,lng";
  const rows = items.map((i) =>
    [
      i.id,
      `"${i.title.replace(/"/g, '""')}"`,
      i.category,
      i.severity,
      `"${i.source.replace(/"/g, '""')}"`,
      i.publishedAt,
      i.countryCode || "",
      i.lat ?? "",
      i.lng ?? "",
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportPanel({ items, hours }: ExportPanelProps) {
  const t = useTranslations("analytics");
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const handleExport = useCallback(async (format: ExportFormat) => {
    setExporting(format);
    const timestamp = new Date().toISOString().slice(0, 10);

    try {
      switch (format) {
        case "csv": {
          const csv = generateCSV(items);
          downloadBlob(csv, `worldscope-intel-${timestamp}.csv`, "text/csv");
          break;
        }
        case "json": {
          const json = JSON.stringify({ items, exportedAt: new Date().toISOString(), hours }, null, 2);
          downloadBlob(json, `worldscope-intel-${timestamp}.json`, "application/json");
          break;
        }
        case "pdf": {
          const { default: jsPDF } = await import("jspdf");
          const { default: autoTable } = await import("jspdf-autotable");

          const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

          // Title
          doc.setFontSize(16);
          doc.setTextColor(0, 229, 255);
          doc.text("WORLDSCOPE — Intelligence Report", 14, 15);

          doc.setFontSize(8);
          doc.setTextColor(90, 122, 154);
          doc.text(`Generated: ${new Date().toISOString()} | Range: ${hours}h | Events: ${items.length}`, 14, 22);

          // Summary stats
          const sevCounts: Record<string, number> = {};
          items.forEach((i) => { sevCounts[i.severity] = (sevCounts[i.severity] || 0) + 1; });

          doc.setFontSize(9);
          doc.setTextColor(200, 200, 200);
          let y = 30;
          doc.text(`Critical: ${sevCounts["critical"] || 0}  |  High: ${sevCounts["high"] || 0}  |  Medium: ${sevCounts["medium"] || 0}  |  Low: ${sevCounts["low"] || 0}  |  Info: ${sevCounts["info"] || 0}`, 14, y);
          y += 8;

          // Table
          autoTable(doc, {
            startY: y,
            head: [["Severity", "Category", "Title", "Source", "Time"]],
            body: items.slice(0, 100).map((i) => [
              i.severity.toUpperCase(),
              i.category,
              i.title.slice(0, 80),
              i.source,
              new Date(i.publishedAt).toLocaleString(),
            ]),
            styles: {
              fontSize: 7,
              cellPadding: 1.5,
              textColor: [200, 200, 200],
              fillColor: [10, 15, 30],
              lineColor: [26, 42, 74],
              lineWidth: 0.1,
            },
            headStyles: {
              fillColor: [0, 30, 60],
              textColor: [0, 229, 255],
              fontStyle: "bold",
              fontSize: 8,
            },
            alternateRowStyles: {
              fillColor: [15, 22, 40],
            },
          });

          doc.save(`worldscope-report-${timestamp}.pdf`);
          break;
        }
      }
    } finally {
      setTimeout(() => setExporting(null), 1000);
    }
  }, [items, hours]);

  const formats: { format: ExportFormat; key: string }[] = [
    { format: "csv", key: "exportCSV" },
    { format: "pdf", key: "exportPDF" },
    { format: "json", key: "exportJSON" },
  ];

  return (
    <div className="bg-hud-surface border border-hud-border rounded-md p-3">
      <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-2">
        ◆ {t("export")}
      </div>
      <div className="flex gap-1.5">
        {formats.map(({ format, key }) => (
          <button
            key={format}
            onClick={() => handleExport(format)}
            disabled={exporting !== null || items.length === 0}
            className={`font-mono text-[8px] px-3 py-1.5 rounded border transition-all flex-1 ${
              exporting === format
                ? "bg-hud-accent/20 border-hud-accent/50 text-hud-accent animate-pulse"
                : "bg-hud-panel border-hud-border text-hud-muted hover:text-hud-text hover:border-hud-muted disabled:opacity-40"
            }`}
          >
            {exporting === format ? t("exporting") : t(key)}
          </button>
        ))}
      </div>
    </div>
  );
}
