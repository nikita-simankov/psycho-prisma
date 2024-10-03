"use client";

import { updateUserGroup } from "@/actions/user/update-user-group-action";
import { DataTable } from "@/components/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import React from "react";

export const usersTableColumns: ColumnDef<User>[] = [
  {
    header: " ",
    cell: ({ row }) => {
      return (
        <Avatar>
          <AvatarImage src={row.original.imageURL}/>
          <AvatarFallback>
            {row.original.lastName[0] + row.original.name[0]}
          </AvatarFallback>
        </Avatar>
      );
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
          </SelectContent>
        </Select>
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
