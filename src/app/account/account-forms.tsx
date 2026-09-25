"use client";

import { changeEmail, changePassword, leaveOrganization, updateProfile } from "@/actions/account/account-actions";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "@/hooks/use-toast";
import { can } from "@/utils/roles";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Result = { ok: true } | { error: string };

// Runs an account action and shows a toast for its outcome.
function useAccountAction<T>(action: (value: T) => Promise<Result>, onSuccess?: () => void) {
  const t = useTranslations("account");
  const router = useRouter();

  return useMutation({
    mutationFn: async (value: T) => {
      const result = await action(value);
      if ("error" in result) {
        throw new Error(t(`errors.${result.error}` as "errors.invalidInput"));
      }
    },
    onSuccess: () => {
      toast({ title: t("saved") });
      onSuccess?.();
      router.refresh();
    },
    onError: (error) => toast({ title: t("notSaved"), description: error.message, variant: "destructive" }),
  });
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

type Profile = { name: string; middleName: string; lastName: string; phoneNumber: string };

export function ProfileForm({ initial }: { initial: Profile }) {
  const t = useTranslations("account");
  const fields = useTranslations("profile.fields");
  const common = useTranslations("common");
  const [profile, setProfile] = useState(initial);
  const save = useAccountAction(updateProfile);

  const set = (key: keyof Profile) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setProfile((current) => ({ ...current, [key]: event.target.value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate(profile);
  };

  return (
    <Card>
      <form onSubmit={submit}>
        <CardHeader>
          <CardTitle className="text-lg">{t("profile")}</CardTitle>
          <CardDescription>{t("profileText")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field id="lastName" label={fields("lastName")}>
            <Input id="lastName" required maxLength={100} value={profile.lastName} onChange={set("lastName")} />
          </Field>
          <Field id="name" label={fields("name")}>
            <Input id="name" required maxLength={100} value={profile.name} onChange={set("name")} />
          </Field>
          <Field id="middleName" label={fields("middleName")}>
            <Input id="middleName" maxLength={100} value={profile.middleName} onChange={set("middleName")} />
          </Field>
          <div className="sm:col-span-3">
            <Field id="phoneNumber" label={fields("phoneNumber")}>
              <Input
                id="phoneNumber"
                type="tel"
                maxLength={30}
                className="sm:max-w-xs"
                value={profile.phoneNumber}
                onChange={set("phoneNumber")}
              />
            </Field>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={save.isPending}>
            {common("save")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function EmailForm({ email: current }: { email: string }) {
  const t = useTranslations("account");
  const fields = useTranslations("profile.fields");
  const [email, setEmail] = useState(current);
  const [password, setPassword] = useState("");
  const save = useAccountAction(
    (value: { email: string; password: string }) => changeEmail(value.email, value.password),
    () => setPassword("")
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate({ email, password });
  };

  return (
    <Card>
      <form onSubmit={submit}>
        <CardHeader>
          <CardTitle className="text-lg">{t("email")}</CardTitle>
          <CardDescription>{t("emailText")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="email" label={fields("email")}>
            <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field id="email-password" label={t("currentPassword")}>
            <PasswordInput
              id="email-password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={save.isPending || email.trim() === current || !password}>
            {t("changeEmail")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function PasswordForm() {
  const t = useTranslations("account");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const save = useAccountAction(
    (value: { current: string; next: string }) => changePassword(value.current, value.next),
    () => {
      setCurrent("");
      setNext("");
      setRepeat("");
    }
  );
  const mismatch = repeat.length > 0 && next !== repeat;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate({ current, next });
  };

  return (
    <Card>
      <form onSubmit={submit}>
        <CardHeader>
          <CardTitle className="text-lg">{t("password")}</CardTitle>
          <CardDescription>{t("passwordText")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field id="current-password" label={t("currentPassword")}>
            <PasswordInput
              id="current-password"
              required
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
          <Field id="new-password" label={t("newPassword")}>
            <PasswordInput
              id="new-password"
              required
              minLength={8}
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </Field>
          <Field id="repeat-password" label={t("repeatPassword")}>
            <PasswordInput
              id="repeat-password"
              required
              autoComplete="new-password"
              aria-invalid={mismatch}
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
            />
          </Field>
          {mismatch && <p className="text-sm text-destructive sm:col-span-3">{t("passwordsDiffer")}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={save.isPending || !current || !next || next !== repeat}>
            {t("changePassword")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

type Organization = { id: string; name: string; slug: string; role: string };

export function OrganizationList({ organizations }: { organizations: Organization[] }) {
  const t = useTranslations("account");
  const roles = useTranslations("roles");
  const common = useTranslations("common");
  const leave = useAccountAction(leaveOrganization);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("organizations")}</CardTitle>
        <CardDescription>{t("organizationsText")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {organizations.length === 0 && <p className="text-sm text-muted-foreground">{t("noOrganizations")}</p>}
        {organizations.map((organization) => (
          <div key={organization.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate font-medium">{organization.name}</span>
              <Badge variant="secondary">{roles(organization.role as "member")}</Badge>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={can(organization.role, "viewDashboard") ? `/${organization.slug}` : "/forms"}>
                {common("open")}
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  {t("leave")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("leaveTitle", { name: organization.name })}</AlertDialogTitle>
                  <AlertDialogDescription>{t("leaveText")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{common("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => leave.mutate(organization.id)}
                  >
                    {t("leave")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
        <div className="pt-3">
          <Button variant="link" className="h-auto px-0" asChild>
            <Link href="/organizations/new">{t("createOrganization")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
