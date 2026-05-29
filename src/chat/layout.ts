/**
 * Official layout class strings for custom `Thread` message slots.
 *
 * `Thread` sets `--thread-max-width` (default {@link THREAD_DEFAULT_MAX_WIDTH}).
 * Overriding `components.AssistantMessage` or `components.UserMessage` removes
 * the built-in chrome — apply these on `MessagePrimitive.Root`.
 */

/** Default `maxWidth` on `Thread` / `TimbalChatShell`. */
export const THREAD_DEFAULT_MAX_WIDTH = "44rem";

/** Shared column — aligns custom messages with the composer footer. */
export const threadMessageColumnClass =
  "mx-auto w-full max-w-(--thread-max-width)";

/** Matches built-in assistant message root (minus motion utilities). */
export const assistantMessageRootClass = [
  "aui-assistant-message-root relative",
  threadMessageColumnClass,
  "py-3 duration-150",
].join(" ");

/** Inner content padding for assistant text / artifacts. */
export const assistantMessageContentClass =
  "wrap-break-word px-2 text-foreground leading-relaxed";

/** Matches built-in user message root. */
export const userMessageRootClass = [
  "aui-user-message-root flex flex-col items-end gap-2",
  threadMessageColumnClass,
  "px-2 py-3",
].join(" ");
