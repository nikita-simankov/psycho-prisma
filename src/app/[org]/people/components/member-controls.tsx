"use client";

import { createInvitation, revokeInvitation } from "@/actions/invitation/invitation-actions";
import { removeMember } from "@/actions/user/remove-member-action";
import { updateFlag } from "@/actions/user/update-flag-action";
import { updateMembership } from "@/actions/user/update-membership-action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { FLAGS } from "@/utils/flags";
import { useMutation } from "@tanstack/react-query";
import { Check, Copy, Mail, Trash2, UserPlus, UserRoundCog } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOrganizationBase } from "@/components/organization-provider";

type Team = { id: string; name: string };

const NO_TEAM = "none";
const NO_FLAG = "none";

function useRefreshingMutation<T, R>(action: (value: T) => Promise<R>, onSuccess?: (result: R) => void) {
  const common = useTranslations("common");
  const router = useRouter();

  return useMutation({
    mutationFn: action,
    onSuccess: (result) => {
      router.refresh();
      onSuccess?.(result);
    },
    onError: (error) => toast({ title: common("error"), description: error.message, variant: "destructive" }),
  });
}

function RoleField({ roles, value, onChange }: { roles: string[]; value: string; onChange: (role: string) => void }) {
  const t = useTranslations("roles");
  const hints = useTranslations("roleHints");

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="role">{useTranslations("profile.fields")("role")}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role} value={role}>
              {t(role)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{hints(value)}</p>
    </div>
  );
}

function TeamField({ teams, value, onChange }: { teams: Team[]; value: string | null; onChange: (id: string | null) => void }) {
  const t = useTranslations("teams");

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="team">{t("team")}</Label>
      <Select value={value ?? NO_TEAM} onValueChange={(id) => onChange(id === NO_TEAM ? null : id)}>
        <SelectTrigger id="team">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_TEAM}>{t("noTeam")}</SelectItem>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Invite someone by email. Shows the link afterwards, so it can be sent by hand when email is not set up.
export function InviteDialog({ roles, teams }: { roles: string[]; teams: Team[] }) {
  const t = useTranslations("people.invite");
  const fields = useTranslations("profile.fields");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({ email: "", name: "", lastName: "", position: "", role: "member", teamId: null as string | null });
  const [result, setResult] = useState<{ link: string; emailed: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const mutation = useRefreshingMutation(
    async () => {
      const outcome = await createInvitation(values);
      if ("error" in outcome) throw new Error(t(outcome.error));
      return outcome;
    },
    setResult
  );

  const reset = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setResult(null);
      setCopied(false);
      setValues({ email: "", name: "", lastName: "", position: "", role: "member", teamId: null });
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result!.link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const text = (key: "email" | "name" | "lastName" | "position", type = "text") => (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`invite-${key}`}>{fields(key)}</Label>
      <Input
        id={`invite-${key}`}
        type={type}
        required={key === "email"}
        value={values[key]}
        onChange={(event) => setValues({ ...values, [key]: event.target.value })}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{result ? t("sentTitle") : t("title")}</DialogTitle>
          <DialogDescription>
            {result ? (result.emailed ? t("emailed", { email: values.email }) : t("notEmailed")) : t("description")}
          </DialogDescription>
        </DialogHeader>
        {result ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input readOnly value={result.link} aria-label={t("link")} onFocus={(event) => event.target.select()} />
              <Button type="button" variant="outline" onClick={copy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">{t("copy")}</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("linkHint")}</p>
            <DialogFooter>
              <Button onClick={() => reset(false)}>{common("done")}</Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate(undefined);
            }}
          >
            {text("email", "email")}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {text("name")}
              {text("lastName")}
            </div>
            <RoleField roles={roles} value={values.role} onChange={(role) => setValues({ ...values, role })} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TeamField teams={teams} value={values.teamId} onChange={(teamId) => setValues({ ...values, teamId })} />
              {text("position")}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                <Mail className="mr-2 h-4 w-4" />
                {t("send")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Role, team and position. A role change is spelled out before it is saved.
export function MembershipDialog({
  userId,
  name,
  current,
  roles,
  teams,
}: {
  userId: string;
  name: string;
  current: { role: string; teamId: string | null; position: string };
  roles: string[];
  teams: Team[];
}) {
  const t = useTranslations("people.membership");
  const roleNames = useTranslations("roles");
  const fields = useTranslations("profile.fields");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(current);
  const roleChanged = values.role !== current.role;

  const mutation = useRefreshingMutation(
    async () => {
      const result = await updateMembership(userId, values);
      if ("error" in result) throw new Error(t("planSeats"));
      return result;
    },
    () => setOpen(false)
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValues(current);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserRoundCog className="mr-2 h-4 w-4" />
          {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{name}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {roles.length > 0 && (
            <RoleField
              roles={roles.includes(current.role) ? roles : [current.role, ...roles]}
              value={values.role}
              onChange={(role) => setValues({ ...values, role })}
            />
          )}
          <TeamField teams={teams} value={values.teamId} onChange={(teamId) => setValues({ ...values, teamId })} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="position">{fields("position")}</Label>
            <Input
              id="position"
              value={values.position}
              onChange={(event) => setValues({ ...values, position: event.target.value })}
            />
          </div>
          {roleChanged && (
            <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm" role="status">
              {t("roleChange", { name, from: roleNames(current.role), to: roleNames(values.role) })}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {common("cancel")}
          </Button>
          <Button onClick={() => mutation.mutate(undefined)} disabled={mutation.isPending}>
            {roleChanged ? t("confirmRole", { role: roleNames(values.role) }) : common("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Restricted follow-up flag, for psychologists and owners only.
export function FlagSelect({ userId, flag }: { userId: string; flag: string }) {
  const t = useTranslations("flags");
  const mutation = useRefreshingMutation((value: string) => updateFlag(userId, value));

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="flag">{t("label")}</Label>
      <Select
        value={flag || NO_FLAG}
        onValueChange={(value) => mutation.mutate(value === NO_FLAG ? "" : value)}
        disabled={mutation.isPending}
      >
        <SelectTrigger id="flag">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_FLAG}>{t("none")}</SelectItem>
          {FLAGS.map((key) => (
            <SelectItem key={key} value={key}>
              {t(key)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </div>
  );
}

export function RemoveMemberButton({ userId, name, organization }: { userId: string; name: string; organization: string }) {
  const base = useOrganizationBase();
  const t = useTranslations("people.remove");
  const common = useTranslations("common");
  const router = useRouter();
  const mutation = useRefreshingMutation(() => removeMember(userId), () => router.push(`${base}/people`));

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          {t("button")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title", { name })}</AlertDialogTitle>
          <AlertDialogDescription>{t("description", { organization })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{common("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => mutation.mutate(undefined)}
          >
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RevokeInvitationButton({ invitationId, email }: { invitationId: string; email: string }) {
  const t = useTranslations("people.invitations");
  const mutation = useRefreshingMutation(() => revokeInvitation(invitationId));

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={() => mutation.mutate(undefined)}
      disabled={mutation.isPending}
      aria-label={t("revokeFor", { email })}
    >
      {t("revoke")}
    </Button>
  );
}
