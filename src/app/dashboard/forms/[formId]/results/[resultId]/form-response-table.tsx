"use client";

import { DataTable } from "@/components/data-table";
import { useTranslations } from "next-intl";

type Row = { id: number; question: string; answer: string };

export function FormResponseTable({ rows }: { rows: Row[] }) {
  const t = useTranslations("results.table");

  return (
    <DataTable
      columns={[
        { header: t("number"), accessorKey: "id" },
        { header: t("question"), accessorKey: "question" },
        { header: t("answer"), accessorKey: "answer" },
      ]}
      data={rows}
    />
  );
}
