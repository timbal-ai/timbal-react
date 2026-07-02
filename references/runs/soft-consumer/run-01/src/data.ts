/**
 * Ritual — demo data and the deterministic history generator.
 *
 * Every color in this file is token-referential (`color-mix` over theme
 * tokens), so the category pastels re-derive from the theme and flip with
 * dark mode — no literal colors outside the theme intent.
 */

export type CategoryId = "mind" | "movement" | "nourish" | "rest" | "connect";

export interface Category {
  id: CategoryId;
  label: string;
  /** Soft pastel card wash. */
  wash: string;
  /** Readable tinted ink for the category eyebrow on its wash. */
  ink: string;
}

export const CATEGORIES: Record<CategoryId, Category> = {
  movement: {
    id: "movement",
    label: "Movement",
    wash: "bg-[color-mix(in_oklab,var(--chart-1)_14%,var(--card))]",
    ink: "text-[color-mix(in_oklab,var(--chart-1)_60%,var(--foreground))]",
  },
  mind: {
    id: "mind",
    label: "Mind",
    wash: "bg-[color-mix(in_oklab,var(--chart-2)_16%,var(--card))]",
    ink: "text-[color-mix(in_oklab,var(--chart-2)_60%,var(--foreground))]",
  },
  nourish: {
    id: "nourish",
    label: "Nourish",
    wash: "bg-[color-mix(in_oklab,var(--chart-3)_16%,var(--card))]",
    ink: "text-[color-mix(in_oklab,var(--chart-3)_55%,var(--foreground))]",
  },
  rest: {
    id: "rest",
    label: "Rest",
    wash: "bg-[color-mix(in_oklab,var(--chart-4)_14%,var(--card))]",
    ink: "text-[color-mix(in_oklab,var(--chart-4)_60%,var(--foreground))]",
  },
  connect: {
    id: "connect",
    label: "Connect",
    wash: "bg-[color-mix(in_oklab,var(--chart-5)_15%,var(--card))]",
    ink: "text-[color-mix(in_oklab,var(--chart-5)_60%,var(--foreground))]",
  },
};

export interface Habit {
  id: string;
  name: string;
  /** Friendly hint shown while the ritual is still to come. */
  note: string;
  category: CategoryId;
  /** Current streak in days (as of this morning). */
  streak: number;
  /** How reliably this habit happens — drives the generated history. */
  consistency: number;
}

export const HABITS: Habit[] = [
  { id: "meditate", name: "Morning meditation", note: "10 quiet minutes", category: "mind", streak: 12, consistency: 0.82 },
  { id: "stretch", name: "Stretch & move", note: "20 gentle minutes", category: "movement", streak: 5, consistency: 0.68 },
  { id: "water", name: "Drink enough water", note: "8 glasses across the day", category: "nourish", streak: 21, consistency: 0.9 },
  { id: "read", name: "Read before bed", note: "15 pages, screens away", category: "rest", streak: 8, consistency: 0.74 },
  { id: "gratitude", name: "One gratitude note", note: "A single honest line", category: "mind", streak: 3, consistency: 0.6 },
  { id: "reach-out", name: "Reach out to someone", note: "A call or a kind message", category: "connect", streak: 2, consistency: 0.45 },
];

/** Rituals done before the app was opened today (seed state for the Today view). */
export const INITIALLY_DONE: string[] = ["meditate", "water"];

/* ------------------------------------------------------------------ *
 * Deterministic history — a tiny FNV-style hash so the calendar and  *
 * stats views agree with each other and survive reloads.             *
 * ------------------------------------------------------------------ */

function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Whether `habitId` was completed on `date` (past days only — callers guard the future). */
export function didComplete(habitId: string, date: Date): boolean {
  const habit = HABITS.find((h) => h.id === habitId);
  const consistency = habit ? habit.consistency : 0.7;
  // Weekends drift a little — real habits do.
  const dow = date.getDay();
  const weekendDrift = dow === 0 || dow === 6 ? -0.12 : 0.02;
  return hash01(`${habitId}:${dayKey(date)}`) < consistency + weekendDrift;
}

/** Count of habits completed on `date`. */
export function completionsOn(date: Date): number {
  return HABITS.reduce((n, h) => n + (didComplete(h.id, date) ? 1 : 0), 0);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
