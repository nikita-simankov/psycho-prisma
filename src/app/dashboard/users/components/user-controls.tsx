"use client";

import { deleteUserAction } from "@/actions/user/delete-user-action";
import { updateUserGroup } from "@/actions/user/update-user-group-action";
import { updateUserRole } from "@/actions/user/update-user-role-action";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { USER_GROUPS } from "@/utils/groups";
import { useMutation } from "@tanstack/react-query";
import { Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

function useAdminMutation<T>(action: (value: T) => Promise<unknown>) {
  const common = useTranslations("common");
  const router = useRouter();

  return useMutation({
    mutationFn: action,
    onSuccess: () => router.refresh(),
    onError: (error) =>
      toast({ title: common("error"), description: error.message, variant: "destructive" }),
  });
}

export function GroupSelect({ userId, group }: { userId: string; group: string }) {
  const t = useTranslations("groups");
  const mutation = useAdminMutation((value: string) => updateUserGroup(userId, value));

  return (
    <Select defaultValue={group} onValueChange={(value) => mutation.mutate(value)}>
      <SelectTrigger className="min-w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {USER_GROUPS.map((key) => (
          <SelectItem key={key} value={key}>
            {t(key)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function RoleSelect({ userId, role }: { userId: string; role: string }) {
  const t = useTranslations("roles");
  const mutation = useAdminMutation((value: string) => updateUserRole(userId, value));

  return (
    <Select defaultValue={role} onValueChange={(value) => mutation.mutate(value)}>
      <SelectTrigger className="min-w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">{t("admin")}</SelectItem>
        <SelectItem value="user">{t("user")}</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function DeleteUserButton({ userId }: { userId: string }) {
  const t = useTranslations("people.delete");
  const common = useTranslations("common");
  const mutation = useAdminMutation(() => deleteUserAction(userId));

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="text-red-500" aria-label={t("title")}>
          <Trash className="w-5 h-5 text-red-500" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost">{common("cancel")}</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={() => mutation.mutate(undefined)}>
              {t("confirm")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
