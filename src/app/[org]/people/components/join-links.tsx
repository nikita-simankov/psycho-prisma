"use client";

import { createJoinLink, revokeJoinLink } from "@/actions/invitation/join-link-actions";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Copy, Link2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TeamField } from "./member-controls";

type JoinLink = {
  id: string;
  url: string;
  team: string | null;
  expiresAt: Date;
  maxUses: number | null;
  uses: number;
  status: "open" | "expired" | "revoked" | "full";
};

const DAYS = [7, 30, 90];

function copy(url: string, done: string) {
  navigator.clipboard.writeText(url).then(
    () => toast({ title: done }),
    () => toast({ title: url })
  );
}

// Links an admin can post in a team chat. Anyone with one joins as an employee, until it
// expires, reaches its limit or is revoked.
export function JoinLinks({ links, teams }: { links: JoinLink[]; teams: { id: string; name: string }[] }) {
  const t = useTranslations("people.joinLinks");
  const common = useTranslations("common");
  const format = useFormatter();
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [maxUses, setMaxUses] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => createJoinLink({ days, maxUses: maxUses ? Number(maxUses) : null, teamId }),
    onSuccess: ({ url }) => {
      router.refresh();
      setMaxUses("");
      copy(url, t("created"));
    },
    onError: () => toast({ title: common("error"), variant: "destructive" }),
  });

  const revoke = useMutation({
    mutationFn: revokeJoinLink,
    onSuccess: () => router.refresh(),
    onError: () => toast({ title: common("error"), variant: "destructive" }),
  });

  return (
    <div className="flex flex-col gap-6">
      {links.length === 0 ? (
        <EmptyState icon={Link2} title={t("none")} description={t("noneText")} />
      ) : (
        <ul className="divide-y border-y">
          {links.map((link) => (
            <li key={link.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm">{link.url}</p>
                <p className="text-sm text-muted-foreground">
                  {[
                    link.team ?? t("anyTeam"),
                    link.maxUses === null ? t("usesUnlimited", { uses: link.uses }) : t("uses", { uses: link.uses, max: link.maxUses }),
                    link.status === "open"
                      ? t("expires", { date: format.dateTime(link.expiresAt, { dateStyle: "medium" }) })
                      : t(`status.${link.status}`),
                  ].join(" · ")}
                </p>
              </div>
              <div className="flex gap-1">
                {link.status === "open" && (
                  <Button variant="ghost" size="sm" onClick={() => copy(link.url, t("copied"))}>
                    <Copy className="h-4 w-4" />
                    {t("copy")}
                  </Button>
                )}
                <Button variant="ghost" size="sm" disabled={revoke.isPending} onClick={() => revoke.mutate(link.id)}>
                  {t("revoke")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        className="grid grid-cols-1 items-end gap-4 sm:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="join-days">{t("validFor")}</Label>
          <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
            <SelectTrigger id="join-days">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {t("days", { count: value })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="join-max">{t("limit")}</Label>
          <Input
            id="join-max"
            type="number"
            min={1}
            max={10000}
            placeholder={t("noLimit")}
            value={maxUses}
            onChange={(event) => setMaxUses(event.target.value)}
          />
        </div>
        <TeamField teams={teams} value={teamId} onChange={setTeamId} />
        <Button type="submit" disabled={create.isPending}>
          <Link2 className="h-4 w-4" />
          {t("create")}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </div>
  );
}
