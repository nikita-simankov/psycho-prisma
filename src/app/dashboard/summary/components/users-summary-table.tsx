"use client";

import { updateUserGroup } from "@/actions/user/update-user-group-action";
import { DataTable } from "@/components/data-table";
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
import { ArrowUpRight, Smile } from "lucide-react";
import Link from "next/link";
import React from "react";

export const usersTableColumns: ColumnDef<User>[] = [
  {
    header: " ",
    cell: ({ row }) => {
      return <UserAvatar user={row.original!} />;
    },
  },
  {
    id: "index",
    header: "ФИО",
    cell: ({ row }) => {
      return (
        row.original.lastName +
        " " +
        row.original.name +
        " " +
        row.original.surname
      );
    },
    filterFn: (row, columnId, filterValue) => {
      return row.original.lastName
        .toLowerCase()
        .includes(filterValue.toLowerCase());
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
    header: "Группа",
    cell: ({ row }) => {
      const updateGroupMutation = useMutation({
        mutationFn: (group: string) => updateUserGroup(row.original.id, group),
      });

      return row.original.group;
    },
  },
  {
    header: "  ",
    cell: ({ row }) => {
      return (
        <Link href={"/dashboard/summary/" + row.original.id}>
          <Button
            size="sm"
            variant="outline"
            className="flex flex-row items-center gap-2"
          >
            Характеристика
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      );
    },
  },
];

interface Properties {
  users: User[];
}

export const UsersSummaryTable: React.FC<Properties> = ({ users }) => {
  return <DataTable columns={usersTableColumns} data={users} enableFiltering />;
};
