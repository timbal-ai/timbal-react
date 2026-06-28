"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronRightIcon, ListFilterIcon, XIcon } from "lucide-react";

import { cn } from "../../utils";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { appSearchInputClass } from "../../design/app-classes";
import { controlClass } from "../../design/control-surface";
import { SearchInput } from "../forms/SearchInput";

// ── Field configuration (data-driven — adapts to the actual table) ────────────

export type FilterFieldType = "multiselect" | "text" | "daterange" | "numeric";

export type NumericOperator = "gt" | "lt" | "eq";

export interface FilterSelectOption {
  /** Stable value stored in the filter state. */
  value: string;
  /** Visible label. */
  label: string;
  /** Optional leading node (avatar, swatch, status dot). */
  icon?: ReactNode;
  /** Optional secondary text (e.g. an email under a name). */
  hint?: string;
}

export interface FilterDatePreset {
  id: string;
  label: string;
  /** Optional right-aligned hint (e.g. a resolved date range). */
  hint?: string;
}

export interface FilterNumericOperatorOption {
  id: NumericOperator;
  label: string;
}

/** One filterable facet — describe your table's columns with these. */
export interface FilterFieldDef {
  /** Stable key; the field's value is stored under this id in `FilterValues`. */
  id: string;
  /** Menu label (use the column's name). */
  label: string;
  type: FilterFieldType;
  /** Leading icon in the menu row. */
  icon?: ReactNode;
  /** `multiselect` options. */
  options?: FilterSelectOption[];
  /** `multiselect` search box — defaults on when there are more than 8 options. */
  searchable?: boolean;
  /** Placeholder for the `multiselect` search box. */
  searchPlaceholder?: string;
  /** Placeholder for `text` / `numeric` inputs. */
  placeholder?: string;
  /** `daterange` presets — defaults to a sensible relative set. */
  presets?: FilterDatePreset[];
  /** `numeric` operators — defaults to greater/less/equals. */
  operators?: FilterNumericOperatorOption[];
}

// ── Value model (keyed by field id; shape follows the field's type) ───────────

export interface FilterDateRangeValue {
  preset: string | null;
  from?: string;
  to?: string;
}

export interface FilterNumericValue {
  operator: NumericOperator;
  value: string;
}

/** A single field's value — shape depends on the field `type`. */
export type FilterValue =
  | string[] // multiselect → selected option values
  | string // text → query
  | FilterDateRangeValue // daterange
  | FilterNumericValue // numeric
  | null
  | undefined;

/** All active filters, keyed by field id. */
export type FilterValues = Record<string, FilterValue>;

export interface FilterDropdownProps {
  /** The filterable facets — one per column you want to filter on. */
  fields: FilterFieldDef[];
  /** Controlled value. */
  value?: FilterValues;
  /** Uncontrolled initial value. */
  defaultValue?: FilterValues;
  /** Fires with the full updated `FilterValues` whenever a facet changes. */
  onChange?: (values: FilterValues) => void;
  /** Trigger button text. Default `"Filter"`. */
  label?: string;
  /** Popover alignment. Default `"start"`. */
  align?: "start" | "center" | "end";
  /**
   * Render removable pills for the active filters next to the trigger (with a
   * "Clear all"). Default `true`. Set `false` if you render your own chips.
   */
  showActiveChips?: boolean;
  className?: string;
}

const DEFAULT_PRESETS: FilterDatePreset[] = [
  { id: "last_7_days", label: "Last 7 days" },
  { id: "last_30_days", label: "Last 30 days" },
  { id: "last_90_days", label: "Last 90 days" },
  { id: "this_month", label: "This month" },
  { id: "this_year", label: "This year" },
  { id: "custom", label: "Custom range" },
];

const DEFAULT_OPERATORS: FilterNumericOperatorOption[] = [
  { id: "gt", label: "Greater than" },
  { id: "lt", label: "Less than" },
  { id: "eq", label: "Equals" },
];

function asArray(v: FilterValue): string[] {
  return Array.isArray(v) ? v : [];
}
function asText(v: FilterValue): string {
  return typeof v === "string" ? v : "";
}
function asDate(v: FilterValue): FilterDateRangeValue {
  return v && !Array.isArray(v) && typeof v === "object" && "preset" in v
    ? (v as FilterDateRangeValue)
    : { preset: null };
}
function asNumeric(v: FilterValue): FilterNumericValue {
  return v && !Array.isArray(v) && typeof v === "object" && "operator" in v
    ? (v as FilterNumericValue)
    : { operator: "gt", value: "" };
}

const OPERATOR_SYMBOL: Record<NumericOperator, string> = {
  gt: ">",
  lt: "<",
  eq: "=",
};

export function FilterDropdown({
  fields,
  value,
  defaultValue,
  onChange,
  label = "Filter",
  align = "start",
  showActiveChips = true,
  className,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(fields[0]?.id ?? null);
  const [isMobile, setIsMobile] = useState(false);

  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<FilterValues>(defaultValue ?? {});
  const values = isControlled ? value : internal;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Keep the active sub-menu valid if the fields change.
  useEffect(() => {
    if (!fields.some((f) => f.id === activeId)) {
      setActiveId(fields[0]?.id ?? null);
    }
  }, [fields, activeId]);

  const commit = (id: string, next: FilterValue) => {
    const merged: FilterValues = { ...values, [id]: next };
    if (!isControlled) setInternal(merged);
    onChange?.(merged);
  };

  const clearAll = () => {
    if (!isControlled) setInternal({});
    onChange?.({});
  };

  const activeIdx = fields.findIndex((f) => f.id === activeId);
  const activeField = activeIdx >= 0 ? fields[activeIdx] : undefined;

  // Derive removable pills from the active values (labels resolved from config).
  const chips: { id: string; label: string; remove: () => void }[] = [];
  for (const field of fields) {
    const v = values[field.id];
    if (field.type === "multiselect") {
      const selected = asArray(v);
      for (const optionValue of selected) {
        const opt = field.options?.find((o) => o.value === optionValue);
        chips.push({
          id: `${field.id}:${optionValue}`,
          label: `${field.label}: ${opt?.label ?? optionValue}`,
          remove: () => commit(field.id, selected.filter((x) => x !== optionValue)),
        });
      }
    } else if (field.type === "text") {
      const text = asText(v);
      if (text) {
        chips.push({
          id: field.id,
          label: `${field.label}: ${text}`,
          remove: () => commit(field.id, ""),
        });
      }
    } else if (field.type === "numeric") {
      const n = asNumeric(v);
      if (n.value) {
        chips.push({
          id: field.id,
          label: `${field.label} ${OPERATOR_SYMBOL[n.operator]} ${n.value}`,
          remove: () => commit(field.id, null),
        });
      }
    } else if (field.type === "daterange") {
      const d = asDate(v);
      if (d.preset) {
        const presetLabel =
          d.preset === "custom"
            ? `${d.from || "…"} – ${d.to || "…"}`
            : ((field.presets ?? DEFAULT_PRESETS).find((p) => p.id === d.preset)?.label ??
              d.preset);
        chips.push({
          id: field.id,
          label: `${field.label}: ${presetLabel}`,
          remove: () => commit(field.id, { preset: null }),
        });
      }
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              appSearchInputClass,
              "cursor-pointer border-dashed font-medium text-muted-foreground hover:text-foreground",
            )}
          >
            <ListFilterIcon className="size-4 shrink-0" aria-hidden />
            {label}
          </button>
        </PopoverTrigger>
        <PopoverContent
          variant="list"
          align={align}
          className="overflow-visible border-none bg-transparent p-0 shadow-none max-w-[calc(100vw-32px)] md:max-w-none"
        >
          <div className="relative flex flex-col md:flex-row items-stretch md:items-start w-[calc(100vw-32px)] max-w-[340px] md:w-auto md:max-w-none">
            {/* Main menu — one row per field */}
            <div className="w-full md:w-56 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
              {fields.map((field) => {
                const isActive = activeId === field.id;
                return (
                  <button
                    key={field.id}
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-left transition-colors outline-none",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                    onMouseEnter={() => !isMobile && setActiveId(field.id)}
                    onClick={() => setActiveId(field.id)}
                  >
                    <span className="flex items-center gap-2">
                      {field.icon}
                      <span>{field.label}</span>
                    </span>
                    <ChevronRightIcon className="size-4 text-muted-foreground/50" />
                  </button>
                );
              })}
            </div>

            {/* Sub-menu — the active field's control */}
            {activeField && (
              <div
                className="relative left-0 mt-2 w-full md:absolute md:left-[calc(100%+6px)] md:w-80 rounded-xl border border-border bg-popover p-3 shadow-lg transition-all duration-150 md:mt-0"
                style={isMobile ? {} : { top: `${activeIdx * 36 + 6}px` }}
              >
                <FilterFieldControl
                  field={activeField}
                  value={values[activeField.id]}
                  onChange={(next) => commit(activeField.id, next)}
                  onClose={() => setIsOpen(false)}
                />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {showActiveChips &&
        chips.map((chip) => (
          <FilterChip key={chip.id} label={chip.label} onRemove={chip.remove} />
        ))}

      {showActiveChips && chips.length > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="rounded-full px-3 py-1 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-muted/40 pl-3 pr-1.5 text-sm font-medium text-foreground">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="flex size-5 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground"
      >
        <XIcon className="size-3.5" />
      </button>
    </span>
  );
}

function FilterFieldControl({
  field,
  value,
  onChange,
  onClose,
}: {
  field: FilterFieldDef;
  value: FilterValue;
  onChange: (next: FilterValue) => void;
  onClose: () => void;
}) {
  switch (field.type) {
    case "multiselect":
      return <MultiSelectControl field={field} value={asArray(value)} onChange={onChange} />;
    case "text":
      return (
        <TextControl field={field} value={asText(value)} onChange={onChange} onClose={onClose} />
      );
    case "daterange":
      return (
        <DateRangeControl field={field} value={asDate(value)} onChange={onChange} onClose={onClose} />
      );
    case "numeric":
      return (
        <NumericControl field={field} value={asNumeric(value)} onChange={onChange} onClose={onClose} />
      );
    default:
      return null;
  }
}

function MultiSelectControl({
  field,
  value,
  onChange,
}: {
  field: FilterFieldDef;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const options = field.options ?? [];
  const [search, setSearch] = useState("");
  const searchable = field.searchable ?? options.length > 8;

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.hint?.toLowerCase().includes(q),
    );
  }, [options, search]);

  const toggle = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue],
    );
  };

  return (
    <div className="flex flex-col gap-2.5">
      {searchable && (
        <SearchInput
          placeholder={field.searchPlaceholder ?? "Search…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full min-w-0"
        />
      )}
      <div className="flex max-h-48 flex-col gap-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">No options found</p>
        ) : (
          filtered.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
            >
              <Checkbox
                checked={value.includes(option.value)}
                onCheckedChange={() => toggle(option.value)}
              />
              {option.icon}
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{option.label}</span>
                {option.hint && (
                  <span className="truncate text-xs text-muted-foreground">{option.hint}</span>
                )}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

function TextControl({
  field,
  value,
  onChange,
  onClose,
}: {
  field: FilterFieldDef;
  value: string;
  onChange: (next: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <div className="flex flex-col gap-2.5">
      <input
        type="text"
        placeholder={field.placeholder ?? "Type a value…"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onChange(draft);
            onClose();
          }
        }}
        className={controlClass({ size: "sm" }, "w-full")}
      />
      <ApplyClear
        onClear={() => {
          setDraft("");
          onChange("");
          onClose();
        }}
        onApply={() => {
          onChange(draft);
          onClose();
        }}
      />
    </div>
  );
}

function DateRangeControl({
  field,
  value,
  onChange,
  onClose,
}: {
  field: FilterFieldDef;
  value: FilterDateRangeValue;
  onChange: (next: FilterDateRangeValue) => void;
  onClose: () => void;
}) {
  const presets = field.presets ?? DEFAULT_PRESETS;
  const [from, setFrom] = useState(value.from ?? "");
  const [to, setTo] = useState(value.to ?? "");

  return (
    <div className="flex flex-col gap-1">
      {presets.map((preset) => {
        const isSelected = value.preset === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              if (preset.id === "custom") {
                onChange({ preset: "custom", from, to });
              } else {
                onChange({ preset: preset.id });
                onClose();
              }
            }}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors outline-none",
              isSelected
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            <span>{preset.label}</span>
            {preset.hint && (
              <span className="text-xs text-muted-foreground/70">{preset.hint}</span>
            )}
          </button>
        );
      })}

      {value.preset === "custom" && (
        <div className="mt-2 flex flex-col gap-2 border-t border-border/40 pt-2">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={controlClass({ size: "sm" }, "w-full text-xs")}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={controlClass({ size: "sm" }, "w-full text-xs")}
            />
          </div>
          <div className="flex justify-end">
            <Button
              color="primary"
              size="sm"
              className="h-8 px-3"
              onClick={() => {
                onChange({ preset: "custom", from, to });
                onClose();
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function NumericControl({
  field,
  value,
  onChange,
  onClose,
}: {
  field: FilterFieldDef;
  value: FilterNumericValue;
  onChange: (next: FilterNumericValue | null) => void;
  onClose: () => void;
}) {
  const operators = field.operators ?? DEFAULT_OPERATORS;
  const [operator, setOperator] = useState<NumericOperator>(value.operator);
  const [draft, setDraft] = useState(value.value);
  useEffect(() => {
    setOperator(value.operator);
    setDraft(value.value);
  }, [value.operator, value.value]);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <Select value={operator} onValueChange={(v) => setOperator(v as NumericOperator)}>
          <SelectTrigger size="sm" className="shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operators.map((op) => (
              <SelectItem key={op.id} value={op.id}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="text"
          inputMode="decimal"
          placeholder={field.placeholder ?? "0.00"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onChange(draft ? { operator, value: draft } : null);
              onClose();
            }
          }}
          className={controlClass({ size: "sm" }, "min-w-0 flex-1")}
        />
      </div>
      <ApplyClear
        onClear={() => {
          setDraft("");
          onChange(null);
          onClose();
        }}
        onApply={() => {
          onChange(draft ? { operator, value: draft } : null);
          onClose();
        }}
      />
    </div>
  );
}

function ApplyClear({ onClear, onApply }: { onClear: () => void; onApply: () => void }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="h-8 px-3 text-muted-foreground hover:text-foreground"
      >
        Clear
      </Button>
      <Button color="primary" size="sm" onClick={onApply} className="h-8 px-3">
        Apply
      </Button>
    </div>
  );
}
