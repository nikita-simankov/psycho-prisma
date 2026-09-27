"use client";

import { createTeamAction, deleteTeamAction, updateTeamAction } from "@/actions/wellbeing/wellbeing-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ACTION_STATUSES, type ActionStatus } from "@/utils/wellbeing";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Action = { id: string; teamId: string | null; teamName: string | null; text: string; status: ActionStatus };

const EVERYONE = "everyone";

// "You said, we did" for one round: what staff will do about its results, per team, with a status
// people see on their assessments page.
export function TeamActionsEditor({ roundId, teams, actions }: { roundId: string; teams: { id: string; name: string }[]; actions: Action[] }) {
  const t = useTranslations("wellbeing.actions");
  const common = useTranslations("common");
  const router = useRouter();
  const [teamId, setTeamId] = useState(teams[0]?.id ?? EVERYONE);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<ActionStatus>("planned");
  const onError = () => toast({ title: common("error"), variant: "destructive" });

  const create = useMutation({
    mutationFn: () => createTeamAction({ roundId, teamId: teamId === EVERYONE ? null : teamId, text, status }),
    onSuccess: () => {
      setText("");
      toast({ title: t("added") });
      router.refresh();
    },
    onError,
  });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ActionStatus }) => updateTeamAction(id, { status }),
    onSuccess: () => router.refresh(),
    onError,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteTeamAction(id),
    onSuccess: () => router.refresh(),
    onError,
  });

  return (
    <div className="flex flex-col gap-4">
      {actions.length > 0 ? (
        <ul className="divide-y rounded-lg border bg-card">
          {actions.map((action) => (
            <li key={action.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted-foreground">{action.teamName ?? t("everyone")}</span>
                <span className="block">{action.text}</span>
              </span>
              <Select value={action.status} onValueChange={(value) => update.mutate({ id: action.id, status: value as ActionStatus })}>
                <SelectTrigger className="w-36" aria-label={t("statusOf", { text: action.text })}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_STATUSES.map((entry) => (
                    <SelectItem key={entry} value={entry}>
                      {t(`statuses.${entry}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" size="icon" variant="ghost" aria-label={t("delete", { text: action.text })} onClick={() => remove.mutate(action.id)}>
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}
      <form
        className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[10rem_minmax(0,1fr)_9rem_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          if (text.trim()) create.mutate();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="action-team">{t("team")}</Label>
          <Select value={teamId} onValueChange={setTeamId}>
            <SelectTrigger id="action-team">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EVERYONE}>{t("everyone")}</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="action-text">{t("text")}</Label>
          <Input id="action-text" maxLength={280} placeholder={t("placeholder")} value={text} onChange={(event) => setText(event.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="action-status">{t("status")}</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as ActionStatus)}>
            <SelectTrigger id="action-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_STATUSES.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {t(`statuses.${entry}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={!text.trim() || create.isPending}>
          <Plus className="size-4" />
          {t("add")}
        </Button>
      </form>
    </div>
  );
}
