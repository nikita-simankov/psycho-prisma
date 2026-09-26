"use client";

import { revokeInvitation } from "@/actions/invitation/invitation-actions";
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
import { Trash2, UserRoundCog } from "lucide-react";
import { LOCALES } from "@/i18n/config";
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

export function RoleField({ roles, value, onChange }: { roles: string[]; value: string; onChange: (role: string) => void }) {
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

// The invitee may not read the inviter's language, so the email language is chosen per invitation.
export function LanguageField({ value, onChange }: { value: string; onChange: (locale: string) => void }) {
  const t = useTranslations("people.invite");
  const common = useTranslations("common");

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="invite-language">{t("language")}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="invite-language">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LOCALES.map((locale) => (
            <SelectItem key={locale} value={locale}>
              {common(`locales.${locale}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function TeamField({ teams, value, onChange }: { teams: Team[]; value: string | null; onChange: (id: string | null) => void }) {
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
