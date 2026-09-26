"use client";

import { createInvitations, resendInvitation, type BulkInvitationResult } from "@/actions/invitation/invitation-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Copy, FileSpreadsheet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = { email: string; name: string; lastName: string; role: string; team: string; position: string };

// Header names accepted for each column, in English and Russian, compared in lower case.
const COLUMNS: Record<keyof Row, string[]> = {
  email: ["email", "e-mail", "почта", "эл. почта", "электронная почта"],
  name: ["first name", "name", "имя"],
  lastName: ["last name", "surname", "фамилия"],
  role: ["role", "роль"],
  team: ["team", "команда"],
  position: ["position", "job title", "должность"],
};

function toRows(records: Record<string, unknown>[]): Row[] {
  return records.map((record) => {
    const lower = new Map(Object.entries(record).map(([key, value]) => [key.trim().toLowerCase(), String(value ?? "").trim()]));
    const pick = (column: keyof Row) => COLUMNS[column].map((name) => lower.get(name)).find(Boolean) ?? "";
    return {
      email: pick("email"),
      name: pick("name"),
      lastName: pick("lastName"),
      role: pick("role"),
      team: pick("team"),
      position: pick("position"),
    };
  });
}

// A small CSV reader: first line is the header; commas or semicolons; quotes allowed.
function readCsv(text: string): Record<string, unknown>[] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const separator = lines[0].includes(";") && !lines[0].includes(",") ? ";" : ",";
  const split = (line: string) => {
    const cells: string[] = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"' && quoted) {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === separator && !quoted) {
        cells.push(cell);
        cell = "";
      } else {
        cell += char;
      }
    }
    return [...cells, cell];
  };
  const header = split(lines[0]);
  return lines.slice(1).map((line) => Object.fromEntries(split(line).map((value, index) => [header[index] ?? "", value])));
}

async function readFile(file: File) {
  if (file.name.toLowerCase().endsWith(".csv")) {
    return toRows(readCsv(await file.text()));
  }
  const { readWorkbook, getSheetRows } = await import("@/utils/sheet/workbook");
  const workbook = await readWorkbook(file);
  return toRows(getSheetRows(workbook, workbook.sheetNames[0]));
}

export function BulkInviteDialog() {
  const t = useTranslations("people.bulk");
  const common = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [results, setResults] = useState<BulkInvitationResult[] | null>(null);

  const send = useMutation({
    mutationFn: () => createInvitations(rows ?? []),
    onSuccess: (outcome) => {
      setResults(outcome);
      router.refresh();
    },
    onError: () => toast({ title: common("error"), variant: "destructive" }),
  });

  const reset = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setRows(null);
      setResults(null);
    }
  };

  const usable = rows?.filter((row) => row.email) ?? [];

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet className="h-4 w-4" />
          {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("text")}</DialogDescription>
        </DialogHeader>
        {!results && (
          <div className="flex flex-col gap-3">
            <Input
              type="file"
              accept=".xlsx,.csv"
              aria-label={t("file")}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  setRows(await readFile(file));
                } catch {
                  toast({ title: common("fileErrorTitle"), variant: "destructive" });
                }
              }}
            />
            <p className="text-sm text-muted-foreground">{t("columns")}</p>
            {rows && (
              <p className="text-sm font-medium">
                {usable.length ? t("found", { count: usable.length }) : t("noneFound")}
              </p>
            )}
          </div>
        )}
        {results && (
          <ul className="flex max-h-72 flex-col divide-y overflow-y-auto rounded-lg border text-sm">
            {results.map((result, index) => (
              <li key={`${result.email}-${index}`} className="flex items-center gap-2 p-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{result.email}</span>
                  <span className={result.outcome === "sent" || result.outcome === "notEmailed" ? "text-muted-foreground" : "text-destructive"}>
                    {t(`outcomes.${result.outcome}`)}
                  </span>
                </span>
                {result.outcome === "notEmailed" && result.link && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(result.link!).then(() => toast({ title: t("copied") }))}
                  >
                    <Copy className="h-4 w-4" />
                    {t("copy")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          {results ? (
            <Button onClick={() => reset(false)}>{common("done")}</Button>
          ) : (
            <Button disabled={!usable.length || send.isPending} onClick={() => send.mutate()}>
              {t("send", { count: usable.length })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ResendInvitationButton({ invitationId, email }: { invitationId: string; email: string }) {
  const t = useTranslations("people.invitations");
  const common = useTranslations("common");
  const router = useRouter();
  const resend = useMutation({
    mutationFn: () => resendInvitation(invitationId),
    onSuccess: async ({ link, emailed }) => {
      router.refresh();
      if (emailed) {
        toast({ title: t("resent", { email }) });
        return;
      }
      const copied = await navigator.clipboard.writeText(link).then(
        () => true,
        () => false
      );
      toast({ title: t("resentNotEmailed"), description: copied ? t("linkCopied") : link });
    },
    onError: () => toast({ title: common("error"), variant: "destructive" }),
  });

  return (
    <Button variant="ghost" size="sm" onClick={() => resend.mutate()} disabled={resend.isPending} aria-label={t("resendFor", { email })}>
      {t("resend")}
    </Button>
  );
}
