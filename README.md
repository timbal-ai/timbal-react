# @timbal-ai/timbal-react

React components and runtime for building Timbal chat UIs and studio apps. Drop in a single component to get a fully-featured streaming chat interface connected to a Timbal workforce agent, or compose dashboards with the **app kit**.

## Package structure (1.0)

| Subpath | Use when |
|---------|----------|
| `@timbal-ai/timbal-react` | Full surface (chat shells, auth, artifacts, app kit) |
| `@timbal-ai/timbal-react/chat` | Chat-only apps — `Thread`, `Composer`, runtime, layout helpers |
| `@timbal-ai/timbal-react/studio` | Studio chrome — `TimbalChatShell`, `TimbalStudioShell`, sidebar |
| `@timbal-ai/timbal-react/ui` | Primitives — `Button`, `Dialog`, `DropdownMenu`, `Popover`, `Select`, `Tooltip`, `Avatar`, `Shimmer` |
| `@timbal-ai/timbal-react/app` | Dashboards — `AppShell`, `Page`, `DataTable`, `StatTile`, … |
| `@timbal-ai/timbal-react/styles.css` | Theme tokens (required once) |

### API tiers

1. **Stable** — `TimbalChat`, shells, `Thread`, `Composer`, auth, `styles.css`, documented app kit components.
2. **Composable** — `@assistant-ui/react` primitives re-exported from the main entry; message column classes from `./chat` (`threadMessageColumnClass`, `assistantMessageRootClass`, …).
3. **Internal** — `src/design/*` class composites (not exported); extend via CSS variables or public layout helpers.

```tsx
import { threadMessageColumnClass } from "@timbal-ai/timbal-react/chat";
import { AppShell, Page, StatTile } from "@timbal-ai/timbal-react/app";
```

## Installation

```bash
npm install @timbal-ai/timbal-react
# or
bun add @timbal-ai/timbal-react
```

**Peer dependencies:**

```bash
npm install react react-dom @assistant-ui/react @timbal-ai/timbal-sdk
```

### Tailwind setup

The package ships pre-built Tailwind class names **plus a complete light + dark token set** (`bg-background`, `text-foreground`, `bg-card`, `bg-bubble-user`, `from-elevated-from`, `bg-playground-from/via/to`, etc.). Your app CSS only needs three lines:

```css
/* src/index.css */
@import "tailwindcss";
@import "@timbal-ai/timbal-react/styles.css";
@source "../node_modules/@timbal-ai/timbal-react/dist";
```

That's it — no `@theme`, `:root`, or `.dark` blocks of your own. Toggling dark mode is a single `document.documentElement.classList.toggle("dark")` (or `next-themes` `attribute="class"`). The built-in `ModeToggle` (uncontrolled) persists to `localStorage` key `timbal-theme` and restores on reload.

> Adjust the `@source` path if your CSS file lives at a different depth relative to `node_modules`.

### Overriding the palette

Every token has a CSS-variable indirection in `styles.css`. Override individual variables to rebrand without forking:

```css
:root {
  --primary: oklch(0.5 0.12 265);
  --playground-from: oklch(0.95 0.04 265 / 0.6);
}

.dark {
  --primary: oklch(0.72 0.14 265);
  --playground-from: oklch(0.27 0.04 265);
}
```

Both light AND dark blocks must be defined for every overridden token — otherwise toggling dark mode produces an inconsistent UI. The library prints a one-time dev-only console warning when it detects a mismatch.

### Programmatic theming (no hand-authored OKLCH)

Instead of hand-writing paired `:root` / `.dark` blocks, derive a complete **personality** — color, roundness, shadows, and fonts — from a single intent object. The package owns the OKLCH math for every color token (primary, foreground, ring, the full button gradient, the playground tint):

```ts
import { createTimbalTheme, themeToCss, applyTimbalTheme } from "@timbal-ai/timbal-react";

const theme = createTimbalTheme({
  brand: "#4f46e5",
  radius: 0.875,     // corner roundness (rem) → --radius + --radius-2xl
  shadow: "soft",    // "none" | "hairline" | "soft" | "medium" | "strong"
  typography: {      // optional — re-skins every component's font
    sans: '"Geist", ui-sans-serif, system-ui, sans-serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Geist:wght@400..600&display=swap",
  },
});

// Build-time / SSR — paste into index.css (paired light + dark, always in sync):
const css = themeToCss(theme);

// Runtime — inject a managed <style> (+ font <link>), swappable, returns a disposer:
const dispose = applyTimbalTheme(theme);
```

> **Fonts must be loaded.** `applyTimbalTheme` and `TimbalThemeStyle` inject the `<link>` for `typography.importUrl` automatically. For build-time `themeToCss`, add the `<link rel="stylesheet">` to `index.html` yourself (or pass `themeToCss(theme, { includeFontImport: true })` when the result is a standalone stylesheet).

Or render it as a component near your app root:

```tsx
import { TimbalThemeStyle } from "@timbal-ai/timbal-react";

<TimbalThemeStyle theme={createTimbalTheme({ brand: "#4f46e5" })} />
// or: <TimbalThemeStyle preset="indigo" />
```

### Presets + the picker

A small closed catalog (`TIMBAL_THEME_PRESETS`) lets you offer styles by stable id and apply on selection. Each preset is a **full personality** (color + radius + shadows + font), not just a color: `platform` (system), `indigo` (Geist), `violet` (Sora), `forest`/`warm` (Lexend), `slate` (Inter), `folio` (Fraunces serif), `carbon` (JetBrains Mono). `ThemePresetGallery` previews each option with real components, scoped so the live app doesn't change until the user picks:

```tsx
import { ThemePresetGallery, applyThemePreset } from "@timbal-ai/timbal-react";

<ThemePresetGallery value={id} onSelect={(next) => { setId(next); applyThemePreset(next); }} />
```

`applyThemePreset` persists the choice to `localStorage` (`timbal-theme-preset`); `getStoredThemePreset()` restores it on reload.

**For UI-generation agents:** inject `THEME_AGENT_INSTRUCTIONS` into the system prompt so the model themes via these APIs (and never emits raw OKLCH), mirroring `APP_KIT_AGENT_INSTRUCTIONS`.

### Anti-slop guardrails for generated UIs

When an agent composes app-kit UIs, taste is enforced — not just suggested — through three layers built on one shared vocabulary (`HOUSE_RULES`, `SEMANTIC_COLOR_TOKENS`, `SLOP_BUDGETS`):

```ts
import {
  lintGeneratedUi,
  reviewGeneratedUi,
  UI_REVIEW_AGENT_INSTRUCTIONS,
} from "@timbal-ai/timbal-react"; // or "/app"

// 1. Prompt: APP_KIT_AGENT_INSTRUCTIONS renders its anti-slop checklist from
//    HOUSE_RULES; add UI_REVIEW_AGENT_INSTRUCTIONS so the model self-reviews.
const systemPrompt = `${basePrompt}\n\n${APP_KIT_AGENT_INSTRUCTIONS}\n\n${UI_REVIEW_AGENT_INSTRUCTIONS}`;

// 2. Lint: deterministic checks reject hardcoded palette colors / hex / oklch
//    (errors) and flag icon-spam, bold giant values, per-row dividers, and
//    gradients on data surfaces (warnings).
const { ok, findings } = lintGeneratedUi(generatedTsx);

// 3. Critique loop: review → fix → re-review until it passes clean.
const review = reviewGeneratedUi(generatedTsx, { strict: true });
if (!review.passed) regenerate(review.revisionPrompt); // names the exact lines + fixes
```

Color decisions belong to the theme generator and semantic tokens, never to the per-component agent — the linter enforces exactly that.

### CSS imports

Import these stylesheets once in your app entry:

```ts
// src/main.tsx
import "@assistant-ui/react-markdown/styles/dot.css";
import "katex/dist/katex.min.css";
```

---

## Quick start

### Basic usage

`TimbalChat` is a single component that handles everything — runtime, streaming, messages, and the composer:

```tsx
import { TimbalChat } from "@timbal-ai/timbal-react";

export default function App() {
  return (
    <div style={{ height: "100vh" }}>
      <TimbalChat workforceId="your-workforce-id" />
    </div>
  );
}
```

> `TimbalChat` requires a fixed height parent. Use `height: "100vh"` or `flex-1 min-h-0` depending on your layout.

### Welcome screen and suggestions

```tsx
<TimbalChat
  workforceId="your-workforce-id"
  welcome={{
    heading: "Hi, I'm your assistant",
    subheading: "Ask me anything about your data.",
  }}
  suggestions={[
    { title: "Summarize this week", description: "Get a quick overview of recent activity" },
    { title: "What can you help with?" },
    { title: "Show me the latest report" },
  ]}
/>
```

Suggestions also accept a function (sync or async) for per-user or server-driven chips:

```tsx
<TimbalChat
  workforceId="your-workforce-id"
  suggestions={async () => {
    const res = await authFetch("/api/suggestions");
    return res.json(); // ThreadSuggestion[]
  }}
/>
```

Each chip supports `icon`, `description`, and `prompt` (sent instead of `title` when clicked).

In `AppChatPanel` (`variant="panel"`), welcome suggestions are **off** by default. Enable them with `showWelcomeSuggestions`:

```tsx
<AppChatPanel
  workforceId="your-workforce-id"
  showWelcomeSuggestions
  suggestions={[{ title: "Summarize this dashboard" }]}
/>
```

### Placeholder and width

```tsx
<TimbalChat
  workforceId="your-workforce-id"
  composerPlaceholder="Type a question..."
  maxWidth="60rem"
  className="my-custom-class"
/>
```

### Switching agents dynamically

Pass `key` to fully reset the chat when the workforce changes:

```tsx
const [workforceId, setWorkforceId] = useState("agent-a");

<select onChange={(e) => setWorkforceId(e.target.value)}>
  <option value="agent-a">Agent A</option>
  <option value="agent-b">Agent B</option>
</select>

<TimbalChat workforceId={workforceId} key={workforceId} />
```

### Studio shell (sidebar + header + chat)

`TimbalStudioShell` is the most opinionated layout — a floating workforce sidebar, a top bar for actions (mode toggle, account), and a full-height `TimbalChat`. Works as a one-line app:

```tsx
import {
  TimbalStudioShell,
  ModeToggle,
  TimbalMark,
} from "@timbal-ai/timbal-react";
import { useTheme } from "next-themes";

export default function App() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <TimbalStudioShell
      brand={<TimbalMark size={32} />}
      welcome={{ heading: "How can I help you today?" }}
      headerActions={
        <ModeToggle theme={resolvedTheme} setTheme={setTheme} />
      }
      suggestions={[{ title: "Get started" }]}
      attachments
    />
  );
}
```

When `workforceId` is omitted, the shell fetches the workforce list and lets the sidebar drive selection. Pass `workforceId` to pin a single agent and hide the picker UI.

Apps that need finer control can compose the public building blocks (`StudioSidebar` + `TimbalChat`) directly:

```tsx
import { StudioSidebar, TimbalChat } from "@timbal-ai/timbal-react";

function MyShell() {
  const [agent, setAgent] = useState("agent-a");
  return (
    <div className="relative h-dvh bg-background">
      <StudioSidebar selectedId={agent} onSelect={setAgent} />
      <main className="h-full pl-[var(--studio-inset-left)]">
        <TimbalChat workforceId={agent} key={agent} />
      </main>
    </div>
  );
}
```

`--studio-inset-left` is a **static** CSS variable (the expanded sidebar width) — good for layouts where the sidebar never collapses. It does **not** track the collapse animation on its own.

To inset a main column that follows the sidebar as it collapses, use `AppShell`, which wires the tracking automatically:

```tsx
import { AppShell, StudioSidebar } from "@timbal-ai/timbal-react";

function MyShell() {
  const [agent, setAgent] = useState("agent-a");
  return (
    <AppShell sidebar={<StudioSidebar selectedId={agent} onSelect={setAgent} />}>
      {/* main content insets + animates with the sidebar */}
    </AppShell>
  );
}
```

For a fully custom shell, drive your own offset from `StudioSidebar`'s `onInsetChange` callback, which fires with the live inset width (px) whenever the collapse state changes.

### Drop-in shell (header + agent picker)

`TimbalChatShell` wraps the common blueprint layout: brand area, workforce selector, optional header actions, and a full-height chat. When `workforceId` is omitted, it fetches `{baseUrl}/workforce` and selects the first agent automatically:

```tsx
import { TimbalChatShell, Button, useSession } from "@timbal-ai/timbal-react";

export default function App() {
  const { logout, isAuthenticated } = useSession();

  return (
    <TimbalChatShell
      brand={<span className="font-semibold">Acme AI</span>}
      headerActions={
        isAuthenticated ? (
          <Button variant="ghost" size="sm" onClick={logout}>
            Log out
          </Button>
        ) : null
      }
      welcome={{ heading: "How can I help you today?" }}
      suggestions={[{ title: "Get started" }]}
    />
  );
}
```

Pass `workforceId` to lock the agent and hide the built-in selector. Use `hideWorkforceSelector` when you render your own picker.

### Workforce list hook

For custom layouts (sidebar tree, command palette), use `useWorkforces` with the optional `WorkforceSelector`:

```tsx
import {
  TimbalChat,
  useWorkforces,
  WorkforceSelector,
} from "@timbal-ai/timbal-react";

function ChatWithPicker() {
  const { workforces, selectedId, setSelectedId, isLoading } = useWorkforces();

  if (isLoading) return <div>Loading agents…</div>;

  return (
    <div className="flex h-screen flex-col">
      <WorkforceSelector
        workforces={workforces}
        value={selectedId}
        onChange={setSelectedId}
      />
      <TimbalChat workforceId={selectedId} key={selectedId} className="min-h-0 flex-1" />
    </div>
  );
}
```

`useWorkforces` accepts `baseUrl`, `fetch`, and `pickInitial` (custom resolver for the default selection). It returns `selected`, `error`, and `refresh()` as well.

---

## Splitting the runtime and UI

`TimbalChat` is a convenience wrapper around `TimbalRuntimeProvider` + `Thread`. Use them separately when you need to place the runtime above the chat — for example, to build a custom header that reads or controls chat state:

```tsx
import { TimbalRuntimeProvider, Thread } from "@timbal-ai/timbal-react";

export default function App() {
  return (
    <TimbalRuntimeProvider workforceId="your-workforce-id">
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <header>My App</header>
        <Thread
          composerPlaceholder="Ask anything..."
          className="flex-1 min-h-0"
        />
      </div>
    </TimbalRuntimeProvider>
  );
}
```

### Custom API base URL

Useful when your API is mounted at a subpath (e.g. behind a reverse proxy):

```tsx
<TimbalRuntimeProvider workforceId="your-workforce-id" baseUrl="/api">
  <Thread />
</TimbalRuntimeProvider>
```

### Attachments

Attachments are **opt-in**. Pass `attachments` to enable the composer `+` button, drag-and-drop, and multimodal prompts:

```tsx
<TimbalChat workforceId="your-workforce-id" attachments />
```

When enabled, each file is uploaded via `POST` to `${baseUrl}/files/upload` (multipart `file` field). The response must include `{ url }` (or `{ signed_url }` / `{ id }`). That URL is sent to the workforce as `{ type: "file", file: "<url>" }` alongside `{ type: "text", text: "..." }` when the user typed a message.

Your API must expose that upload route (the Timbal blueprint API includes it). `authFetch` is used by default and must **not** force a `Content-Type` header on `FormData` uploads.

#### Variants

```tsx
// Default upload adapter
<TimbalChat workforceId="..." attachments />

// Custom endpoint or MIME whitelist
<TimbalChat
  workforceId="..."
  attachments={{ uploadUrl: "/api/uploads", accept: "image/*,application/pdf" }}
/>

// Fully custom adapter (e.g. presigned S3)
<TimbalChat workforceId="..." attachments={myAdapter} />

// Explicitly off (default when prop is omitted)
<TimbalChat workforceId="..." attachments={null} />
```

#### Power-user exports

```tsx
import {
  createDefaultAttachmentAdapter,
  createUploadAttachmentAdapter,
  resolveAttachmentAdapter,
  parseSSELine,
  AssistantRuntimeProvider,
  useTimbalStream,
} from "@timbal-ai/timbal-react";
```

`parseSSELine` and `AssistantRuntimeProvider` are re-exported so custom runtimes do not need a second `@assistant-ui/react` import for those symbols. `useTimbalStream` exposes the same SSE reducer and `send` / `reload` / `cancel` API without mounting `<Thread>`.

### Custom fetch function

Pass your own `fetch` to add headers, inject tokens, or proxy requests:

```tsx
const myFetch: typeof fetch = (url, options) => {
  return fetch(url, {
    ...options,
    headers: { ...options?.headers, "X-My-Header": "value" },
  });
};

<TimbalRuntimeProvider workforceId="your-workforce-id" fetch={myFetch}>
  <Thread />
</TimbalRuntimeProvider>
```

---

## Customizing the UI

Use the `components` prop on `TimbalChat` or `Thread` to replace any part of the interface while keeping everything else as the default.

### Available slots

| Slot | Props forwarded | Default |
|---|---|---|
| `UserMessage` | none | built-in user bubble |
| `AssistantMessage` | none | built-in assistant bubble |
| `EditComposer` | none | built-in inline edit composer |
| `Composer` | `placeholder` (+ full `ComposerProps`) | built-in composer bar |
| `Welcome` | `config`, `suggestions`, `Suggestions` | built-in welcome screen |
| `Suggestions` | `suggestions` | built-in suggestion chips |
| `ScrollToBottom` | none | built-in scroll button |

Custom slot components read their data via hooks — no props are passed automatically except where noted above.

### Custom user message

```tsx
import { TimbalChat, MessagePrimitive } from "@timbal-ai/timbal-react";

const CompactUserMessage = () => (
  <MessagePrimitive.Root className="flex justify-end px-4 py-2">
    <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-2 text-sm max-w-[75%]">
      <MessagePrimitive.Parts />
    </div>
  </MessagePrimitive.Root>
);

<TimbalChat workforceId="..." components={{ UserMessage: CompactUserMessage }} />
```

### Custom composer

The `Composer` slot receives `placeholder` from the `composerPlaceholder` prop:

```tsx
import { TimbalChat, ComposerPrimitive } from "@timbal-ai/timbal-react";

const MinimalComposer = ({ placeholder }: { placeholder?: string }) => (
  <ComposerPrimitive.Root className="flex items-center gap-2 border rounded-full px-4 py-2">
    <ComposerPrimitive.Input
      placeholder={placeholder ?? "Type here..."}
      className="flex-1 bg-transparent text-sm outline-none"
      rows={1}
    />
    <ComposerPrimitive.Send className="text-primary font-medium text-sm">
      Send
    </ComposerPrimitive.Send>
  </ComposerPrimitive.Root>
);

<TimbalChat workforceId="..." components={{ Composer: MinimalComposer }} />
```

### Custom welcome screen

The `Welcome` slot is always mounted and controls its own visibility. Use `useThread` to replicate the default "show only when the thread is empty" behaviour:

```tsx
import { TimbalChat, useThread, useThreadRuntime, type ThreadWelcomeProps } from "@timbal-ai/timbal-react";

const BrandedWelcome = ({ suggestions }: ThreadWelcomeProps) => {
  const isEmpty = useThread((s) => s.isEmpty);
  const runtime = useThreadRuntime();
  if (!isEmpty) return null;
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <img src="/logo.svg" className="h-12" />
      <h2 className="text-xl font-semibold">Welcome to Acme AI</h2>
      <div className="flex gap-2 flex-wrap justify-center">
        {suggestions?.map((s) => (
          <button
            key={s.title}
            onClick={() => runtime.append({ role: "user", content: [{ type: "text", text: s.title }] })}
            className="border rounded-full px-4 py-1.5 text-sm hover:bg-muted"
          >
            {s.title}
          </button>
        ))}
      </div>
    </div>
  );
};

<TimbalChat
  workforceId="..."
  suggestions={[{ title: "Get started" }, { title: "Show me an example" }]}
  components={{ Welcome: BrandedWelcome }}
/>
```

### Mixing slots

Override any combination — slots are independent of each other:

```tsx
<TimbalChat
  workforceId="..."
  components={{
    UserMessage: CompactUserMessage,
    Composer: MinimalComposer,
  }}
/>
```

### Hooks and primitives

These are re-exported from `@assistant-ui/react` for use inside custom slot components:

| Export | Use inside |
|---|---|
| `ThreadPrimitive` | Any slot |
| `MessagePrimitive` | `UserMessage`, `AssistantMessage`, `EditComposer` |
| `ComposerPrimitive` | `Composer`, `EditComposer` |
| `ActionBarPrimitive` | `UserMessage`, `AssistantMessage` |
| `useThread` | Any slot — subscribe to thread state (e.g. `isRunning`, `isEmpty`) |
| `useThreadRuntime` | Any slot — call actions (e.g. `runtime.append(...)`) |
| `useMessageRuntime` | `UserMessage`, `AssistantMessage` — edit, reload, branch |
| `useComposerRuntime` | `Composer`, `EditComposer` — access composer state |

---

## Artifacts

Agents can return structured JSON **artifacts** — charts, tables, choice widgets, and interactive UI — instead of plain text. The chat UI renders them automatically from tool results or inline ` ```timbal-artifact ` fences.

### Tell the agent about the schema

Import the ready-made instruction block and append it to your workforce system prompt (or blueprint tool-result docs):

```ts
import { ARTIFACT_AGENT_INSTRUCTIONS } from "@timbal-ai/timbal-react";

const systemPrompt = `${basePrompt}\n\n${ARTIFACT_AGENT_INSTRUCTIONS}`;
```

`ARTIFACT_AGENT_INSTRUCTIONS` documents every built-in `type` (`chart`, `table`, `question`, `html`, `json`, `ui`) and the full interactive **`ui` node palette** (hover tooltips, buttons, toggles, sliders, drag).

### Subscribe to interactive events

`ui` artifacts can fire `{ kind: "emit" }` actions (e.g. after a slider commit or drag). Handle them with `onArtifactEvent` on `Thread` or `TimbalChat`:

```tsx
<TimbalChat
  workforceId="your-workforce-id"
  onArtifactEvent={(event) => {
    console.log(event.name, event.payload);
    // e.g. refetch data, update local UI, call your API
  }}
/>
```

When using `Thread` directly:

```tsx
<TimbalRuntimeProvider workforceId="your-workforce-id">
  <Thread
    onArtifactEvent={(event) => console.log(event.name, event.payload)}
  />
</TimbalRuntimeProvider>
```

Built-in `{ kind: "message" }` actions already append a user message — you only need `onArtifactEvent` for host-side logic beyond that.

### Custom artifact renderers

Register extra `type` values or override defaults:

```tsx
<TimbalChat
  workforceId="..."
  artifacts={{
    renderers: {
      "my:widget": MyWidgetRenderer,
    },
  }}
/>
```

Extend the interactive palette with host-registered `custom` nodes:

```tsx
import {
  UiCustomNodeRegistryProvider,
  TimbalRuntimeProvider,
  Thread,
} from "@timbal-ai/timbal-react";

<UiCustomNodeRegistryProvider renderers={{ "price-card": PriceCard }}>
  <TimbalRuntimeProvider workforceId="...">
    <Thread />
  </TimbalRuntimeProvider>
</UiCustomNodeRegistryProvider>
```

---

## API reference

### `TimbalChat` props

`TimbalChat` accepts all `TimbalRuntimeProvider` props plus all `Thread` props.

| Prop | Type | Default | Description |
|---|---|---|---|
| `workforceId` | `string` | **required** | ID of the workforce to stream from |
| `baseUrl` | `string` | `"/api"` | Base URL for API calls. Posts to `{baseUrl}/workforce/{workforceId}/stream` |
| `fetch` | `(url, options?) => Promise<Response>` | `authFetch` | Custom fetch. Defaults to the built-in auth-aware fetch (Bearer token + auto-refresh) |
| `attachments` | `boolean \| { uploadUrl?, accept? } \| AttachmentAdapter \| null` | off | `true` or a config object enables the built-in upload adapter; `null` disables; omitted = off |
| `attachmentsUploadUrl` | `string` | — | Shorthand: enables the default adapter with a custom upload URL |
| `attachmentsAccept` | `string` | — | Shorthand: MIME `accept` for the default adapter |
| `debug` | `boolean` | `false` | Log every parsed SSE event to the console with a `[timbal]` prefix |
| `welcome.heading` | `string` | `"How can I help you today?"` | Welcome screen heading |
| `welcome.subheading` | `string` | `"Send a message to start a conversation."` | Welcome screen subheading |
| `suggestions` | `{ title: string; description?: string }[]` | — | Suggestion chips on the welcome screen |
| `showWelcomeSuggestions` | `boolean` | `true` (`default` variant), `false` (`panel`) | Show built-in welcome suggestions when `suggestions` is set |
| `composerPlaceholder` | `string` | `"Send a message..."` | Composer input placeholder |
| `components` | `ThreadComponents` | — | Override individual UI slots |
| `onArtifactEvent` | `(event: UiEventEnvelope) => void` | — | Called when a `ui` artifact fires an `emit` action |
| `maxWidth` | `string` | `"44rem"` | Max width of the message column |
| `className` | `string` | — | Extra classes on the root element |

### `Thread` props

Same as `TimbalChat` minus `workforceId`, `baseUrl`, and `fetch` (those live on `TimbalRuntimeProvider`).

### `TimbalRuntimeProvider` props

| Prop | Type | Default | Description |
|---|---|---|---|
| `workforceId` | `string` | **required** | ID of the workforce to stream from |
| `baseUrl` | `string` | `"/api"` | Base URL for API calls |
| `fetch` | `(url, options?) => Promise<Response>` | `authFetch` | Custom fetch function |
| `attachments` | same as `TimbalChat` | off | Enable uploads on the runtime (usually set on `TimbalChat` instead) |
| `attachmentsUploadUrl` | `string` | — | Shorthand upload URL for the default adapter |
| `attachmentsAccept` | `string` | — | Shorthand MIME accept for the default adapter |
| `debug` | `boolean` | `false` | SSE debug logging (see above) |

### `TimbalChatShell` props

Extends all `TimbalChat` props except `workforceId` is optional.

| Prop | Type | Default | Description |
|---|---|---|---|
| `workforceId` | `string` | auto from API | When set, skips fetching and hides the built-in selector |
| `brand` | `ReactNode` | — | Logo or title at the start of the header |
| `headerActions` | `ReactNode` | — | Trailing header content (logout, theme toggle, etc.) |
| `hideWorkforceSelector` | `boolean` | `false` | Hide the built-in `<select>` even when multiple agents exist |
| `className` | `string` | — | Classes on the outer `h-screen` flex container |
| `headerClassName` | `string` | — | Classes on the header bar |

---

## Auth

The package includes an optional session/auth system backed by localStorage tokens. The API is expected to expose `/api/auth/login`, `/api/auth/logout`, and `/api/auth/refresh`.

Auth is **opt-in** — it only activates when `VITE_TIMBAL_PROJECT_ID` is set in your environment.

### Setup

Wrap your app with `SessionProvider` and protect routes with `AuthGuard`:

```tsx
// src/App.tsx
import { SessionProvider, AuthGuard, TooltipProvider } from "@timbal-ai/timbal-react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

const isAuthEnabled = !!import.meta.env.VITE_TIMBAL_PROJECT_ID;

export default function App() {
  return (
    <SessionProvider enabled={isAuthEnabled}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthGuard requireAuth enabled={isAuthEnabled}>
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </AuthGuard>
        </BrowserRouter>
      </TooltipProvider>
    </SessionProvider>
  );
}
```

When `enabled` is `false`, both `SessionProvider` and `AuthGuard` are transparent — no redirects, no API calls.

### Embedding in an iframe

When the app runs inside an iframe, `SessionProvider` detects embedding and skips the normal cookie refresh flow. Instead:

1. The child posts `{ type: "timbal:request-session" }` to `window.parent`.
2. The parent responds with `{ type: "timbal:auth", token: "<access>", refreshToken?: "<refresh>" }`.
3. Tokens are stored in localStorage and `fetchCurrentUser()` runs as usual.

`useSession()` exposes `isEmbedded: boolean` so you can adjust UI (e.g. hide logout redirects that assume a top-level window).

```tsx
// Parent page
iframe.contentWindow?.postMessage(
  { type: "timbal:auth", token: accessToken, refreshToken },
  "*",
);

window.addEventListener("message", (e) => {
  if (e.data?.type === "timbal:request-session") {
    // inject tokens as above
  }
});
```

### `useSession` hook

Access the current session anywhere inside `SessionProvider`:

```tsx
import { useSession } from "@timbal-ai/timbal-react";

function Header() {
  const { user, isAuthenticated, isEmbedded, loading, logout } = useSession();
  if (loading) return null;
  return (
    <header>
      {isAuthenticated ? (
        <>
          <span>{user?.email}</span>
          <button onClick={logout}>Log out</button>
        </>
      ) : (
        <a href="/login">Log in</a>
      )}
    </header>
  );
}
```

### `authFetch`

A drop-in replacement for `fetch` that attaches the Bearer token from localStorage and auto-refreshes on 401. It's also the default `fetch` used by `TimbalRuntimeProvider`, so you only need to import it directly for your own API calls (e.g. loading workforce lists):

```tsx
import { authFetch } from "@timbal-ai/timbal-react";

const res = await authFetch("/api/workforce");
if (res.ok) {
  const agents = await res.json();
}
```

### Auth prop reference

| Component | Prop | Type | Default | Description |
|---|---|---|---|---|
| `SessionProvider` | `enabled` | `boolean` | `true` | When `false`, session is always `null` and no API calls are made |
| `AuthGuard` | `requireAuth` | `boolean` | `false` | Redirect to login if not authenticated |
| `AuthGuard` | `enabled` | `boolean` | `true` | When `false`, renders children unconditionally |

---

## Other exports

### Components

| Export | Description |
|---|---|
| `TimbalStudioShell` | Floating sidebar + top bar + full-height `TimbalChat`. Most opinionated layout |
| `StudioSidebar` | Floating workforce sidebar — collapses, mobile drawer, runtime portal anchor |
| `ModeToggle` | Sun/moon theme toggle styled for the studio top bar |
| `TimbalMark` | Liquid-metal brand mark — drop-in welcome icon |
| `StudioWelcome` | Welcome screen with `TimbalMark` + staggered intro animation |
| `TimbalChatShell` | Header + workforce picker + full-height `TimbalChat` |
| `Thread` | Full chat UI — messages, composer, attachments, action bar |
| `Composer` | Standalone composer bar (for custom thread layouts) |
| `Suggestions` | Suggestion chip grid/row; use with `useResolvedSuggestions` |
| `WorkforceSelector` | Styled native `<select>` for agent switching |
| `MarkdownText` | Markdown renderer with GFM, math (KaTeX), and syntax highlighting |
| `ToolFallback` | Animated "Using tool: …" indicator shown while a tool runs |
| `ARTIFACT_AGENT_INSTRUCTIONS` | Markdown block to paste into agent system prompts |
| `ArtifactRegistryProvider` | Scope custom artifact renderers |
| `UiEventProvider` | Low-level provider for `ui` artifact `emit` actions |
| `UiCustomNodeRegistryProvider` | Register `{ kind: "custom" }` node renderers |
| `ArtifactView` | Render a single artifact object |
| `parseArtifactFromToolResult` | Parse tool output into an artifact |
| `TooltipIconButton` | Icon button with a tooltip |

### Hooks

| Export | Description |
|---|---|
| `useWorkforces` | Fetch `{baseUrl}/workforce` and track selection |
| `useTimbalStream` | Low-level SSE chat state without `<Thread>` |
| `useTimbalRuntime` | Access runtime context inside custom providers |
| `useResolvedSuggestions` | Resolve static/async `SuggestionsSource` to an array |
| `useOptionalSession` | Same as `useSession` but returns `null` when no `SessionProvider` is mounted |

### UI primitives

Radix-backed wrappers pre-styled with the design tokens (`bg-popover`, `border-border`, `shadow-card`, …) — import from `@timbal-ai/timbal-react/ui` or the root. Use these instead of `npx shadcn`; raw shadcn references token names the app doesn't define and renders unstyled.

**Control-surface contract.** Every input, select / dropdown trigger, and search field shares **one** skin so they match side by side regardless of origin. Build custom controls by composing it — never hand-roll a `rounded-* border-input bg-…` surface:

```tsx
import { controlClass, overlaySurfaceClass, overlayItemClass } from "@timbal-ai/timbal-react/ui";

<input className={controlClass({}, "w-full")} />            {/* field shape, h-10 */}
<button className={controlClass({ shape: "pill", size: "sm" })} />  {/* chrome pill */}
```

`controlClass({ size, shape })` — `size`: `"sm" | "default"`; `shape`: `"field"` (rounded-lg, default) or `"pill"` (chrome rows). Floating panels (popover, menu, listbox) compose `overlaySurfaceClass` + `overlayItemClass`. Vendoring a new shadcn primitive means swapping its inline surface string for these before shipping.

- **Button:** `Button`
- **Dialog:** `Dialog` · `DialogTrigger` · `DialogContent` · `DialogTitle` · `DialogDescription` · `DialogHeader` · `DialogFooter` · `DialogClose` · `DialogOverlay` · `DialogPortal`
- **Dropdown menu:** `DropdownMenu` · `DropdownMenuTrigger` · `DropdownMenuContent` · `DropdownMenuItem` · `DropdownMenuCheckboxItem` · `DropdownMenuRadioGroup` · `DropdownMenuRadioItem` · `DropdownMenuLabel` · `DropdownMenuSeparator` · `DropdownMenuShortcut` · `DropdownMenuGroup` · `DropdownMenuSub` · `DropdownMenuSubTrigger` · `DropdownMenuSubContent`
- **Popover:** `Popover` · `PopoverTrigger` · `PopoverContent` · `PopoverAnchor`
- **Select:** `Select` · `SelectTrigger` · `SelectValue` · `SelectContent` · `SelectItem` · `SelectGroup` · `SelectLabel` · `SelectSeparator` · `SelectScrollUpButton` · `SelectScrollDownButton`
- **Tooltip:** `Tooltip` · `TooltipTrigger` · `TooltipContent` · `TooltipProvider`
- **Avatar:** `Avatar` · `AvatarImage` · `AvatarFallback`
- **Form:** `Input` · `Textarea` · `Label` · `Checkbox` · `Switch` · `RadioGroup` · `RadioGroupItem` · `Form` (+ field/item/label/control/message/submit)
- **Navigation / chrome:** `Breadcrumb` (+ list/item/link/page/separator/ellipsis) · `Pagination` (+ content/item/link/previous/next/ellipsis) · `Menubar` (+ sub-parts) · `NavigationMenu` (+ sub-parts) · `Toolbar` (+ button/separator/toggle/link)
- **Command & date:** `Command` (+ dialog/input/list/group/item/…) · `Calendar` · `Combobox` (Popover + Command) · `DatePicker` (Popover + Calendar)
- **Input OTP:** `InputOTP` · `InputOTPGroup` · `InputOTPSlot` · `InputOTPHiddenInput` · `InputOTPSeparator` (Radix OTP field via unified `radix-ui`)
- **Misc:** `Kbd` · `KbdGroup` · `Shimmer`
- **Feedback / data:** `Slider` · `Progress` · `Badge`
- **Overlays:** `Sheet` · `AlertDialog` · `HoverCard` · `ContextMenu` (+ sub-parts) · `Toast` / `Toaster` / `toast()` / `useToast`
- **Surfaces:** `Card` (+ header/footer/title/description/content) · `Alert` · `Skeleton` · `Table` (+ header/body/row/cell)
- **Toggles:** `Toggle` · `ToggleGroup` · `Collapsible` · `ScrollArea`
- **Section navigation (pill switcher):** `PillSegmentedTabs` · `SubNav` (app kit) — **not** shadcn `Tabs`; Radix `Tabs` is not exported
- **Layout / disclosure:** `Accordion` · `AccordionItem` · `AccordionTrigger` · `AccordionContent` · `Separator` · `AspectRatio`
- **Input chrome:** `InputGroup` (+ addon/control/text) · `Spinner`

**Motion is built in.** Dialog, AlertDialog, Sheet, Popover, DropdownMenu, Select, Tooltip, Toast, NavigationMenu, and Accordion / Collapsible animate out of the box (fade / zoom / slide / height). The animation engine is **inlined in `styles.css`** — no `tailwindcss-animate` / `tw-animate-css` dependency and no consumer config. Duration flows from any `duration-*` utility (`--tw-duration`, default 150ms). When composing a custom overlay, reuse `overlayAnimationClass` rather than adding another animation library.

All primitives are Radix-backed (via the unified `radix-ui` package) or thin wrappers (`cmdk` for Command, `react-day-picker` for Calendar) and styled with the design tokens + the control-surface contract, so a new primitive matches the rest on arrival. Browse them live in the app-kit example: the **UI primitives** library (per-family audit) and the **Blocks** library (composed sections — Project settings, Confirm flow, Detail sheet, Empty states, Sign-in).

---

## Full example

App shell with optional auth, using `TimbalChatShell` (agent list + chat in one component):

```tsx
// src/App.tsx
import {
  SessionProvider,
  AuthGuard,
  TooltipProvider,
  TimbalChatShell,
} from "@timbal-ai/timbal-react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

const isAuthEnabled = !!import.meta.env.VITE_TIMBAL_PROJECT_ID;

export default function App() {
  return (
    <SessionProvider enabled={isAuthEnabled}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthGuard requireAuth enabled={isAuthEnabled}>
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </AuthGuard>
        </BrowserRouter>
      </TooltipProvider>
    </SessionProvider>
  );
}
```

```tsx
// src/pages/Home.tsx
import { TimbalChatShell, Button, useSession } from "@timbal-ai/timbal-react";
import { LogOut } from "lucide-react";

const isAuthEnabled = !!import.meta.env.VITE_TIMBAL_PROJECT_ID;

export default function Home() {
  const { logout, isAuthenticated } = useSession();

  return (
    <TimbalChatShell
      brand={<span className="text-sm font-semibold">My App</span>}
      headerActions={
        isAuthEnabled && isAuthenticated ? (
          <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out">
            <LogOut className="size-4" />
          </Button>
        ) : null
      }
      welcome={{ heading: "How can I help you today?" }}
      suggestions={[
        { title: "Summarize this week", description: "Recent activity at a glance" },
        { title: "What can you help with?" },
      ]}
      attachments
      debug={import.meta.env.DEV}
    />
  );
}
```

For a fully custom header, combine `useWorkforces` with `TimbalChat` instead of `TimbalChatShell` (see [Workforce list hook](#workforce-list-hook)).

---

## Dashboard + side copilot (`./app`)

Compose a data UI with a **floating** copilot — main content stays full width:

```tsx
import {
  AppShell,
  AppShellTopbar,
  AppCopilotProvider,
  AppChatPanel,
  Page,
  Section,
} from "@timbal-ai/timbal-react/app";

export function OperationsApp() {
  return (
    <AppCopilotProvider value={{ page: "Operations", tab: "overview" }}>
      <AppShell
        sidebar={<StudioSidebar /* … */ />}
        topbar={<AppShellTopbar actions={<ModeToggle />} />}
        chat={
          <AppChatPanel workforceId="your-workforce-id" />
        }
        chatTriggerLabel="Assistant"
        chatCollapsible
      >
        <Page title="Operations">{/* dashboard */}</Page>
      </AppShell>
    </AppCopilotProvider>
  );
}
```

The shell renders a rounded floating panel (bottom-right) and a **text-only** pill trigger — no sidebar column, no chat icons. Use `useAppShellChat()` for a custom trigger; set `hideChatTrigger` if you provide your own.

| Piece | Role |
|-------|------|
| `AppCopilotProvider` | Page context via `useAppCopilotContext` (not shown in UI) |
| `AppChatPanel` | Full-height floating thread; dismiss via **X** in the corner |
| `AppShell` `chat` | Floating overlay — `chatWidth`; optional `chatHeight` (default: stretch top–bottom) |
| `LineAreaChart` / `Sparkline` | Dependency-free charts (smooth area/line/bar, hover tooltip, responsive) |
| `MetricRow` | Platform KPI strip in one card (overview metrics, no chart) |
| `MetricChartCard` | `MetricRow` + selectable flush chart (Analytics / Infrastructure) |
| `ChartPanel` `artifact` | Chrome around a `ChartArtifact` or any chart |
| `SettingsSection` / `FieldRow` / `DangerZone` / `FloatingUnsavedChangesBar` | Two-column settings page building blocks |
| `IntegrationCard` / `ConnectionRow` / `PlanBadge` / `IntegrationsEmptyState` | Integration catalog + connected list |
| `InfoCard` / `DescriptionList` / `ExpandableSection` / `ResourceCard` / `StatusDot` | Surfaces & detail views |
| `FieldTextarea` / `FieldSelect` / `FieldSwitch` | Settings forms matching `FieldInput` |
| `AppConfirmDialog` | Delete/export confirmations |

Inject `APP_KIT_AGENT_INSTRUCTIONS` into codegen / workforce prompts (same idea as `ARTIFACT_AGENT_INSTRUCTIONS`). Agents should compose **creatively** from the component menu — not clone a single demo layout.

```ts
import { APP_KIT_AGENT_INSTRUCTIONS } from "@timbal-ai/timbal-react/app";

const systemPrompt = `${basePrompt}\n\n${APP_KIT_AGENT_INSTRUCTIONS}`;
```

| Examples | Purpose |
|----------|---------|
| [`examples/app-kit/src/recipes/`](examples/app-kit/src/recipes/) | Short patterns (metrics, table, forms, copilot, …) — **preferred for agents** |
| [`examples/app-kit/src/reference/`](examples/app-kit/src/reference/) | One full wired dashboard — **reference only** |

Browse locally: [`examples/app-kit`](examples/app-kit) (`bun run example:app`).

---

## Migrating from 0.5 to 0.6

- Source layout is now grouped by domain: `src/chat/`, `src/studio/`, `src/app/`, `src/ui/`.
- Optional subpath imports: `@timbal-ai/timbal-react/chat`, `/studio`, `/ui`, `/app`.
- Message column helpers moved to the library: import `threadMessageColumnClass` from `./chat` instead of copying class strings.
- New **app kit** (`./app`): `AppShell`, `Page`, `StatTile`, `DataTable`, etc. See [`examples/app-kit`](examples/app-kit).
- Newly exported types: `ThreadVariant` (main entry) and the content-part types `ContentPart`, `TextContentPart`, `ToolCallContentPart`, `ThinkingContentPart` (from `./chat`).

The main entry still exports the high-level surface (`TimbalChat`, `Thread`, the runtime hooks, …), so existing `import { TimbalChat } from "@timbal-ai/timbal-react"` apps keep working. Some lower-level helpers now live only on the subpath entries (`./chat`, `./ui`, `./studio`, `./app`).

## Migrating from 0.4 to 0.5

`0.5.0` slims the public API to the surface that blueprint apps actually use. Every feature still works — only the export list changed.

### Re-brand via CSS variables, not internals

All sizing and class composites moved to internal modules. Override the CSS variables in your own `:root` / `.dark` blocks instead of importing helper strings:

```css
:root {
  --studio-sidebar-width: 15rem;
  --studio-topbar-height: 3.25rem;
}
```

For colours, override the existing semantic tokens (`--background`, `--foreground`, `--composer-bg`, `--bubble-user`, `--playground-from/via/to`, …). See [`src/styles.css`](src/styles.css) for the full list.

### Removed from the public API

The following symbols are no longer exported. Most have no replacement because they were never meant to be public; for the rest, prefer the high-level shells or CSS-variable overrides:

- All `STUDIO_*` layout constants (`STUDIO_SIDEBAR_WIDTH`, `STUDIO_INSET_LEFT`, `STUDIO_SIDEBAR_COLLAPSED_STORAGE_KEY`, `STUDIO_SIDEBAR_PX_*`, …) — override the matching `--studio-*` CSS variables instead.
- All `studio*Class` / `studioChromeShellStyle` helpers — re-create the look with normal Tailwind classes against semantic tokens (`bg-elevated-from`, `border-border`, `shadow-card`, …).
- All `TIMBAL_V2_*` button token records and `TimbalV2Button` — use the standard `Button` export from this package; it covers the same variants. (Note: `TimbalV2Button` and several `TIMBAL_V2_*` surface tokens were re-introduced as public exports in 0.7 for catalog/list surfaces — see the CHANGELOG.)
- `StudioSidebarPanel`, `StudioSidebarHeader/Nav/Footer/Entries/Backdrop/Tooltip/RuntimePortal/EntryMotion`, `StudioSidebarContext`, `useStudioSidebarLayout`, `useStudioSidebarCollapsed`, `useSidebarCollapsePhase`, `workforceItemId/Label/Initial` — use `StudioSidebar` or `TimbalStudioShell` directly.
- `runThemeSanityCheck` — `<Thread>` already schedules the dev-only check.
- `SyntaxHighlighter`, `UserMessageAttachments`, `ComposerAttachments`, `ComposerAddAttachment`, `MessagePartPrimitive`, `ActionBarMorePrimitive`, `ErrorPrimitive`, `useAuiState`, `buttonVariants` — internal composer/markdown details. Override the `Composer` / `AssistantMessage` slot via the `components` prop if you need a custom layout.

Everything else (the three shells, primitives, hooks, auth, artifact API, design-token CSS variables) is unchanged.

---

## Examples

- [`examples/mock-ui`](examples/mock-ui) — chat + artifact gallery (mock `fetch`).
- [`examples/app-kit`](examples/app-kit) — app kit **recipes** + optional **reference** dashboard (see `APP_KIT_AGENT_INSTRUCTIONS`).

## Mock UI demo

An offline Vite app lives in [`examples/mock-ui`](examples/mock-ui). It uses a scripted mock `fetch` (no API keys) and includes a component gallery for artifacts. See that folder’s README for run instructions.

## Local development

Install via a local path reference:

```json
{
  "dependencies": {
    "@timbal-ai/timbal-react": "file:../../timbal-react"
  }
}
```

Adjust the relative path to where `timbal-react` lives on your machine.

After editing source files, rebuild `dist/` (Vite does **not** read `src/`):

```bash
cd timbal-react
bun run build        # one-off build
bun run build:watch  # rebuild on every change
```

### Vite apps linked with `file:../timbal-react`

Without extra config, Vite pre-bundles a **cached** copy under `node_modules/.vite/deps` and your UI will look stuck on an old build.

1. Add the local-dev plugin in `vite.config.ts`:

```ts
import { timbalReactLocalDev } from "@timbal-ai/timbal-react/vite";

export default defineConfig({
  plugins: [timbalReactLocalDev(), /* react(), … */],
});
```

2. Run dev with a watch build (from your app):

```bash
node ../timbal-react/scripts/dev-linked.mjs vite
```

Or use the `dev` script in `blueprint-ui-dashboard` / examples (already wired).

One-time if you still see stale UI: `rm -rf node_modules/.vite` then restart dev.
