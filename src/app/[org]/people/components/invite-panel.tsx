"use client";

import { inviteEmails, type BulkInvitationResult } from "@/actions/invitation/invitation-actions";
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
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { can, STAFF_ROLES, type Permission } from "@/utils/roles";
import { cn } from "@/utils/utils";
import { useMutation } from "@tanstack/react-query";
import { Check, Copy, Mail, Minus, UserPlus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LanguageField, RoleField, TeamField } from "./member-controls";

type Team = { id: string; name: string };
export type Seats = { used: number; limit: number | null };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Splits pasted text into addresses: commas, semicolons, spaces or new lines, and "Name <a@b.c>".
export function splitEmails(text: string) {
  return text
    .split(/[\s,;]+/)
    .map((part) => part.replace(/^<|>$/g, "").trim().toLowerCase())
    .filter(Boolean);
}

// What each role can see, in the order people ask about it.
const LENS: { key: string; permission: Permission }[] = [
  { key: "dashboard", permission: "viewDashboard" },
  { key: "individual", permission: "viewIndividualResults" },
  { key: "rounds", permission: "manageRounds" },
  { key: "clinical", permission: "viewSensitive" },
  { key: "people", permission: "manageMembers" },
  { key: "audit", permission: "viewAudit" },
];

// A plain list of what someone with this role will and won't see, next to the role picker.
export function RoleLens({ role }: { role: string }) {
  const t = useTranslations("people.lens");

  return (
    <div className="rounded-md border bg-card p-3" aria-live="polite">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("title")}</p>
      <ul className="grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
        {LENS.map(({ key, permission }) => {
          const allowed = can(role, permission);
          return (
            <li key={key} className={cn("flex items-center gap-2", !allowed && "text-muted-foreground")}>
              {allowed ? (
                <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              ) : (
                <Minus className="h-4 w-4 shrink-0" aria-hidden />
              )}
              <span>
                {t(`items.${key}`)}
                <span className="sr-only"> {allowed ? t("yes") : t("no")}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SeatMeter({ seats, adding }: { seats: Seats; adding: number }) {
  const t = useTranslations("people.invite");
  if (seats.limit === null) {
    return null;
  }
  const after = seats.used + adding;
  const over = Math.max(0, after - seats.limit);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span>{t("seats", { used: seats.used, limit: seats.limit })}</span>
        {adding > 0 && (
          <span className={cn("font-mono text-xs", over ? "text-destructive" : "text-muted-foreground")}>
            {over ? t("seatsOver", { count: over }) : t("seatsAdding", { count: adding })}
          </span>
        )}
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-muted" role="presentation">
        <div className="bg-primary" style={{ width: `${Math.min(100, (seats.used / seats.limit) * 100)}%` }} />
        <div
          className={over ? "bg-destructive" : "bg-primary/40"}
          style={{ width: `${Math.min(100 - Math.min(100, (seats.used / seats.limit) * 100), (adding / seats.limit) * 100)}%` }}
        />
      </div>
    </div>
  );
}

// Invite several people at once: paste addresses, pick one role and team, see the seats they use.
export function InvitePanel({ roles, teams, seats }: { roles: string[]; teams: Team[]; seats: Seats }) {
  const t = useTranslations("people.invite");
  const outcomes = useTranslations("people.bulk.outcomes");
  const fields = useTranslations("profile.fields");
  const common = useTranslations("common");
  const router = useRouter();
  const currentLocale = useLocale();
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState("member");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [locale, setLocale] = useState(currentLocale);
  const [results, setResults] = useState<BulkInvitationResult[] | null>(null);

  const all = [...emails, ...splitEmails(draft)].filter((email, index, list) => list.indexOf(email) === index);
  const valid = all.filter((email) => EMAIL.test(email));
  const invalid = emails.filter((email) => !EMAIL.test(email));
  const staff = (STAFF_ROLES as readonly string[]).includes(role);
  const over = staff && seats.limit !== null && seats.used + valid.length > seats.limit;

  const commit = (text: string) => {
    const added = splitEmails(text);
    if (added.length) {
      setEmails((current) => Array.from(new Set([...current, ...added])));
    }
    setDraft("");
  };

  const send = useMutation({
    mutationFn: async () => {
      const response = await inviteEmails({ emails: valid, role, teamId, locale });
      const refused = response.find((result) => result.outcome === "emailUnverified" || result.outcome === "planSeats");
      if (response.length === 1 && refused) {
        throw new Error(t(refused.outcome));
      }
      return response;
    },
    onSuccess: (response) => {
      router.refresh();
      setResults(response);
    },
    onError: (error) => toast({ title: common("error"), description: error.message, variant: "destructive" }),
  });

  const reset = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setEmails([]);
      setDraft("");
      setResults(null);
      setRole("member");
      setTeamId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{results ? t("sentTitle") : t("title")}</DialogTitle>
          <DialogDescription>{results ? t("sentText") : t("description")}</DialogDescription>
        </DialogHeader>
        {results ? (
          <>
            <ul className="flex max-h-72 flex-col divide-y overflow-y-auto rounded-lg border text-sm">
              {results.map((result) => (
                <li key={result.email} className="flex items-center gap-2 p-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{result.email}</span>
                    <span
                      className={
                        result.outcome === "sent" || result.outcome === "notEmailed" ? "text-muted-foreground" : "text-destructive"
                      }
                    >
                      {outcomes(result.outcome)}
                    </span>
                  </span>
                  {result.link && result.outcome === "notEmailed" && (
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
            {results.some((result) => result.outcome === "notEmailed") && (
              <p className="text-xs text-muted-foreground">{t("linkHint")}</p>
            )}
            <DialogFooter>
              <Button onClick={() => reset(false)}>{common("done")}</Button>
            </DialogFooter>
          </>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              commit(draft);
              if (valid.length && !over) send.mutate();
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-email">{fields("email")}</Label>
              <div
                className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring"
                onClick={() => document.getElementById("invite-email")?.focus()}
              >
                {emails.map((email) => {
                  const bad = !EMAIL.test(email);
                  return (
                    <span
                      key={email}
                      className={cn(
                        "flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm",
                        bad ? "border-destructive bg-destructive/10 text-destructive" : "bg-muted"
                      )}
                    >
                      {email}
                      <button
                        type="button"
                        className="rounded-full p-0.5 hover:bg-foreground/10"
                        aria-label={t("removeEmail", { email })}
                        onClick={() => setEmails((current) => current.filter((entry) => entry !== email))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                <input
                  id="invite-email"
                  type="text"
                  inputMode="email"
                  autoComplete="off"
                  className="min-w-[12rem] flex-1 bg-transparent px-1 py-1 text-sm outline-none"
                  placeholder={emails.length ? "" : t("emailsPlaceholder")}
                  value={draft}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (/[\s,;]$/.test(value)) commit(value);
                    else setDraft(value);
                  }}
                  onPaste={(event) => {
                    event.preventDefault();
                    commit(draft + event.clipboardData.getData("text"));
                  }}
                  onBlur={() => commit(draft)}
                  onKeyDown={(event) => {
                    if (event.key === "Backspace" && !draft && emails.length) {
                      setEmails((current) => current.slice(0, -1));
                    }
                  }}
                />
              </div>
              <p className={cn("text-xs", invalid.length ? "text-destructive" : "text-muted-foreground")}>
                {invalid.length ? t("invalidEmails", { count: invalid.length }) : t("emailsHint")}
              </p>
            </div>
            <RoleField roles={roles} value={role} onChange={setRole} />
            <RoleLens role={role} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TeamField teams={teams} value={teamId} onChange={setTeamId} />
              <LanguageField value={locale} onChange={setLocale} />
            </div>
            {staff && <SeatMeter seats={seats} adding={valid.length} />}
            <DialogFooter>
              <Button type="submit" disabled={send.isPending || over || (!valid.length && !draft.trim())}>
                <Mail className="mr-2 h-4 w-4" />
                {t("sendCount", { count: Math.max(1, valid.length) })}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
