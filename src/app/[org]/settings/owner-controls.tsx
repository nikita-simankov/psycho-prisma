"use client";

import { deleteOrganization, transferOwnership } from "@/actions/organization/organization-actions";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Candidate = { id: string; name: string };

// Ownership transfer and deletion; only owners see this.
export function OwnerControls({ organizationName, candidates }: { organizationName: string; candidates: Candidate[] }) {
  const t = useTranslations("settings.owner");
  const common = useTranslations("common");
  const router = useRouter();
  const [newOwner, setNewOwner] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const transfer = useMutation({
    mutationFn: () => transferOwnership(newOwner),
    onSuccess: () => {
      toast({ title: t("transferred") });
      router.refresh();
    },
    onError: () => toast({ title: common("error"), variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const result = await deleteOrganization(confirmation);
      if ("error" in result) {
        throw new Error(t("nameMismatch"));
      }
    },
    onSuccess: () => {
      router.push("/account");
      router.refresh();
    },
    onError: (error) => toast({ title: common("error"), description: error.message, variant: "destructive" }),
  });

  const chosen = candidates.find((candidate) => candidate.id === newOwner);

  return (
    <Card className="max-w-2xl border-destructive/40">
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="new-owner">{t("transfer")}</Label>
          <p className="text-sm text-muted-foreground">{t("transferText")}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={newOwner} onValueChange={setNewOwner} disabled={candidates.length === 0}>
              <SelectTrigger id="new-owner" className="sm:max-w-xs">
                <SelectValue placeholder={candidates.length ? t("choosePerson") : t("nobody")} />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={!chosen || transfer.isPending}>
                  {t("transferButton")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("transferConfirmTitle", { name: chosen?.name ?? "" })}</AlertDialogTitle>
                  <AlertDialogDescription>{t("transferConfirmText")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{common("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => transfer.mutate()}>{t("transferButton")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t pt-6">
          <Label>{t("delete")}</Label>
          <p className="text-sm text-muted-foreground">{t("deleteText")}</p>
          <AlertDialog onOpenChange={() => setConfirmation("")}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-fit">
                {t("deleteButton")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteConfirmTitle", { name: organizationName })}</AlertDialogTitle>
                <AlertDialogDescription>{t("deleteConfirmText")}</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-2">
                <Label htmlFor="delete-confirmation">{t("typeName", { name: organizationName })}</Label>
                <Input
                  id="delete-confirmation"
                  autoComplete="off"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>{common("cancel")}</AlertDialogCancel>
                <Button
                  variant="destructive"
                  disabled={confirmation.trim() !== organizationName || remove.isPending}
                  onClick={() => remove.mutate()}
                >
                  {t("deleteButton")}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
