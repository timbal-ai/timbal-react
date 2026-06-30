"use client";

import {
  AttachmentPrimitive,
  AuiIf,
  ComposerPrimitive,
  useAuiState,
  useComposerRuntime,
  useThreadRuntime,
} from "@assistant-ui/react";
import {
  XIcon,
  Maximize2Icon,
  Minimize2Icon,
  PlusIcon,
  ArrowUpIcon,
  SquareIcon,
  SearchIcon,
  ChevronDownIcon,
  Menu,
  CheckIcon,
  Loader2Icon,
  MessagesSquareIcon,
} from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useCallback, useEffect, useState, type CSSProperties, type FC } from "react";
import { motion, AnimatePresence } from "motion/react";

import { Thread, type ThreadProps } from "../../chat/thread";
import {
  useResolvedSuggestions,
  type SuggestionsComponent,
} from "../../chat/suggestions";
import {
  TimbalRuntimeProvider,
  useTimbalRuntime,
  type TimbalRuntimeProviderProps,
} from "../../runtime/provider";
import {
  listRuns,
  getRun,
  orderRunsForThread,
  type FetchFn,
  type RunPreview,
} from "../../runtime/conversations";
import { conversationRunsToMessages } from "../../runtime/trace-to-messages";
import { useConversations } from "../../hooks/use-conversations";
import { useTimbalAttachmentsEnabled } from "../../runtime/attachments-context";
import { cn } from "../../utils";
import { useCopilot } from "./context";

/** Panel root — relative so the corner controls float over the conversation. */
const shellClass = cn(
  "aui-app-chat-panel relative flex h-full min-h-0 flex-col overflow-hidden",
  // Hide every scrollbar in the assistant panel — content stays scrollable.
  "[&_*]:![scrollbar-width:none] [&_*]:![-ms-overflow-style:none]",
  "[&_*::-webkit-scrollbar]:!hidden [&_*::-webkit-scrollbar]:!w-0 [&_*::-webkit-scrollbar]:!h-0",
);

/**
 * GLOBAL liquid-glass fix. Every inner surface here (composer pill, history
 * dropdown, round controls, attachment chips) is rendered INSIDE the floating
 * chat panel, which already owns a `backdrop-filter` (`SIRI_GLASS_STYLE`).
 * Browsers do NOT reliably apply a second `backdrop-filter` nested under an
 * already-backdrop-filtered ancestor — so any `backdrop-blur-*` on these inner
 * surfaces is a silent no-op and the scrolling content shows straight through.
 *
 * The fix is to occlude with a real frosted *fill* (an opaque-enough neutral
 * base) plus a top-down white sheen so the surface still reads as glass rather
 * than a flat panel. Reuse these tokens for every inner glass surface so the
 * whole panel stays consistent.
 */
const SIRI_INNER_GLASS_STYLE: CSSProperties = {
  backgroundColor: "rgba(40,40,50,0.42)",
  backgroundImage:
    "linear-gradient(to bottom, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.02) 100%)",
  backdropFilter: "blur(22px) saturate(180%)",
  WebkitBackdropFilter: "blur(22px) saturate(180%)",
};

/** Slightly lighter inner-glass fill for small round controls. */
const SIRI_INNER_GLASS_CONTROL_STYLE: CSSProperties = {
  backgroundColor: "rgba(56,56,66,0.4)",
  backgroundImage:
    "linear-gradient(to bottom, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%)",
  backdropFilter: "blur(16px) saturate(170%)",
  WebkitBackdropFilter: "blur(16px) saturate(170%)",
};

/** History dropdown — translucent frost + real blur of the content behind it. */
const SIRI_MENU_GLASS_STYLE: CSSProperties = {
  backgroundColor: "rgba(34,34,42,0.46)",
  backgroundImage:
    "linear-gradient(to bottom, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.045) 45%, rgba(255,255,255,0.015) 100%)",
  backdropFilter: "blur(28px) saturate(180%)",
  WebkitBackdropFilter: "blur(28px) saturate(180%)",
};

/**
 * One shared circular glass button — close, expand, attach. `size-9` (36px),
 * frosted-glass *fill* (see `SIRI_INNER_GLASS_CONTROL_STYLE`) so it occludes
 * the scrolling content behind it; live backdrop-blur can't be used here (it is
 * nested inside the panel's own backdrop-filter).
 */
const siriGlassButtonClass = cn(
  "flex size-9 shrink-0 items-center justify-center rounded-full text-white",
  "hover:brightness-125 border border-white/20",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_16px_rgba(0,0,0,0.3)]",
  "transition-all duration-200 active:scale-90 hover:scale-105",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
);

/** Send: solid white for primary emphasis, same footprint as the glass buttons. */
const siriSendButtonClass = cn(
  "flex size-9 shrink-0 items-center justify-center rounded-full text-black",
  "bg-white hover:bg-white/90",
  "shadow-[0_2px_10px_rgba(0,0,0,0.3)]",
  "transition-all duration-200 active:scale-90 hover:scale-105",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
);

/** Cancel: same footprint, destructive tint. */
const siriCancelButtonClass = cn(
  "flex size-9 shrink-0 items-center justify-center rounded-full text-red-300",
  "bg-red-500/25 hover:bg-red-500/35 border border-red-400/30 backdrop-blur-md",
  "shadow-[0_2px_10px_rgba(0,0,0,0.3)]",
  "transition-all duration-200 active:scale-90 hover:scale-105",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
);

const bodyClass = cn(
  "aui-app-chat-panel-body relative min-h-0 flex-1 overflow-hidden",
  "[&_.aui-thread-root]:h-full [&_.aui-thread-root]:!bg-transparent",
  // Auto overflow only — scrollbars are hidden on the panel shell.
  "[&_.aui-thread-viewport]:!overflow-y-auto",
  // Clear the corner controls (top) without a chrome bar / divider.
  "[&_.aui-thread-viewport]:!px-3 [&_.aui-thread-viewport]:!pt-16",
  "[&_.aui-thread-viewport-footer]:!bg-transparent",
  "[&_.aui-user-message-root]:!px-0",
  // Glass text + bubble theming
  "[&_.aui-thread-welcome-root_h1]:!text-white [&_.aui-thread-welcome-root_h1]:!font-semibold",
  "[&_.aui-thread-welcome-root_p]:!text-white/55",
  "[&_.aui-assistant-message-content]:!text-white/90",
  "[&_.aui-assistant-message-content_a]:!text-sky-300 hover:[&_.aui-assistant-message-content_a]:!underline",
  "[&_.aui-assistant-action-bar-root_button]:!text-white/40 hover:[&_.aui-assistant-action-bar-root_button]:!text-white/80",
  "[&_.aui-user-message-content]:!bg-white/12 [&_.aui-user-message-content]:!text-white [&_.aui-user-message-content]:!border [&_.aui-user-message-content]:!border-white/10 [&_.aui-user-message-content]:backdrop-blur-md",
  // Artifacts (charts, tables, json, html, ui) + markdown images read as glass
  // tiles on the dark panel instead of opaque light cards.
  "[&_.aui-artifact-root]:!border-white/15 [&_.aui-artifact-root]:!bg-white/[0.06] [&_.aui-artifact-root]:backdrop-blur-md",
  "[&_.aui-artifact-header]:!border-white/10 [&_.aui-artifact-header]:!bg-white/[0.04]",
  "[&_.aui-artifact-title]:!text-white/80",
  "[&_.aui-md-img]:!rounded-xl [&_.aui-md-img]:!border [&_.aui-md-img]:!border-white/10",
);

export interface CopilotPanelProps
  extends Omit<TimbalRuntimeProviderProps, "children">,
    Omit<ThreadProps, "variant" | "maxWidth"> {
  className?: string;
}

/**
 * Apple-style document glyph — a rounded page with a folded top-right corner.
 * Replaces the generic file-text icon for a softer, more native feel.
 */
const AppleDocGlyph: FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <path d="M13.4 3H7.8A1.8 1.8 0 0 0 6 4.8v14.4A1.8 1.8 0 0 0 7.8 21h8.4a1.8 1.8 0 0 0 1.8-1.8V7.6Z" />
    <path d="M13.2 3v3.4a1.8 1.8 0 0 0 1.8 1.8h3" />
  </svg>
);

/** Object-URL preview for an image attachment (composer), else its remote src. */
const useChipImageSrc = (): string | undefined => {
  const { file, src } = useAuiState(
    useShallow((s): { file?: File; src?: string } => {
      if (s.attachment.type !== "image") return {};
      if (s.attachment.file) return { file: s.attachment.file };
      const img = s.attachment.content?.filter((c) => c.type === "image")[0]
        ?.image;
      return img ? { src: img } : {};
    }),
  );

  const [objectUrl, setObjectUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!file) {
      setObjectUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return objectUrl ?? src;
};

/**
 * Craft-style attached-document chip — preview/icon box, title + type subtitle,
 * and a corner X. Dark-glass colors so it sits on the liquid-glass panel. The
 * preview box is a rounded square that matches the chip's holder (never a
 * circle) and shows a real image thumbnail when the attachment is an image.
 */
const SiriAttachmentChip: FC = () => {
  const imageSrc = useChipImageSrc();

  return (
    <motion.div
      className="relative min-w-0 max-w-full"
      initial={{ opacity: 0, scale: 0.8, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 460, damping: 28, mass: 0.6 }}
    >
      <AttachmentPrimitive.Root className="relative min-w-0 max-w-full">
        <div className="flex max-w-full items-center gap-3 rounded-2xl border border-white/12 bg-white/8 py-2.5 pl-2.5 pr-9 backdrop-blur-md">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-white/10 bg-white/10">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <AppleDocGlyph className="size-[18px] text-white/75" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">
              <AttachmentPrimitive.Name />
            </div>
            <div className="text-xs text-white/45">Attachment</div>
          </div>
        </div>
        <AttachmentPrimitive.Remove asChild>
          <button
            type="button"
            aria-label="Remove attachment"
            className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-white text-black shadow-[0_2px_6px_rgba(0,0,0,0.35)] transition-transform hover:scale-110 active:scale-90"
          >
            <XIcon className="size-3 stroke-[2.5]" />
          </button>
        </AttachmentPrimitive.Remove>
      </AttachmentPrimitive.Root>
    </motion.div>
  );
};

const SiriComposerAttachments: FC = () => (
  <div className="flex w-full flex-row flex-wrap items-center gap-2 px-3 pt-2.5 pb-1 empty:hidden">
    <ComposerPrimitive.Attachments components={{ Attachment: SiriAttachmentChip }} />
  </div>
);

const SIRI_SUGGESTIONS_COLLAPSE_AT = 3;

/**
 * Craft-style suggestions — a "Suggestions" header, plain outline-icon rows,
 * and a collapsible "Show N More" / "Show less" toggle. Dark-glass colors.
 */
const SiriSuggestions: SuggestionsComponent = ({ suggestions }) => {
  const items = useResolvedSuggestions(suggestions);
  const runtime = useThreadRuntime();
  const [expanded, setExpanded] = useState(false);

  if (!items || items.length === 0) return null;

  const visible = expanded ? items : items.slice(0, SIRI_SUGGESTIONS_COLLAPSE_AT);
  const hiddenCount = items.length - SIRI_SUGGESTIONS_COLLAPSE_AT;

  const rowClass =
    "group flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left focus-visible:outline-none";

  return (
    <div className="w-full px-1 pb-2" role="list" aria-label="Suggested prompts">
      <div className="mb-1 px-2 text-[13px] font-semibold text-white/55">
        Suggestions
      </div>
      {visible.map((suggestion, i) => (
        <button
          key={(suggestion.prompt ?? suggestion.title) + i}
          type="button"
          role="listitem"
          onClick={() =>
            runtime.append({
              role: "user",
              content: [{ type: "text", text: suggestion.prompt ?? suggestion.title }],
            })
          }
          className={rowClass}
        >
          <span className="shrink-0 text-white/45">
            {suggestion.icon ?? <SearchIcon className="size-4" strokeWidth={1.75} aria-hidden />}
          </span>
          <span className="truncate text-sm text-white/85">{suggestion.title}</span>
        </button>
      ))}
      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={rowClass}
          aria-expanded={expanded}
        >
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 text-white/45 transition-transform duration-200",
              expanded && "rotate-180",
            )}
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="truncate text-sm text-white/55">
            {expanded ? "Show less" : `Show ${hiddenCount} More`}
          </span>
        </button>
      ) : null}
    </div>
  );
};

/**
 * Siri-style glass composer — attach (left), glass pill input (center),
 * send / cancel (right). All controls share the same `size-9` footprint and a
 * single `items-center` row so they stay vertically aligned.
 */
const SiriComposer: FC<{ placeholder?: string; autoFocus?: boolean }> = ({
  placeholder = "Ask Siri…",
  autoFocus = true,
}) => {
  const attachmentsEnabled = useTimbalAttachmentsEnabled();
  // `ComposerPrimitive.AddAttachment` disables itself whenever the composer
  // isn't in the "editing" state, so the + reads as greyed/inert next to the
  // always-live corner controls. Drive the same native file picker ourselves so
  // the + behaves exactly like the other glass buttons.
  const composer = useComposerRuntime() as unknown as {
    addAttachment: (file: File) => void | Promise<void>;
    getState: () => { attachmentAccept?: string };
  };
  const openAttachmentPicker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.hidden = true;
    const accept = composer.getState?.().attachmentAccept;
    if (accept && accept !== "*") input.accept = accept;
    document.body.appendChild(input);
    input.onchange = () => {
      if (input.files) for (const file of Array.from(input.files)) void composer.addAttachment(file);
      input.remove();
    };
    input.oncancel = () => {
      if (!input.files || input.files.length === 0) input.remove();
    };
    input.click();
  };

  return (
    <ComposerPrimitive.Root className="relative flex w-full min-w-0 flex-col pb-3">
      <div className="flex w-full min-w-0 items-end gap-2.5">
        {attachmentsEnabled ? (
          <button
            type="button"
            className={siriGlassButtonClass}
            style={SIRI_INNER_GLASS_CONTROL_STYLE}
            onClick={openAttachmentPicker}
            aria-label="Add attachment"
          >
            <PlusIcon className="size-4.5 stroke-[2.25]" />
          </button>
        ) : null}

        <ComposerPrimitive.AttachmentDropzone asChild disabled={!attachmentsEnabled}>
          <div
            className={cn(
              // Liquid-glass capsule. The panel ancestor already owns a
              // `backdrop-filter`, and browsers won't reliably apply a second
              // nested one — so we occlude the scrolling content behind the pill
              // with an opaque frosted *fill* (set via inline style below) plus a
              // bright top rim + inner glow so it still reads as glass, not flat.
              "group/drop relative flex flex-col min-h-9 min-w-0 flex-1 overflow-hidden rounded-3xl border border-white/20 backdrop-blur-3xl backdrop-saturate-150 transition-all duration-200",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.25)]",
              "focus-within:border-white/35 focus-within:ring-2 focus-within:ring-white/15",
              // Drag-over: highlight the box itself.
              "data-[dragging=true]:border-sky-400/60 data-[dragging=true]:bg-sky-400/5 data-[dragging=true]:ring-2 data-[dragging=true]:ring-sky-400/30",
            )}
            style={SIRI_INNER_GLASS_STYLE}
          >
            {attachmentsEnabled ? <SiriComposerAttachments /> : null}
            <div className="relative flex w-full items-center">
              {/* `asChild` + CSS `field-sizing: content` replaces assistant-ui's
                  JS textarea-autosize so composer growth never feeds the
                  viewport's resize observers. */}
              <ComposerPrimitive.Input
                asChild
                placeholder={placeholder}
                rows={1}
                autoFocus={autoFocus}
                aria-label="Message input"
              >
                <textarea className="max-h-32 w-full resize-none overflow-y-auto field-sizing-content bg-transparent py-2 px-4 text-sm leading-5 text-white outline-none placeholder:text-white/35 focus-visible:ring-0" />
              </ComposerPrimitive.Input>
            </div>

            {attachmentsEnabled ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden rounded-3xl opacity-0 transition-opacity duration-200 group-data-[dragging=true]/drop:opacity-100">
                {/* Animated marching-ants border + frosted veil while dragging. */}
                <span
                  className="absolute inset-0 rounded-3xl bg-sky-400/10"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(90deg,rgba(56,189,248,0.9) 0 10px,transparent 10px 20px),repeating-linear-gradient(90deg,rgba(56,189,248,0.9) 0 10px,transparent 10px 20px),repeating-linear-gradient(0deg,rgba(56,189,248,0.9) 0 10px,transparent 10px 20px),repeating-linear-gradient(0deg,rgba(56,189,248,0.9) 0 10px,transparent 10px 20px)",
                    backgroundSize: "200% 2px,200% 2px,2px 200%,2px 200%",
                    backgroundPosition: "0 0,0 100%,0 0,100% 0",
                    backgroundRepeat: "no-repeat",
                    animation: "siri-marching-ants 0.6s linear infinite",
                  }}
                />
                <span className="relative flex items-center gap-1.5 text-xs font-medium text-sky-100">
                  <PlusIcon className="size-3.5 stroke-[2.5]" />
                  Drop to attach
                </span>
              </div>
            ) : null}
            <style>{`@keyframes siri-marching-ants{to{background-position:200% 0,-200% 100%,0 -200%,100% 200%}}`}</style>
          </div>
        </ComposerPrimitive.AttachmentDropzone>

        <AuiIf condition={(s) => !s.thread.isRunning}>
          <ComposerPrimitive.Send asChild>
            <button type="submit" className={siriSendButtonClass} aria-label="Send message">
              <ArrowUpIcon className="size-4.5 stroke-[2.5]" />
            </button>
          </ComposerPrimitive.Send>
        </AuiIf>
        <AuiIf condition={(s) => s.thread.isRunning}>
          <ComposerPrimitive.Cancel asChild>
            <button type="button" className={siriCancelButtonClass} aria-label="Stop generating">
              <SquareIcon className="size-3.5 fill-current" />
            </button>
          </ComposerPrimitive.Cancel>
        </AuiIf>
      </div>
    </ComposerPrimitive.Root>
  );
};

// ---------------------------------------------------------------------------
// Conversation history — glass dropdown over the app-runs data layer
// ---------------------------------------------------------------------------

/** Safety cap on turns hydrated when reopening a stored conversation. */
const HISTORY_MAX_TURNS = 60;

/** Dark frosted-glass menu surface — heavy blur for legibility on the liquid bg. */
const siriMenuClass = cn(
  "aui-app-chat-history-menu absolute left-3 top-14 z-50 w-72 origin-top-left overflow-hidden",
  "rounded-2xl border border-white/15",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_16px_48px_rgba(0,0,0,0.5)]",
);

const siriMenuRowClass = cn(
  "group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left",
  "transition-colors hover:bg-white/10",
  "focus-visible:outline-none focus-visible:bg-white/10",
);

/** Same key order the platform may grow into; falls back to a generic label. */
const RUN_TITLE_KEYS = [
  "title",
  "name",
  "summary",
  "preview",
  "last_message",
  "first_message",
  "label",
] as const;

function runTitle(run: RunPreview): string {
  for (const key of RUN_TITLE_KEYS) {
    const value = run[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "Conversation";
}

function runSubtitle(run: RunPreview): string {
  const iso = run.created_at;
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? time
    : `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${time}`;
}

interface CopilotHistoryProps {
  workforceId: string;
  baseUrl?: string;
  fetch?: FetchFn;
  /** Shift the trigger right of the close button when the panel is collapsible. */
  collapsible?: boolean;
}

/**
 * History trigger + Apple-glass dropdown. Lists conversation roots for the
 * workforce (`useConversations`), reopens one by hydrating its run traces into
 * the live runtime (`loadMessages`), and starts a fresh thread (`clear`).
 * Renders inside `TimbalRuntimeProvider` so it can drive the active thread.
 */
const CopilotHistory: FC<CopilotHistoryProps> = ({
  workforceId,
  baseUrl,
  fetch: fetchFn,
  collapsible,
}) => {
  const { loadMessages, clear } = useTimbalRuntime();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { conversations, isLoading, isLoadingMore, error, hasMore, loadMore } =
    useConversations({
      workforceId,
      baseUrl,
      ...(fetchFn ? { fetch: fetchFn } : {}),
      enabled: open,
    });

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const startNew = useCallback(() => {
    clear();
    setActiveId(null);
    setOpen(false);
  }, [clear]);

  const openConversation = useCallback(
    async (id: string) => {
      setLoadingId(id);
      try {
        const { runs } = await listRuns({
          groupId: id,
          workforceId,
          baseUrl,
          sortBy: "created_at",
          sortOrder: "asc",
          ...(fetchFn ? { fetch: fetchFn } : {}),
        });
        const ordered = orderRunsForThread(runs).slice(0, HISTORY_MAX_TURNS);

        // Hydrate each turn's trace. Sequential to avoid hammering the host
        // proxy; the platform should eventually expose a single thread-messages
        // endpoint so this isn't N+1.
        const detailByRunId = new Map<string, Awaited<ReturnType<typeof getRun>>>();
        for (const run of ordered) {
          const runId = run?.id != null ? String(run.id) : "";
          if (!runId) continue;
          try {
            const detail = await getRun({
              runId,
              baseUrl,
              ...(fetchFn ? { fetch: fetchFn } : {}),
            });
            if (detail?.trace) detailByRunId.set(runId, detail);
          } catch {
            // Skip a single unreadable turn rather than failing the thread.
          }
        }

        loadMessages(conversationRunsToMessages(ordered, detailByRunId));
        setActiveId(id);
        setOpen(false);
      } catch {
        // Leave the menu open so the user can retry.
      } finally {
        setLoadingId(null);
      }
    },
    [workforceId, baseUrl, fetchFn, loadMessages],
  );

  return (
    <>
      <button
        type="button"
        className={cn(
          siriGlassButtonClass,
          "absolute top-3 z-50",
          collapsible ? "left-14" : "left-3",
        )}
        style={SIRI_INNER_GLASS_CONTROL_STYLE}
        onClick={() => setOpen((v) => !v)}
        aria-label="Conversation history"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Menu className="size-4.5 stroke-[2.25]" />
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              className="absolute inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              role="menu"
              aria-label="Conversation history"
              className={siriMenuClass}
              style={SIRI_MENU_GLASS_STYLE}
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              <div className="flex items-center px-2.5 pt-2.5 pb-1.5">
                <span className="text-[13px] font-semibold text-white/70">
                  History
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto p-1.5 pt-0">
                <button
                  type="button"
                  role="menuitem"
                  onClick={startNew}
                  className={siriMenuRowClass}
                >
                  <span className="flex size-4 shrink-0 items-center justify-center text-white/55">
                    <PlusIcon className="size-4 stroke-[2.25]" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-white/85">
                    New conversation
                  </span>
                  {activeId === null ? (
                    <CheckIcon className="size-4 shrink-0 text-white/70" />
                  ) : null}
                </button>

                <div className="my-1 h-px bg-white/10" aria-hidden />

                {isLoading ? (
                  <div className="flex items-center gap-2 px-2.5 py-3 text-sm text-white/45">
                    <Loader2Icon className="size-4 animate-spin" />
                    Loading…
                  </div>
                ) : error ? (
                  <div className="px-2.5 py-3 text-sm text-red-300/80">
                    Couldn’t load conversations.
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center gap-1.5 px-2.5 py-6 text-center">
                    <MessagesSquareIcon className="size-5 text-white/35" />
                    <span className="text-sm text-white/45">No conversations yet</span>
                  </div>
                ) : (
                  conversations.map((run) => {
                    const id = String(run.id);
                    const isActive = id === activeId;
                    const isRowLoading = id === loadingId;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="menuitem"
                        onClick={() => openConversation(id)}
                        disabled={isRowLoading}
                        className={siriMenuRowClass}
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-full border",
                            isActive ? "border-white" : "border-white/30",
                          )}
                        >
                          {isActive ? (
                            <span className="size-1.5 rounded-full bg-white" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-white/90">
                            {runTitle(run)}
                          </span>
                          <span className="block truncate text-xs text-white/40">
                            {runSubtitle(run)}
                          </span>
                        </span>
                        {isRowLoading ? (
                          <Loader2Icon className="size-4 shrink-0 animate-spin text-white/60" />
                        ) : isActive ? (
                          <CheckIcon className="size-4 shrink-0 text-white/70" />
                        ) : null}
                      </button>
                    );
                  })
                )}

                {hasMore ? (
                  <button
                    type="button"
                    onClick={() => loadMore()}
                    disabled={isLoadingMore}
                    className={cn(siriMenuRowClass, "justify-center text-white/55")}
                  >
                    {isLoadingMore ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <span className="text-sm">Show more</span>
                    )}
                  </button>
                ) : null}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
};

/**
 * Floating copilot body — `TimbalRuntimeProvider` + compact `Thread`.
 * Rendered inside `AppCopilot`'s glass panel; reads open/expand from `useCopilot`.
 */
export const CopilotPanel: FC<CopilotPanelProps> = ({
  className,
  workforceId,
  baseUrl,
  fetch,
  attachments,
  attachmentsUploadUrl,
  attachmentsAccept,
  debug,
  welcome,
  suggestions,
  showWelcomeSuggestions,
  composerPlaceholder,
  components,
  artifacts,
  onArtifactEvent,
  ...rest
}) => {
  const copilot = useCopilot();

  return (
    <div className={cn(shellClass, className)}>
      {/* Floating corner controls — no chrome bar, no divider. */}
      {copilot?.collapsible ? (
        <button
          type="button"
          className={cn(siriGlassButtonClass, "absolute left-3 top-3 z-30")}
          style={SIRI_INNER_GLASS_CONTROL_STYLE}
          onClick={() => copilot.setOpen(false)}
          aria-label="Close assistant"
        >
          <XIcon className="size-4.5 stroke-[2.25]" />
        </button>
      ) : null}
      {copilot?.collapsible && copilot?.setExpanded ? (
        <button
          type="button"
          className={cn(siriGlassButtonClass, "absolute right-3 top-3 z-30")}
          style={SIRI_INNER_GLASS_CONTROL_STYLE}
          onClick={() => copilot.setExpanded(!copilot.expanded)}
          aria-label={copilot.expanded ? "Collapse assistant" : "Expand assistant"}
        >
          {copilot.expanded ? (
            <Minimize2Icon className="size-4.5 stroke-[2.25]" />
          ) : (
            <Maximize2Icon className="size-4.5 stroke-[2.25]" />
          )}
        </button>
      ) : null}

      <div className={bodyClass}>
        <TimbalRuntimeProvider
          workforceId={workforceId}
          baseUrl={baseUrl}
          fetch={fetch}
          attachments={attachments}
          attachmentsUploadUrl={attachmentsUploadUrl}
          attachmentsAccept={attachmentsAccept}
          debug={debug}
        >
          <CopilotHistory
            workforceId={workforceId}
            baseUrl={baseUrl}
            fetch={fetch}
            collapsible={copilot?.collapsible}
          />
          <Thread
            variant="panel"
            // Collapsed panel is already narrow → fill it. Expanded/full-screen
            // must not stretch messages + composer edge-to-edge, so scope the
            // conversation to a centered, readable column.
            maxWidth={copilot?.expanded ? "48rem" : "100%"}
            className="aui-app-chat-panel-thread"
            welcome={welcome}
            suggestions={suggestions}
            showWelcomeSuggestions={showWelcomeSuggestions}
            composerPlaceholder={composerPlaceholder}
            components={{
              Composer: SiriComposer,
              Suggestions: SiriSuggestions,
              ...components,
            }}
            artifacts={artifacts}
            onArtifactEvent={onArtifactEvent}
            {...rest}
          />
        </TimbalRuntimeProvider>
      </div>
    </div>
  );
};
