"use client";

import {
  createInvitations,
  previewInvitations,
  resendInvitation,
  type BulkInvitationResult,
  type PreviewOutcome,
  type PreviewRow,
} from "@/actions/invitation/invitation-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
import { Copy, Download, FileSpreadsheet } from "lucide-react";
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

const TEMPLATE = "Email,First name,Last name,Role,Team,Position\nanna.k@example.com,Anna,Kim,Member,Sales,Account manager\n";
const BATCH = 10;

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob(["\uFEFF" + TEMPLATE], { type: "text/csv;charset=utf-8" }));
  const anchor = Object.assign(document.createElement("a"), { href: url, download: "calibre-invitations.csv" });
  anchor.click();
  URL.revokeObjectURL(url);
}

const SENDABLE: PreviewOutcome[] = ["ready", "newTeam", "reinvite"];

// Upload a spreadsheet, check every row in a preview, then send in small batches with progress.
export function BulkInviteDialog() {
  const t = useTranslations("people.bulk");
  const roles = useTranslations("roles");
  const common = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [createTeams, setCreateTeams] = useState(true);
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [results, setResults] = useState<BulkInvitationResult[] | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const check = useMutation({
    mutationFn: ({ list, create }: { list: Row[]; create: boolean }) => previewInvitations(list, { createTeams: create }),
    onSuccess: setPreview,
    onError: () => toast({ title: common("error"), variant: "destructive" }),
  });

  const sendable = rows && preview ? rows.filter((_, index) => SENDABLE.includes(preview[index]?.outcome)) : [];

  const send = useMutation({
    mutationFn: async () => {
      const outcome: BulkInvitationResult[] = [];
      setProgress(0);
      for (let start = 0; start < sendable.length; start += BATCH) {
        outcome.push(...(await createInvitations(sendable.slice(start, start + BATCH), { createTeams })));
        setProgress(Math.min(sendable.length, start + BATCH));
      }
      return outcome;
    },
    onSuccess: (outcome) => {
      setResults(outcome);
      router.refresh();
    },
    onError: () => toast({ title: common("error"), variant: "destructive" }),
    onSettled: () => setProgress(null),
  });

  const reset = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setRows(null);
      setPreview(null);
      setResults(null);
    }
  };

  const load = (list: Row[], create = createTeams) => {
    const usable = list.filter((row) => row.email);
    setRows(usable);
    setPreview(null);
    if (usable.length) check.mutate({ list: usable, create });
  };

  const problems = preview?.filter((row) => !SENDABLE.includes(row.outcome)).length ?? 0;

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet className="h-4 w-4" />
          {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("text")}</DialogDescription>
        </DialogHeader>
        {!results && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="file"
                accept=".xlsx,.csv"
                aria-label={t("file")}
                className="min-w-0 flex-1"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    load(await readFile(file));
                  } catch {
                    toast({ title: common("fileErrorTitle"), variant: "destructive" });
                  }
                }}
              />
              <Button type="button" variant="ghost" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4" />
                {t("template")}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{t("columns")}</p>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={createTeams}
                onCheckedChange={(value) => {
                  setCreateTeams(value === true);
                  if (rows?.length) load(rows, value === true);
                }}
              />
              {t("createTeams")}
            </label>
            {rows && !rows.length && <p className="text-sm font-medium">{t("noneFound")}</p>}
            {preview && (
              <>
                <p className="text-sm font-medium">
                  {t("previewSummary", { ready: sendable.length, problems })}
                </p>
                <div className="max-h-72 overflow-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="p-2 font-medium">{t("previewEmail")}</th>
                        <th className="p-2 font-medium">{t("previewRole")}</th>
                        <th className="p-2 font-medium">{t("previewTeam")}</th>
                        <th className="p-2 font-medium">{t("previewCheck")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {preview.map((row, index) => {
                        const ok = SENDABLE.includes(row.outcome);
                        return (
                          <tr key={`${row.email}-${index}`}>
                            <td className="max-w-[14rem] truncate p-2">{row.email}</td>
                            <td className="p-2">{roles.has(row.role) ? roles(row.role as "member") : row.role}</td>
                            <td className="p-2">{row.team}</td>
                            <td className={ok ? "p-2 text-muted-foreground" : "p-2 text-destructive"}>
                              {t(`preview.${row.outcome}`)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {progress !== null && (
              <div className="flex flex-col gap-1">
                <Progress value={progress} max={Math.max(1, sendable.length)} label={t("sending")} />
                <p className="font-mono text-xs text-muted-foreground">
                  {t("progress", { done: progress, total: sendable.length })}
                </p>
              </div>
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
            <Button disabled={!sendable.length || send.isPending || check.isPending} onClick={() => send.mutate()}>
              {t("send", { count: sendable.length })}
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
