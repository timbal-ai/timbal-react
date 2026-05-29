"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";

import { cn } from "../../utils";
import { EmptyState } from "../surfaces/EmptyState";

/** Table layout — owned by this component, not shared app-classes tokens. */
const shellClass =
  "overflow-hidden rounded-xl border border-border bg-card shadow-card";

const tableClass = "w-full border-collapse bg-transparent text-sm";

const headCellClass =
  "border-b border-border/60 bg-transparent px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground";

const bodyCellClass =
  "border-b border-border/40 bg-transparent px-4 py-2.5 text-foreground";

const rowClass =
  "bg-transparent transition-colors hover:bg-foreground/[0.03] data-[clickable=true]:cursor-pointer";

const footCellClass =
  "border-t border-border/60 bg-transparent px-4 py-2.5 text-xs text-muted-foreground";

const footInnerClass = "flex flex-wrap items-center gap-2";

const emptyCellClass = "bg-transparent px-4 py-10 text-center text-sm text-muted-foreground";

const sortButtonClass =
  "group inline-flex min-w-0 items-center gap-1.5 rounded-md -mx-1 px-1 py-0.5 text-left font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/10";

const stickyHeadClass =
  "sticky top-0 z-[1] bg-card/95 shadow-[0_1px_0_0_hsl(var(--border)/0.5)] backdrop-blur-sm [&_th]:bg-card/95";

export type DataTableSortDirection = "asc" | "desc";

export interface DataTableSort {
  columnId: string;
  direction: DataTableSortDirection;
}

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  /** Value used when sorting; defaults to stringifying `cell(row)`. */
  sortValue?: (row: T) => string | number | boolean | Date | null | undefined;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  /** When `inline`, keeps the table chrome and shows an in-body empty message. */
  emptyMode?: "replace" | "inline";
  className?: string;
  sort?: DataTableSort | null;
  defaultSort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort | null) => void;
  showRowCount?: boolean;
  rowCountLabel?: (count: number) => ReactNode;
  footer?: ReactNode;
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
  dense?: boolean;
  caption?: string;
}

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

function compareSortValues(
  a: string | number | boolean | Date | null | undefined,
  b: string | number | boolean | Date | null | undefined,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a).localeCompare(String(b), undefined, { sensitivity: "base" });
}

function nextSort(
  current: DataTableSort | null | undefined,
  columnId: string,
): DataTableSort | null {
  if (current?.columnId !== columnId) {
    return { columnId, direction: "asc" };
  }
  if (current.direction === "asc") {
    return { columnId, direction: "desc" };
  }
  return null;
}

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction?: DataTableSortDirection;
}) {
  const iconClass = "size-3.5 shrink-0 opacity-60 group-hover:opacity-100";
  if (!active) {
    return <ArrowUpDownIcon className={iconClass} aria-hidden />;
  }
  if (direction === "desc") {
    return <ArrowDownIcon className={iconClass} aria-hidden />;
  }
  return <ArrowUpIcon className={iconClass} aria-hidden />;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyTitle = "No data",
  emptyDescription,
  emptyMode = "replace",
  className,
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  showRowCount = false,
  rowCountLabel,
  footer,
  onRowClick,
  stickyHeader = false,
  dense = false,
  caption,
}: DataTableProps<T>) {
  const [uncontrolledSort, setUncontrolledSort] = useState<DataTableSort | null>(
    defaultSort,
  );
  const isSortControlled = sortProp !== undefined;
  const sort = isSortControlled ? sortProp : uncontrolledSort;

  const setSort = (next: DataTableSort | null) => {
    if (!isSortControlled) {
      setUncontrolledSort(next);
    }
    onSortChange?.(next);
  };

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((col) => col.id === sort.columnId);
    if (!column?.sortable) return rows;

    const getValue =
      column.sortValue ??
      ((row: T) => {
        const rendered = column.cell(row);
        if (
          rendered === null ||
          rendered === undefined ||
          typeof rendered === "string" ||
          typeof rendered === "number" ||
          typeof rendered === "boolean"
        ) {
          return rendered;
        }
        return String(rendered);
      });

    return [...rows].sort((a, b) => {
      const cmp = compareSortValues(getValue(a), getValue(b));
      return sort.direction === "asc" ? cmp : -cmp;
    });
  }, [columns, rows, sort]);

  const cellPad = dense ? "px-3 py-2" : undefined;
  const headPad = dense ? "px-3 py-2" : undefined;

  if (rows.length === 0 && emptyMode === "replace") {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} className={className} />
    );
  }

  const rowCountText =
    rowCountLabel?.(sortedRows.length) ??
    `${sortedRows.length} row${sortedRows.length === 1 ? "" : "s"}`;

  const hasFoot = Boolean((showRowCount || footer) && sortedRows.length > 0);

  return (
    <div className={cn("aui-app-data-table", shellClass, className)}>
      <div className="overflow-x-auto">
        <table className={tableClass}>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className={cn(stickyHeader && stickyHeadClass)}>
            <tr>
              {columns.map((col) => {
                const isSorted = sort?.columnId === col.id;
                const ariaSort = col.sortable
                  ? isSorted
                    ? sort!.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                  : undefined;

                const headerContent = col.sortable ? (
                  <button
                    type="button"
                    className={sortButtonClass}
                    onClick={() => setSort(nextSort(sort, col.id))}
                  >
                    <span className="truncate">{col.header}</span>
                    <SortIndicator active={Boolean(isSorted)} direction={sort?.direction} />
                  </button>
                ) : (
                  col.header
                );

                return (
                  <th
                    key={col.id}
                    scope="col"
                    aria-sort={ariaSort}
                    className={cn(
                      headCellClass,
                      headPad,
                      col.align && alignClass[col.align],
                      col.headerClassName,
                    )}
                  >
                    {headerContent}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className={cn(!hasFoot && "[&_tr:last-child_td]:border-b-0")}>
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={emptyCellClass}>
                  <div className="flex flex-col items-center gap-1">
                    <p className="font-medium text-foreground">{emptyTitle}</p>
                    {emptyDescription ? (
                      <p className="max-w-sm text-muted-foreground">{emptyDescription}</p>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className={rowClass}
                  data-clickable={onRowClick ? "true" : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? "button" : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        bodyCellClass,
                        cellPad,
                        col.align && alignClass[col.align],
                        col.className,
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {hasFoot ? (
            <tfoot>
              <tr>
                <td colSpan={columns.length} className={footCellClass}>
                  <div
                    className={cn(
                      footInnerClass,
                      showRowCount && footer ? "justify-between" : "justify-start",
                    )}
                  >
                    {showRowCount ? <span>{rowCountText}</span> : null}
                    {footer}
                  </div>
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}
