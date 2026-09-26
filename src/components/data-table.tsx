"use client";

import { PAGE_SIZE } from "@/utils/pagination";
import { useTranslations } from "next-intl";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, type ReactNode } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, SearchX } from "lucide-react";
import { EmptyState } from "./empty-state";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  enableFiltering?: boolean;
  enablePagination?: boolean;
  // Shown instead of the generic message when there is no data at all.
  empty?: ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  enableFiltering = false,
  enablePagination = false,
  empty,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const t = useTranslations("table");
  const pager = useTranslations("common.pager");
  // TanStack Table returns fresh functions each render; the React Compiler skips memoizing this component, which is fine here.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,

    initialState: { pagination: { pageSize: PAGE_SIZE } },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting: sorting,
      columnFilters: columnFilters,
    },
  });

  return (
    <div>
      {enableFiltering && (
        <div className="relative mb-4 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            value={(table.getColumn("index")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("index")?.setFilterValue(event.target.value)
            }
            className="pl-9"
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  {columnFilters.length > 0 ? (
                    <EmptyState icon={SearchX} title={t("noMatches")} />
                  ) : (
                    (empty ?? <EmptyState title={t("empty")} />)
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {enablePagination && table.getPageCount() > 1 && (
        <nav className="flex items-center justify-between gap-2 py-4" aria-label={pager("label")}>
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            {pager("previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {pager("page", { page: table.getState().pagination.pageIndex + 1, pages: table.getPageCount() })}
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            {pager("next")}
          </Button>
        </nav>
      )}
    </div>
  );
}
