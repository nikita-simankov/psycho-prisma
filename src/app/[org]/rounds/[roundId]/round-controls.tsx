"use client";

import {
  addPeopleToRound,
  closeRound,
  copyAssignmentLink,
  remindAssignment,
  remindNotStarted,
  removeAssignment,
  reopenRound,
} from "@/actions/round/round-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Bell, Copy, MoreHorizontal, Search, Trash2, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/utils/utils";

function useErrorToast() {
  const common = useTranslations("common");
  return () => toast({ title: common("error"), variant: "destructive" });
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function AssignmentMenu({
  assignmentId,
  name,
  open,
  reminded,
}: {
  assignmentId: string;
  name: string;
  open: boolean;
  reminded: boolean;
}) {
  const t = useTranslations("rounds");
  const router = useRouter();
  const onError = useErrorToast();

  const link = useMutation({
    mutationFn: () => copyAssignmentLink(assignmentId),
    onSuccess: async ({ link }) => {
      toast({ title: (await copy(link)) ? t("linkCopied") : link });
    },
    onError,
  });
  const remind = useMutation({
    mutationFn: () => remindAssignment(assignmentId),
    onSuccess: async ({ link, emailed }) => {
      if (emailed) {
        toast({ title: t("reminderSent", { name }) });
      } else {
        toast({ title: t("reminderNotEmailed"), description: (await copy(link)) ? t("linkCopied") : link });
      }
      router.refresh();
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: () => removeAssignment(assignmentId),
    onSuccess: () => router.refresh(),
    onError,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("actionsFor", { name })}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {open && (
          <>
            <DropdownMenuItem onSelect={() => remind.mutate()}>
              <Bell className="h-4 w-4" />
              {t(reminded ? "remindAgain" : "remind")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => link.mutate()}>
              <Copy className="h-4 w-4" />
              {t("copyLink")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => remove.mutate()}>
          <Trash2 className="h-4 w-4" />
          {t("removeFromRound")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RoundStateButton({ roundId, closed }: { roundId: string; closed: boolean }) {
  const t = useTranslations("rounds");
  const router = useRouter();
  const onError = useErrorToast();
  const change = useMutation({
    mutationFn: () => (closed ? reopenRound(roundId) : closeRound(roundId)),
    onSuccess: () => router.refresh(),
    onError,
  });

  return (
    <Button variant="outline" disabled={change.isPending} onClick={() => change.mutate()}>
      {t(closed ? "reopen" : "close")}
    </Button>
  );
}

export function AddPeopleDialog({ roundId, people }: { roundId: string; people: { id: string; name: string }[] }) {
  const t = useTranslations("rounds");
  const router = useRouter();
  const onError = useErrorToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);
  const visible = people.filter((person) => person.name.toLowerCase().includes(query.trim().toLowerCase()));

  const add = useMutation({
    mutationFn: async () => {
      const result = await addPeopleToRound(roundId, chosen);
      if ("error" in result) {
        throw new Error(t(`form.errors.${result.error}`));
      }
      return result;
    },
    onSuccess: ({ added }) => {
      toast({ title: t("added", { count: added }) });
      setOpen(false);
      setChosen([]);
      router.refresh();
    },
    onError,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={people.length === 0}>
          <UserPlus className="h-4 w-4" />
          {t("addPeople")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addPeople")}</DialogTitle>
          <DialogDescription>{t("addPeopleText")}</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label={t("form.searchPeople")}
            placeholder={t("form.searchPeople")}
            className="pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border">
          {visible.map((person) => (
            <li key={person.id}>
              <label className="flex cursor-pointer items-center gap-3 p-3 text-sm">
                <Checkbox
                  checked={chosen.includes(person.id)}
                  onCheckedChange={() =>
                    setChosen(chosen.includes(person.id) ? chosen.filter((id) => id !== person.id) : [...chosen, person.id])
                  }
                />
                {person.name}
              </label>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button disabled={!chosen.length || add.isPending} onClick={() => add.mutate()}>
            {t("addCount", { count: chosen.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const SEGMENTS = [
  { key: "finished", className: "bg-success" },
  { key: "started", className: "bg-primary" },
  { key: "notStarted", className: "bg-muted-foreground/30" },
  { key: "scheduled", className: "bg-primary/20" },
] as const;

// Live participation: who finished, started, hasn't begun or is waiting for working hours,
// with one button to nudge everyone who hasn't started.
export function RoundTracker({
  roundId,
  counts,
  total,
  waiting,
  open,
}: {
  roundId: string;
  counts: Record<(typeof SEGMENTS)[number]["key"], number>;
  total: number;
  waiting: number;
  open: boolean;
}) {
  const t = useTranslations("rounds.tracker");
  const router = useRouter();
  const onError = useErrorToast();
  const remind = useMutation({
    mutationFn: () => remindNotStarted(roundId),
    onSuccess: ({ reminded, emailed }) => {
      router.refresh();
      toast({ title: t("reminded", { count: reminded }), description: emailed < reminded ? t("notEmailed") : undefined });
    },
    onError,
  });
  const percent = total ? Math.round((counts.finished / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-heading text-4xl">{percent}%</span>
        <span className="text-sm text-muted-foreground">{t("finished", { done: counts.finished, total })}</span>
      </div>
      <div className="flex h-2.5 gap-px overflow-hidden rounded-full bg-muted" role="img" aria-label={t("label", { percent })}>
        {SEGMENTS.map(({ key, className }) =>
          counts[key] ? <div key={key} className={className} style={{ width: `${(counts[key] / Math.max(total, 1)) * 100}%` }} /> : null
        )}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {SEGMENTS.filter(({ key }) => key !== "scheduled" || counts.scheduled > 0).map(({ key, className }) => (
          <li key={key} className="flex items-center gap-2">
            <span className={cn("size-2 rounded-full", className)} aria-hidden />
            <span className="flex-1 text-muted-foreground">{t(`segments.${key}`)}</span>
            <span className="font-mono">{counts[key]}</span>
          </li>
        ))}
      </ul>
      {waiting > 0 && <p className="text-sm text-muted-foreground">{t("waiting", { count: waiting })}</p>}
      {open && counts.notStarted > 0 && (
        <Button variant="outline" className="w-fit" disabled={remind.isPending} onClick={() => remind.mutate()}>
          <Bell className="h-4 w-4" />
          {t("remind", { count: counts.notStarted })}
        </Button>
      )}
    </div>
  );
}
