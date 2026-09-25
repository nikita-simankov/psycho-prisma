"use client";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/ui/user-avatar";
import { formatFullName, type PublicUser } from "@/utils/user";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo } from "react";
import { DeleteUserButton, GroupSelect, RoleSelect } from "./user-controls";

type Mode = "manage" | "reports";

// People list. "manage" edits group and role; "reports" links to each person's report.
export function UsersTable({ users, mode = "manage" }: { users: PublicUser[]; mode?: Mode }) {
  const t = useTranslations("profile.fields");
  const people = useTranslations("people");

  const columns = useMemo<ColumnDef<PublicUser>[]>(() => {
    const base: ColumnDef<PublicUser>[] = [
      {
        id: "index",
        header: t("fullName"),
        cell: ({ row }) => (
          <Link
            href={`/dashboard/users/${row.original.id}`}
            className="flex min-w-48 items-center gap-3 font-medium hover:text-primary"
          >
            <UserAvatar user={row.original} className="h-8 w-8" />
            {formatFullName(row.original)}
          </Link>
        ),
        filterFn: (row, _columnId, filterValue: string) =>
          formatFullName(row.original).toLowerCase().includes(filterValue.toLowerCase()),
      },
      { header: t("position"), accessorKey: "position" },
      { header: t("department"), accessorKey: "department" },
      {
        header: t("group"),
        cell: ({ row }) => <GroupSelect userId={row.original.id} group={row.original.group} />,
      },
    ];

    if (mode === "reports") {
      return [
        ...base,
        {
          id: "report",
          header: "",
          cell: ({ row }) => (
            <Button size="sm" variant="outline" asChild>
              <Link
                href={`/dashboard/summary/${row.original.id}`}
                className="flex flex-row items-center gap-2"
              >
                {people("openReport")}
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
          ),
        },
      ];
    }

    return [
      ...base,
      {
        header: t("role"),
        cell: ({ row }) => <RoleSelect userId={row.original.id} role={row.original.role} />,
      },
      {
        id: "delete",
        header: "",
        cell: ({ row }) => <DeleteUserButton userId={row.original.id} />,
      },
    ];
  }, [mode, t, people]);

  return <DataTable columns={columns} data={users} enableFiltering />;
}
