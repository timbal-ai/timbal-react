"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DraggableAttributes,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";

import { cn } from "../utils";

export type KanbanTone =
  | "default"
  | "primary"
  | "success"
  | "warn"
  | "danger";
export type KanbanDensity = "default" | "compact";
export type KanbanCardVariant = "default" | "outline" | "muted" | "tonal";

export interface KanbanCardData {
  id: string;
}

export interface KanbanColumnData<C extends KanbanCardData = KanbanCardData> {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Trailing header node (e.g. an add button). */
  action?: React.ReactNode;
  /** Footer rendered under the card list (e.g. "Add card"). */
  footer?: React.ReactNode;
  tone?: KanbanTone;
  cards: C[];
}

export interface KanbanLocation {
  columnId: string;
  index: number;
}

export interface KanbanMoveEvent<C extends KanbanCardData = KanbanCardData> {
  card: C;
  cardId: string;
  from: KanbanLocation;
  to: KanbanLocation;
  /** The resulting board arrangement. */
  columns: KanbanColumnData<C>[];
}

/**
 * Spread onto any element to make it the card's drag handle (pointer + keyboard).
 * Useful for rich cards that want the handle on a custom control (e.g. a header
 * grip or an avatar) — set `dragHandle="none"` on `Kanban` to drop the default.
 */
export type KanbanDragHandleProps = DraggableAttributes &
  React.DOMAttributes<HTMLElement>;

export interface KanbanRenderCardContext<C extends KanbanCardData = KanbanCardData> {
  column: KanbanColumnData<C>;
  isDragging: boolean;
  /** True while rendering inside the floating drag overlay. */
  isOverlay: boolean;
  /** Spread onto a custom drag handle. Undefined when the board is disabled. */
  dragHandleProps?: KanbanDragHandleProps;
}

export interface KanbanProps<C extends KanbanCardData = KanbanCardData> {
  /** Controlled columns (with their cards). */
  columns?: KanbanColumnData<C>[];
  /** Uncontrolled initial columns. */
  defaultColumns?: KanbanColumnData<C>[];
  /** Fired with the full next arrangement after any move/reorder. */
  onColumnsChange?: (columns: KanbanColumnData<C>[]) => void;
  /** Fired with move details (card, from, to) after a drag completes. */
  onMove?: (event: KanbanMoveEvent<C>) => void;
  /** Render a card's body. */
  renderCard: (card: C, ctx: KanbanRenderCardContext<C>) => React.ReactNode;
  /** Override the default column header (title + count). */
  renderColumnHeader?: (column: KanbanColumnData<C>) => React.ReactNode;
  /** Resolve a stable id for a card. Default: `card.id`. */
  getCardId?: (card: C) => string;
  /** Shown inside an empty column's drop area. */
  emptyColumnLabel?: React.ReactNode;
  density?: KanbanDensity;
  cardVariant?: KanbanCardVariant;
  /**
   * Drag handle strategy. `"auto"` (default) renders a hover grip in the card's
   * top-right corner. `"none"` removes it so you can place your own handle by
   * spreading `ctx.dragHandleProps` (from `renderCard`) onto any element.
   */
  dragHandle?: "auto" | "none";
  /** Disable all drag interactions (read-only board). */
  disabled?: boolean;
  /** Accessible label for the board region. */
  "aria-label"?: string;
  className?: string;
  columnClassName?: string;
  cardClassName?: string;
}

// Tone tints the column *title* (e.g. an "In progress" column reads in blue)
// rather than boxing the whole column — keeps the board light.
const columnTitleToneClass: Record<KanbanTone, string> = {
  default: "text-foreground",
  primary: "text-blue-600 dark:text-blue-400",
  success: "text-emerald-600 dark:text-emerald-400",
  warn: "text-amber-600 dark:text-amber-400",
  danger: "text-rose-600 dark:text-rose-400",
};

const cardVariantClass: Record<Exclude<KanbanCardVariant, "tonal">, string> = {
  default:
    "border border-border/70 bg-card shadow-sm hover:border-border hover:shadow-md",
  outline: "border border-border bg-card hover:border-foreground/25",
  muted: "border border-transparent bg-muted/60 hover:bg-muted",
};

// `cardVariant="tonal"` tints each card with its column's tone — borderless, clean white, soft shadow.
const cardToneClass: Record<KanbanTone, string> = {
  default: "bg-card shadow-sm hover:shadow-md",
  primary: "bg-card shadow-sm hover:shadow-md",
  success: "bg-card shadow-sm hover:shadow-md",
  warn: "bg-card shadow-sm hover:shadow-md",
  danger: "bg-card shadow-sm hover:shadow-md",
};

function cardSurfaceClass(
  variant: KanbanCardVariant,
  tone: KanbanTone,
): string {
  return variant === "tonal" ? cardToneClass[tone] : cardVariantClass[variant];
}

const densityColumnClass: Record<KanbanDensity, string> = {
  default: "w-72 gap-2.5",
  compact: "w-64 gap-2",
};

const densityListClass: Record<KanbanDensity, string> = {
  default: "gap-2.5",
  compact: "gap-2",
};

const densityCardClass: Record<KanbanDensity, string> = {
  default: "rounded-lg p-2",
  compact: "rounded-lg p-1.5",
};

function defaultGetCardId<C extends KanbanCardData>(card: C): string {
  return card.id;
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

interface SortableCardProps<C extends KanbanCardData> {
  card: C;
  cardId: string;
  column: KanbanColumnData<C>;
  density: KanbanDensity;
  variant: KanbanCardVariant;
  disabled: boolean;
  dragHandle: "auto" | "none";
  className?: string;
  renderCard: (card: C, ctx: KanbanRenderCardContext<C>) => React.ReactNode;
}

function SortableCard<C extends KanbanCardData>({
  card,
  cardId,
  column,
  density,
  variant,
  disabled,
  dragHandle,
  className,
  renderCard,
}: SortableCardProps<C>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cardId, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const dragHandleProps = disabled
    ? undefined
    : ({ ...attributes, ...listeners } as KanbanDragHandleProps);

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-slot="kanban-card"
      data-dragging={isDragging ? "" : undefined}
      className={cn(
        "group/kanban-card relative text-sm text-foreground transition",
        densityCardClass[density],
        cardSurfaceClass(variant, column.tone ?? "default"),
        isDragging && "opacity-40",
        className,
      )}
    >
      {!disabled && dragHandle === "auto" ? (
        <button
          type="button"
          aria-label="Drag card"
          className="absolute right-1.5 top-1.5 z-10 grid size-6 cursor-grab touch-none place-items-center rounded-md text-muted-foreground/40 opacity-0 transition hover:bg-foreground/5 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 group-hover/kanban-card:opacity-100 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-4" aria-hidden />
        </button>
      ) : null}
      {renderCard(card, { column, isDragging, isOverlay: false, dragHandleProps })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column
// ---------------------------------------------------------------------------

interface KanbanColumnViewProps<C extends KanbanCardData> {
  column: KanbanColumnData<C>;
  cardIds: string[];
  density: KanbanDensity;
  cardVariant: KanbanCardVariant;
  disabled: boolean;
  dragHandle: "auto" | "none";
  emptyColumnLabel?: React.ReactNode;
  className?: string;
  cardClassName?: string;
  getCardId: (card: C) => string;
  renderColumnHeader?: (column: KanbanColumnData<C>) => React.ReactNode;
  renderCard: (card: C, ctx: KanbanRenderCardContext<C>) => React.ReactNode;
}

function KanbanColumnView<C extends KanbanCardData>({
  column,
  cardIds,
  density,
  cardVariant,
  disabled,
  dragHandle,
  emptyColumnLabel,
  className,
  cardClassName,
  getCardId,
  renderColumnHeader,
  renderCard,
}: KanbanColumnViewProps<C>) {
  const tone = column.tone ?? "default";
  const { setNodeRef, isOver } = useDroppable({ id: column.id, disabled });

  return (
    <div
      data-slot="kanban-column"
      className={cn(
        "flex shrink-0 flex-col",
        densityColumnClass[density],
        className,
      )}
    >
      {renderColumnHeader ? (
        renderColumnHeader(column)
      ) : (
        <div className="flex flex-col gap-0.5 px-1 pb-0.5">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "min-w-0 flex-1 truncate text-xs font-medium",
                columnTitleToneClass[tone],
              )}
            >
              {column.title}
            </h3>
            <span className="shrink-0 text-xs font-normal tabular-nums text-muted-foreground/60">
              {column.cards.length}
            </span>
            {column.action ? <div className="shrink-0">{column.action}</div> : null}
          </div>
          {column.description ? (
            <p className="truncate text-xs text-muted-foreground">
              {column.description}
            </p>
          ) : null}
        </div>
      )}

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          data-slot="kanban-column-body"
          className={cn(
            "flex min-h-16 flex-1 flex-col rounded-xl transition-colors",
            densityListClass[density],
            isOver && "bg-muted/50",
          )}
        >
          {column.cards.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/60 px-2 py-8 text-center text-xs text-muted-foreground/70">
              {emptyColumnLabel ?? "Drop here"}
            </div>
          ) : (
            column.cards.map((card) => {
              const id = getCardId(card);
              return (
                <SortableCard
                  key={id}
                  card={card}
                  cardId={id}
                  column={column}
                  density={density}
                  variant={cardVariant}
                  disabled={disabled}
                  dragHandle={dragHandle}
                  className={cardClassName}
                  renderCard={renderCard}
                />
              );
            })
          )}
        </div>
      </SortableContext>

      {column.footer ? <div className="px-0.5 pt-0.5">{column.footer}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

function cloneColumns<C extends KanbanCardData>(
  columns: KanbanColumnData<C>[],
): KanbanColumnData<C>[] {
  return columns.map((col) => ({ ...col, cards: [...col.cards] }));
}

function locateCard<C extends KanbanCardData>(
  columns: KanbanColumnData<C>[],
  getCardId: (card: C) => string,
  cardId: string,
): KanbanLocation | null {
  for (const col of columns) {
    const index = col.cards.findIndex((c) => getCardId(c) === cardId);
    if (index !== -1) return { columnId: col.id, index };
  }
  return null;
}

/**
 * Proprietary Kanban board on `@dnd-kit` — accessible drag-and-drop with
 * pointer + keyboard sensors, cross-column moves, empty-column drop zones, and a
 * floating drag overlay. Controlled (`columns` + `onColumnsChange`) or
 * uncontrolled (`defaultColumns`); `onMove` reports each completed move.
 */
export function Kanban<C extends KanbanCardData = KanbanCardData>({
  columns: columnsProp,
  defaultColumns,
  onColumnsChange,
  onMove,
  renderCard,
  renderColumnHeader,
  getCardId = defaultGetCardId,
  emptyColumnLabel,
  density = "default",
  cardVariant = "default",
  dragHandle = "auto",
  disabled = false,
  className,
  columnClassName,
  cardClassName,
  ...rest
}: KanbanProps<C>) {
  const ariaLabel = rest["aria-label"] ?? "Kanban board";
  const isControlled = columnsProp !== undefined;

  const [internal, setInternal] = React.useState<KanbanColumnData<C>[]>(
    () => cloneColumns(defaultColumns ?? columnsProp ?? []),
  );
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const dragOriginRef = React.useRef<KanbanLocation | null>(null);

  // Sync from the controlled prop while not actively dragging.
  React.useEffect(() => {
    if (isControlled && activeId === null) {
      setInternal(cloneColumns(columnsProp!));
    }
  }, [columnsProp, isControlled, activeId]);

  const columns = internal;

  const columnIds = React.useMemo(
    () => new Set(columns.map((c) => c.id)),
    [columns],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeCard = React.useMemo(() => {
    if (!activeId) return null;
    for (const col of columns) {
      const card = col.cards.find((c) => getCardId(c) === activeId);
      if (card) return { card, column: col };
    }
    return null;
  }, [activeId, columns, getCardId]);

  const resolveTargetColumnId = (overId: string): string | undefined => {
    if (columnIds.has(overId)) return overId;
    const loc = locateCard(columns, getCardId, overId);
    return loc?.columnId;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    setActiveId(id);
    dragOriginRef.current = locateCard(columns, getCardId, id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeCardId = String(active.id);
    const overId = String(over.id);

    const from = locateCard(columns, getCardId, activeCardId);
    const toColumnId = resolveTargetColumnId(overId);
    if (!from || !toColumnId || from.columnId === toColumnId) return;

    setInternal((prev) => {
      const next = cloneColumns(prev);
      const fromCol = next.find((c) => c.id === from.columnId);
      const toCol = next.find((c) => c.id === toColumnId);
      if (!fromCol || !toCol) return prev;

      const movingIndex = fromCol.cards.findIndex(
        (c) => getCardId(c) === activeCardId,
      );
      if (movingIndex === -1) return prev;
      const [moving] = fromCol.cards.splice(movingIndex, 1);

      const overIsCard = !columnIds.has(overId);
      const overIndex = overIsCard
        ? toCol.cards.findIndex((c) => getCardId(c) === overId)
        : toCol.cards.length;
      const insertAt = overIndex === -1 ? toCol.cards.length : overIndex;
      toCol.cards.splice(insertAt, 0, moving);
      return next;
    });
  };

  const finishDrag = (event: DragEndEvent) => {
    const { active, over } = event;
    const origin = dragOriginRef.current;
    const movedCard = activeCard?.card;
    dragOriginRef.current = null;
    setActiveId(null);
    if (!over || !origin) return;

    const activeCardId = String(active.id);
    const overId = String(over.id);

    // `columns` already reflects cross-column moves applied during dragOver;
    // here we only need to finalize a same-column reorder.
    let next = columns;
    const current = locateCard(columns, getCardId, activeCardId);
    const toColumnId = resolveTargetColumnId(overId) ?? current?.columnId;
    if (current && toColumnId && current.columnId === toColumnId) {
      const col = columns.find((c) => c.id === toColumnId);
      if (col) {
        const oldIndex = col.cards.findIndex((c) => getCardId(c) === activeCardId);
        const overIsCard = !columnIds.has(overId);
        const overIndex = overIsCard
          ? col.cards.findIndex((c) => getCardId(c) === overId)
          : col.cards.length - 1;
        const newIndex = overIndex === -1 ? col.cards.length - 1 : overIndex;
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          next = columns.map((c) =>
            c.id === toColumnId
              ? { ...c, cards: arrayMove(c.cards, oldIndex, newIndex) }
              : c,
          );
        }
      }
    }

    if (next !== columns) setInternal(next);

    const finalLoc = locateCard(next, getCardId, activeCardId);
    const moved =
      finalLoc &&
      (finalLoc.columnId !== origin.columnId || finalLoc.index !== origin.index);
    if (moved) {
      if (movedCard) {
        onMove?.({
          card: movedCard,
          cardId: activeCardId,
          from: origin,
          to: finalLoc,
          columns: next,
        });
      }
      onColumnsChange?.(next);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={finishDrag}
      onDragCancel={() => {
        dragOriginRef.current = null;
        setActiveId(null);
        if (isControlled) setInternal(cloneColumns(columnsProp!));
      }}
    >
      <div
        data-slot="kanban"
        role="list"
        aria-label={ariaLabel}
        className={cn(
          "flex w-full items-start overflow-x-auto p-1.5 pb-6 -m-1.5",
          density === "compact" ? "gap-3" : "gap-4",
          className,
        )}
      >
        {columns.map((column) => (
          <KanbanColumnView
            key={column.id}
            column={column}
            cardIds={column.cards.map(getCardId)}
            density={density}
            cardVariant={cardVariant}
            disabled={disabled}
            dragHandle={dragHandle}
            emptyColumnLabel={emptyColumnLabel}
            className={columnClassName}
            cardClassName={cardClassName}
            getCardId={getCardId}
            renderColumnHeader={renderColumnHeader}
            renderCard={renderCard}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard ? (
          <div
            data-slot="kanban-card-overlay"
            className={cn(
              "text-sm text-foreground shadow-xl ring-1 ring-black/5",
              densityCardClass[density],
              cardSurfaceClass(cardVariant, activeCard.column.tone ?? "default"),
              "rotate-2 cursor-grabbing",
            )}
          >
            {renderCard(activeCard.card, {
              column: activeCard.column,
              isDragging: true,
              isOverlay: true,
            })}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
