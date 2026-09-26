"use client";

import { DataTable } from "@/components/data-table";
import { FlagBadge } from "@/components/flag-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/ui/user-avatar";
import { formatFullName, type Member } from "@/utils/user";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo } from "react";
import { useOrganizationBase } from "@/components/organization-provider";

type Mode = "manage" | "reports";

// People in the organization. "manage" shows roles; "reports" links to each person's report.
// Changes happen on the person's page, never inline, so nothing changes by a stray click.
export function UsersTable({ users, mode = "manage" }: { users: Member[]; mode?: Mode }) {
  const base = useOrganizationBase();
  const t = useTranslations("profile.fields");
  const people = useTranslations("people");
  const roles = useTranslations("roles");

  const columns = useMemo<ColumnDef<Member>[]>(() => {
    const shared: ColumnDef<Member>[] = [
      {
        id: "index",
        header: t("fullName"),
        cell: ({ row }) => (
          <Link
            href={`${base}/people/${row.original.id}`}
            className="flex min-w-48 items-center gap-3 font-medium hover:text-primary"
          >
            <UserAvatar user={row.original} className="h-8 w-8" />
            <span className="flex flex-col">
              <span className="inline-flex flex-wrap items-center gap-2">
                {formatFullName(row.original)}
                <FlagBadge flag={row.original.flag} />
              </span>
              <span className="text-xs font-normal text-muted-foreground">{row.original.email ?? row.original.phoneNumber}</span>
            </span>
          </Link>
        ),
        filterFn: (row, _columnId, filterValue: string) =>
          [formatFullName(row.original), row.original.email ?? "", row.original.department]
            .join(" ")
            .toLowerCase()
            .includes(filterValue.toLowerCase()),
      },
      { header: t("position"), accessorKey: "position" },
      { header: t("team"), accessorKey: "department" },
    ];

    if (mode === "reports") {
      return [
        ...shared,
        {
          id: "report",
          header: "",
          cell: ({ row }) => (
            <Button size="sm" variant="outline" asChild>
              <Link href={`${base}/reports/${row.original.id}`} className="flex flex-row items-center gap-2">
                {people("openReport")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          ),
        },
      ];
    }

    return [
      ...shared,
      {
        header: t("role"),
        cell: ({ row }) => (
          <Badge variant={row.original.role === "member" ? "outline" : "secondary"}>{roles(row.original.role)}</Badge>
        ),
      },
    ];
  }, [base, mode, t, people, roles]);

  return <DataTable columns={columns} data={users} enableFiltering enablePagination />;
}
