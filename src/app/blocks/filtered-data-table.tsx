"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK · FilteredDataTable
// Search box + faceted FilterDropdown + sortable DataTable, with all the
// search/filter wiring done for you. `DataTable` still owns sort + pagination.
//
// Forkable: this file is intentionally thin. Copy it and adapt the matchers if
// you need bespoke filter semantics. Source: src/app/blocks/filtered-data-table.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState, type ReactNode } from "react";

import { cn } from "../../utils";
import { FilterBar } from "../data/FilterBar";
import { DataTable, type DataTableProps } from "../data/DataTable";
import {
  FilterDropdown,
  type FilterDateRangeValue,
  type FilterFieldDef,
  type FilterNumericValue,
  type FilterValue,
  type FilterValues,
} from "../data/FilterDropdown";
import { SearchInput } from "../forms/SearchInput";

/** Comparable a row can yield for a filter field (multiselect may yield many). */
export type FilterCompareValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | string[];

export interface FilteredDataTableProps<T>
  extends Omit<DataTableProps<T>, "rows"> {
  /** Full, unfiltered dataset. The block filters, then hands the result to `DataTable`. */
  rows: T[];
  // ── Search ──
  /** Provide a predicate to render the search box. */
  searchPredicate?: (row: T, query: string) => boolean;
  searchPlaceholder?: string;
  // ── Faceted filters ──
  filterFields?: FilterFieldDef[];
  defaultFilters?: FilterValues;
  filters?: FilterValues;
  onFiltersChange?: (values: FilterValues) => void;
  /** Map a row → comparable value for a filter field id (by `field.type`). */
  getFilterValue?: (row: T, fieldId: string) => FilterCompareValue;
  /** Reference "now" for relative date presets (tests/determinism). Default: `new Date()`. */
  filterReferenceDate?: Date;
  /** Extra controls appended to the filter toolbar (e.g. a "New" button). */
  toolbarEnd?: ReactNode;
  /** Class for the wrapping `<div>` (the table keeps its own `className`). */
  containerClassName?: string;
}

function matchesNumeric(value: number, cond: FilterNumericValue): boolean {
  const target = parseFloat(cond.value);
  if (Number.isNaN(target)) return true;
  if (cond.operator === "gt") return value > target;
  if (cond.operator === "lt") return value < target;
  return value === target;
}

function matchesDate(
  dateStr: string,
  range: FilterDateRangeValue,
  ref: Date,
): boolean {
  if (!range.preset) return true;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return true;
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const since = (days: number) => {
    const start = new Date(ref);
    start.setDate(ref.getDate() - days);
    return date >= start && date <= ref;
  };
  switch (range.preset) {
    case "last_7_days":
      return since(7);
    case "last_30_days":
      return since(30);
    case "last_90_days":
      return since(90);
    case "this_month":
      return date >= new Date(year, month, 1) && date <= new Date(year, month + 1, 0);
    case "this_year":
      return date >= new Date(year, 0, 1) && date <= new Date(year, 11, 31);
    case "custom": {
      const from = range.from ? new Date(range.from) : null;
      const to = range.to ? new Date(range.to) : null;
      if (from && date < from) return false;
      if (to && date > to) return false;
      return true;
    }
    default:
      return true;
  }
}

function matchesField(
  field: FilterFieldDef,
  value: FilterValue,
  rowValue: FilterCompareValue,
  ref: Date,
): boolean {
  switch (field.type) {
    case "multiselect": {
      const selected = Array.isArray(value) ? value : [];
      if (selected.length === 0) return true;
      const rowVals = Array.isArray(rowValue)
        ? rowValue.map(String)
        : [String(rowValue ?? "")];
      return selected.some((s) => rowVals.includes(s));
    }
    case "text": {
      const query = typeof value === "string" ? value.trim().toLowerCase() : "";
      if (!query) return true;
      return String(rowValue ?? "").toLowerCase().includes(query);
    }
    case "numeric": {
      const numeric =
        value && !Array.isArray(value) && typeof value === "object" && "operator" in value
          ? (value as FilterNumericValue)
          : null;
      if (!numeric?.value) return true;
      const num = typeof rowValue === "number" ? rowValue : Number(rowValue);
      if (Number.isNaN(num)) return true;
      return matchesNumeric(num, numeric);
    }
    case "daterange": {
      const range =
        value && !Array.isArray(value) && typeof value === "object" && "preset" in value
          ? (value as FilterDateRangeValue)
          : null;
      if (!range?.preset) return true;
      return matchesDate(String(rowValue ?? ""), range, ref);
    }
    default:
      return true;
  }
}

/**
 * Searchable, filterable, sortable table. Drop it on a `Page`/`Section`.
 *
 * ```tsx
 * <FilteredDataTable
 *   rows={accounts}
 *   getRowKey={(r) => r.id}
 *   columns={columns}
 *   searchPlaceholder="Search customers…"
 *   searchPredicate={(r, q) => r.name.toLowerCase().includes(q.toLowerCase())}
 *   filterFields={[{ id: "plan", label: "Plan", type: "multiselect", options }]}
 *   getFilterValue={(r, id) => (id === "plan" ? r.plan : undefined)}
 *   pageSize={10}
 * />
 * ```
 */
export function FilteredDataTable<T>({
  rows,
  searchPredicate,
  searchPlaceholder = "Search…",
  filterFields,
  defaultFilters,
  filters,
  onFiltersChange,
  getFilterValue,
  filterReferenceDate,
  toolbarEnd,
  containerClassName,
  ...dataTableProps
}: FilteredDataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [uncontrolledFilters, setUncontrolledFilters] = useState<FilterValues>(
    defaultFilters ?? {},
  );
  const isFiltersControlled = filters !== undefined;
  const activeFilters = isFiltersControlled ? filters : uncontrolledFilters;

  const setFilters = (next: FilterValues) => {
    if (!isFiltersControlled) setUncontrolledFilters(next);
    onFiltersChange?.(next);
  };

  const filtered = useMemo(() => {
    const ref = filterReferenceDate ?? new Date();
    const trimmed = query.trim();
    return rows.filter((row) => {
      if (searchPredicate && trimmed && !searchPredicate(row, trimmed)) return false;
      if (filterFields) {
        for (const field of filterFields) {
          const value = activeFilters[field.id];
          if (value == null) continue;
          const rowValue = getFilterValue?.(row, field.id);
          if (!matchesField(field, value, rowValue, ref)) return false;
        }
      }
      return true;
    });
  }, [
    rows,
    query,
    activeFilters,
    filterFields,
    getFilterValue,
    searchPredicate,
    filterReferenceDate,
  ]);

  const hasToolbar = Boolean(searchPredicate || filterFields || toolbarEnd);

  return (
    <div className={cn("flex flex-col gap-4", containerClassName)}>
      {hasToolbar ? (
        <FilterBar>
          {searchPredicate ? (
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Search"
              className="h-9"
            />
          ) : null}
          {filterFields ? (
            <FilterDropdown
              fields={filterFields}
              value={activeFilters}
              onChange={setFilters}
            />
          ) : null}
          {toolbarEnd}
        </FilterBar>
      ) : null}
      <DataTable<T> {...dataTableProps} rows={filtered} />
    </div>
  );
}
