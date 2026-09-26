"use client";

import { Button } from "@/components/ui/button";
import { toCsv } from "@/utils/csv";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";

// Downloads the figures on the page (group aggregates only) as a CSV file.
export function ExportButton({ rows, filename }: { rows: (string | number | null)[][]; filename: string }) {
  const t = useTranslations("analytics");

  return (
    <Button
      variant="outline"
      disabled={rows.length === 0}
      onClick={() => {
        const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }}
    >
      <Download className="mr-2 h-4 w-4" />
      {t("export")}
    </Button>
  );
}
