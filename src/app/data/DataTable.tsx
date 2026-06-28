"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

import { cn } from "../../utils";
import { Checkbox } from "../../ui/checkbox";
import { Skeleton } from "../../ui/skeleton";
import { EmptyState } from "../surfaces/EmptyState";

/**
 * Table layout — owned by this component, not shared app-classes tokens.
 * Sits flat with no background card behind it, matching the clean minimal style.
 */
const shellClass = "w-full";

const tableClass = "w-full border-separate border-spacing-0 bg-transparent text-sm";

/** Defined header band — anchors the column labels above the data. */
const headRowClass = "";

const headCellClass =
  "bg-gradient-to-b from-white to-[#F9FAFB] dark:from-[#1F242F] dark:to-[#10121C] border-t border-b border-border px-4 py-2.5 text-left text-xs font-medium text-muted-foreground/90 first:rounded-l-lg first:border-l last:rounded-r-lg last:border-r shadow-skeuomorphic-bordered";

const bodyCellClass =
  "border-b border-border/40 bg-transparent px-4 py-4 text-foreground";

const rowClass =
  "bg-transparent transition-colors hover:bg-muted/20 data-[clickable=true]:cursor-pointer data-[selected=true]:bg-primary/[0.04]";

const footCellClass =
  "border-t border-border/40 bg-transparent px-4 py-3 text-xs text-muted-foreground";

const footInnerClass = "flex flex-wrap items-center gap-2";

const emptyCellClass = "bg-transparent px-4 py-10 text-center text-sm text-muted-foreground";

const sortButtonClass =
  "group inline-flex min-w-0 items-center gap-1.5 rounded-md -mx-1 px-1 py-0.5 text-left font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/10";

const stickyHeadClass =
  "sticky top-0 z-[1] bg-background/95 shadow-[0_1px_0_0_hsl(var(--border)/0.4)] backdrop-blur-sm";

const selectCellClass = "w-10 px-4 py-4 align-middle";

const pagerButtonClass =
  "inline-flex size-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/10";

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
  /** Ellipsis-overflow long cell content inside the column. */
  truncate?: boolean;
}

export interface DataTableProps<T> {
  /** Column definitions. Each has an `id`, a `header`, and a `cell(row)` renderer. */
  columns: DataTableColumn<T>[];
  /** The data array. Note: the prop is `rows` (not `data`). */
  rows: T[];
  /** Stable key per row (required) — e.g. `(row) => row.id`. Drives selection + React keys. */
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
  /**
   * Render shaped skeleton rows instead of data — for async loads. Keeps the
   * header and chrome so the table doesn't jump when data arrives.
   */
  loading?: boolean;
  /** Skeleton row count while `loading`. Default: `pageSize ?? 5`. */
  loadingRows?: number;
  /**
   * Enable a leading checkbox column for multi-row selection (bulk actions).
   * Controlled via `selectedKeys` + `onSelectionChange`, or uncontrolled with
   * `defaultSelectedKeys`. Keys are produced by `getRowKey`.
   */
  selectable?: boolean;
  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  /** Accessible label for the select-all checkbox. Default: "Select all rows". */
  selectAllAriaLabel?: string;
  /**
   * Rows per page. When set, the table paginates client-side and renders a
   * pager in the footer. Omit for a single, unpaginated list.
   */
  pageSize?: number;
  /** Controlled current page (0-based). */
  pageIndex?: number;
  defaultPageIndex?: number;
  onPageChange?: (pageIndex: number) => void;
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

/**
 * Sortable, optionally selectable + paginated data table. Place it **directly**
 * on a `Page` / `Section` — never inside a `Card` (it owns its own chrome).
 *
 * The data prop is `rows` (not `data`), and `getRowKey` is required.
 *
 * @example
 * ```tsx
 * type Order = { id: string; customer: string; status: string };
 * const columns: DataTableColumn<Order>[] = [
 *   { id: "customer", header: "Customer", cell: (r) => r.customer, sortable: true, sortValue: (r) => r.customer },
 *   { id: "status", header: "Status", cell: (r) => <StatusBadge tone={r.status === "Paid" ? "success" : "warn"}>{r.status}</StatusBadge> },
 * ];
 * <DataTable columns={columns} rows={orders} getRowKey={(r) => r.id} defaultSort={{ columnId: "customer", direction: "asc" }} />
 * ```
 */
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
  loading = false,
  loadingRows,
  selectable = false,
  selectedKeys: selectedKeysProp,
  defaultSelectedKeys,
  onSelectionChange,
  selectAllAriaLabel = "Select all rows",
  pageSize,
  pageIndex: pageIndexProp,
  defaultPageIndex = 0,
  onPageChange,
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

  const [uncontrolledSelected, setUncontrolledSelected] = useState<string[]>(
    defaultSelectedKeys ?? [],
  );
  const isSelectionControlled = selectedKeysProp !== undefined;
  const selectedKeys = isSelectionControlled
    ? selectedKeysProp!
    : uncontrolledSelected;
  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const setSelected = (next: string[]) => {
    if (!isSelectionControlled) {
      setUncontrolledSelected(next);
    }
    onSelectionChange?.(next);
  };

  const [uncontrolledPage, setUncontrolledPage] = useState(defaultPageIndex);
  const isPageControlled = pageIndexProp !== undefined;
  const rawPageIndex = isPageControlled ? pageIndexProp! : uncontrolledPage;

  const setPage = (next: number) => {
    if (!isPageControlled) {
      setUncontrolledPage(next);
    }
    onPageChange?.(next);
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

  const paginated = typeof pageSize === "number" && pageSize > 0;
  const pageCount = paginated
    ? Math.max(1, Math.ceil(sortedRows.length / pageSize!))
    : 1;
  const pageIndex = Math.min(Math.max(0, rawPageIndex), pageCount - 1);

  // Snap an out-of-range uncontrolled page back into bounds (e.g. after a filter).
  useEffect(() => {
    if (!paginated || isPageControlled) return;
    if (uncontrolledPage > pageCount - 1) {
      setUncontrolledPage(pageCount - 1);
    }
  }, [paginated, isPageControlled, uncontrolledPage, pageCount]);

  const visibleRows = useMemo(() => {
    if (!paginated) return sortedRows;
    const start = pageIndex * pageSize!;
    return sortedRows.slice(start, start + pageSize!);
  }, [paginated, sortedRows, pageIndex, pageSize]);

  const cellPad = dense ? "px-3 py-2" : undefined;
  const headPad = dense ? "px-3 py-2" : undefined;
  const colSpan = columns.length + (selectable ? 1 : 0);

  if (!loading && rows.length === 0 && emptyMode === "replace") {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} className={className} />
    );
  }

  const allKeys = sortedRows.map(getRowKey);
  const allSelected =
    allKeys.length > 0 && allKeys.every((k) => selectedSet.has(k));
  const headerCheckedState: boolean | "indeterminate" = allSelected
    ? true
    : selectedSet.size > 0
      ? "indeterminate"
      : false;

  const toggleAll = () => {
    if (allSelected) {
      setSelected([]);
    } else {
      setSelected(allKeys);
    }
  };

  const toggleRow = (key: string) => {
    const next = new Set(selectedSet);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelected([...next]);
  };

  const rowCountText =
    rowCountLabel?.(sortedRows.length) ??
    `${sortedRows.length} row${sortedRows.length === 1 ? "" : "s"}`;

  const hasPager = paginated && !loading && sortedRows.length > 0;
  const hasFoot =
    (showRowCount || footer || hasPager) && (loading || sortedRows.length > 0);

  const skeletonCount = loadingRows ?? pageSize ?? 5;

  return (
    <div className={cn("aui-app-data-table", shellClass, className)}>
      <div className="overflow-x-auto">
        <table className={tableClass}>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className={cn(headRowClass, stickyHeader && stickyHeadClass)}>
            <tr>
              {selectable ? (
                <th scope="col" className={cn(selectCellClass, headPad)}>
                  <Checkbox
                    checked={headerCheckedState}
                    onCheckedChange={toggleAll}
                    aria-label={selectAllAriaLabel}
                    disabled={loading || allKeys.length === 0}
                  />
                </th>
              ) : null}
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
            {loading ? (
              Array.from({ length: skeletonCount }).map((_, rowIdx) => (
                <tr key={`skeleton-${rowIdx}`} className={rowClass} aria-hidden>
                  {selectable ? (
                    <td className={cn(selectCellClass, cellPad)}>
                      <Skeleton className="size-4 rounded-[4px]" />
                    </td>
                  ) : null}
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
                      <Skeleton className="h-4 w-[60%]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : visibleRows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className={emptyCellClass}>
                  <div className="flex flex-col items-center gap-1">
                    <p className="font-medium text-foreground">{emptyTitle}</p>
                    {emptyDescription ? (
                      <p className="max-w-sm text-muted-foreground">{emptyDescription}</p>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => {
                const key = getRowKey(row);
                const isSelected = selectedSet.has(key);
                return (
                  <tr
                    key={key}
                    className={rowClass}
                    data-clickable={onRowClick ? "true" : undefined}
                    data-selected={isSelected ? "true" : undefined}
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
                    {selectable ? (
                      <td
                        className={cn(selectCellClass, cellPad)}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(key)}
                          aria-label={`Select row`}
                        />
                      </td>
                    ) : null}
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={cn(
                          bodyCellClass,
                          cellPad,
                          col.truncate && "max-w-0",
                          col.align && alignClass[col.align],
                          col.className,
                        )}
                      >
                        {col.truncate ? (
                          <div className="truncate">{col.cell(row)}</div>
                        ) : (
                          col.cell(row)
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
          {hasFoot ? (
            <tfoot>
              <tr>
                <td colSpan={colSpan} className={footCellClass}>
                  <div
                    className={cn(
                      footInnerClass,
                      (showRowCount || footer || hasPager) && "justify-between",
                    )}
                  >
                    <div className={footInnerClass}>
                      {showRowCount ? (
                        <span>
                          {rowCountText}
                          {selectable && selectedSet.size > 0
                            ? ` · ${selectedSet.size} selected`
                            : null}
                        </span>
                      ) : selectable && selectedSet.size > 0 ? (
                        <span>{selectedSet.size} selected</span>
                      ) : null}
                      {footer}
                    </div>
                    {hasPager ? (
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums">
                          {pageIndex * pageSize! + 1}–
                          {Math.min(
                            (pageIndex + 1) * pageSize!,
                            sortedRows.length,
                          )}{" "}
                          of {sortedRows.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className={pagerButtonClass}
                            onClick={() => setPage(pageIndex - 1)}
                            disabled={pageIndex <= 0}
                            aria-label="Previous page"
                          >
                            <ChevronLeftIcon className="size-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className={pagerButtonClass}
                            onClick={() => setPage(pageIndex + 1)}
                            disabled={pageIndex >= pageCount - 1}
                            aria-label="Next page"
                          >
                            <ChevronRightIcon className="size-4" aria-hidden />
                          </button>
                        </div>
                      </div>
                    ) : null}
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
