"use client";

import { createTeam, deleteTeam, renameTeam } from "@/actions/team/team-actions";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOrganizationBase } from "@/components/organization-provider";

// Create a team, or rename one when `team` is given.
export function TeamDialog({ team }: { team?: { id: string; name: string } }) {
  const t = useTranslations("teams");
  const common = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(team?.name ?? "");

  const mutation = useMutation({
    mutationFn: async () => {
      if (team) await renameTeam(team.id, name);
      else await createTeam(name);
    },
    onSuccess: () => {
      setOpen(false);
      if (!team) setName("");
      router.refresh();
    },
    onError: () => toast({ title: common("error"), description: t("saveError"), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {team ? (
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            {t("rename")}
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("create")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>{team ? t("rename") : t("create")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="team-name">{t("name")}</Label>
            <Input
              id="team-name"
              required
              maxLength={100}
              placeholder={t("namePlaceholder")}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending || !name.trim()}>
              {common("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteTeamButton({ team }: { team: { id: string; name: string } }) {
  const base = useOrganizationBase();
  const t = useTranslations("teams");
  const common = useTranslations("common");
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: () => deleteTeam(team.id),
    onSuccess: () => {
      router.push(`${base}/people/teams`);
      router.refresh();
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          {common("delete")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle", { name: team.name })}</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteText")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{common("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => mutation.mutate()}
          >
            {common("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
