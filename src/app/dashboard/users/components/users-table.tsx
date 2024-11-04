"use client";

import { deleteUserAction } from "@/actions/user/delete-user-action";
import { updateUserGroup } from "@/actions/user/update-user-group-action";
import { updateUserRole } from "@/actions/user/update-user-role-action";
import { DataTable } from "@/components/data-table";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UserAvatar from "@/components/ui/user-avatar";
import { User } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export const usersTableColumns: ColumnDef<User>[] = [
  {
    header: " ",
    cell: ({ row }) => {
      return <UserAvatar user={row.original!} />;
    },
  },
  {
    header: "ФИО Военнослужащего",
    cell: ({ row }) => {
      return (
        row.original.lastName +
        " " +
        row.original.name +
        " " +
        row.original.surname
      );
    },
  },
  {
    header: "Воинское звание",
    cell: ({ row }) => {
      return row.original.rank;
    },
  },
  {
    header: "Подразделение",
    cell: ({ row }) => {
      return row.original.division;
    },
  },
  {
    header: "Вид службы",
    cell: ({ row }) => {
      return row.original.servingKind;
    },
  },
  {
    header: "Группа",
    cell: ({ row }) => {
      const updateGroupMutation = useMutation({
        mutationFn: (group: string) => updateUserGroup(row.original.id, group),
      });

      return (
        <Select
          onValueChange={(selection) => updateGroupMutation.mutate(selection)}
        >
          <SelectTrigger>
            <SelectValue placeholder={row.original.group} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={"Общая группа"}>Общая группа</SelectItem>
            <SelectItem value={"Группа риска"}>Группа риска</SelectItem>
            <SelectItem value={"Группа суицидального риска"}>
              Группа суицидального риска
            </SelectItem>
            <SelectItem value={"Группа динамического риска"}>
              Группа динамического наблюдения
            </SelectItem>
            <SelectItem value="Группа риска наркотизации">
              Группа риска наркотизации
            </SelectItem>
          </SelectContent>
        </Select>
      );
    },
  },
  {
    header: "Привилегии",
    cell: ({ row }) => {
      const updateRoleMutaiton = useMutation({
        mutationFn: (role: string) => updateUserRole(row.original.id, role),
      });

      return (
        <Select
          onValueChange={(selection) => updateRoleMutaiton.mutate(selection)}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                row.original.role === "user" ? "Пользователь" : "Администратор"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={"admin"}>Администратор</SelectItem>
            <SelectItem value={"user"}>Пользователь</SelectItem>
          </SelectContent>
        </Select>
      );
    },
  },
  {
    header: " ",
    cell: ({ row }) => {
      const router = useRouter();
      const deleteUserMutation = useMutation({
        mutationFn: () => deleteUserAction(row.original.id),
        onSuccess: () => router.refresh(),
      });

      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="text-red-500">
              <Trash className="w-5 h-5 text-red-500 " />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
              <AlertDialogDescription>
                После удаления, данные не подлежат восстановлению
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="ghost">Отмена</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  variant="destructive"
                  onClick={() => deleteUserMutation.mutate()}
                >
                  Удалить пользователя
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
  },
];

interface Properties {
  users: User[];
}

export const UsersTable: React.FC<Properties> = ({ users }) => {
  return <DataTable columns={usersTableColumns} data={users} />;
};
