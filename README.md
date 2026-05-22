# @timbal-ai/timbal-react

React components and runtime for building Timbal chat UIs. Drop in a single component to get a fully-featured streaming chat interface connected to a Timbal workforce agent.

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

The package ships pre-built Tailwind class names. Add this `@source` line to your CSS entry file — **without it the components will be unstyled**:

```css
/* src/index.css */
@import "tailwindcss";

@source "../node_modules/@timbal-ai/timbal-react/dist";
```

> Adjust the path if your CSS file lives at a different depth relative to `node_modules`.

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
  resolveAttachmentAdapter,
  parseSSELine,
  AssistantRuntimeProvider,
} from "@timbal-ai/timbal-react";
```

`parseSSELine` and `AssistantRuntimeProvider` are re-exported so custom runtimes do not need a second `@assistant-ui/react` import for those symbols.

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
| `Composer` | `placeholder` | built-in composer bar |
| `Welcome` | `config`, `suggestions` | built-in welcome screen |
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
| `welcome.heading` | `string` | `"How can I help you today?"` | Welcome screen heading |
| `welcome.subheading` | `string` | `"Send a message to start a conversation."` | Welcome screen subheading |
| `suggestions` | `{ title: string; description?: string }[]` | — | Suggestion chips on the welcome screen |
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

### `useSession` hook

Access the current session anywhere inside `SessionProvider`:

```tsx
import { useSession } from "@timbal-ai/timbal-react";

function Header() {
  const { user, isAuthenticated, loading, logout } = useSession();
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
| `Thread` | Full chat UI — messages, composer, attachments, action bar |
| `MarkdownText` | Markdown renderer with GFM, math (KaTeX), and syntax highlighting |
| `ToolFallback` | Animated "Using tool: …" indicator shown while a tool runs |
| `ARTIFACT_AGENT_INSTRUCTIONS` | Markdown block to paste into agent system prompts |
| `UiEventProvider` | Low-level provider for `ui` artifact `emit` actions |
| `UiCustomNodeRegistryProvider` | Register `{ kind: "custom" }` node renderers |
| `ArtifactView` | Render a single artifact object |
| `parseArtifactFromToolResult` | Parse tool output into an artifact |
| `SyntaxHighlighter` | Shiki-based code highlighter (vitesse-dark / vitesse-light themes) |
| `UserMessageAttachments` | Attachment thumbnails in user messages |
| `ComposerAttachments` | Attachment previews inside the composer |
| `ComposerAddAttachment` | "+" button to add attachments |
| `TooltipIconButton` | Icon button with a tooltip |

### UI primitives

Re-exported Radix UI wrappers pre-styled to match the Timbal design system:

`Button` · `Tooltip` · `TooltipTrigger` · `TooltipContent` · `TooltipProvider` · `Avatar` · `AvatarImage` · `AvatarFallback` · `Dialog` · `DialogContent` · `DialogTitle` · `DialogTrigger` · `Shimmer`

---

## Full example

A complete page with agent switching, auth, and a custom header:

```tsx
// src/pages/Home.tsx
import { useEffect, useState } from "react";
import type { WorkforceItem } from "@timbal-ai/timbal-sdk";
import { TimbalChat, Button, authFetch, useSession } from "@timbal-ai/timbal-react";
import { LogOut } from "lucide-react";

const isAuthEnabled = !!import.meta.env.VITE_TIMBAL_PROJECT_ID;

export default function Home() {
  const { logout } = useSession();
  const [workforces, setWorkforces] = useState<WorkforceItem[]>([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    authFetch("/api/workforce")
      .then((r) => r.json())
      .then((data: WorkforceItem[]) => {
        setWorkforces(data);
        const agent = data.find((w) => w.type === "agent") ?? data[0];
        if (agent) setSelectedId(agent.id ?? agent.name ?? "");
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 1.25rem" }}>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {workforces.map((w) => (
            <option key={w.id ?? w.name} value={w.id ?? w.name ?? ""}>
              {w.name}
            </option>
          ))}
        </select>

        {isAuthEnabled && (
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut />
          </Button>
        )}
      </header>

      <TimbalChat
        workforceId={selectedId}
        key={selectedId}
        className="flex-1 min-h-0"
        welcome={{ heading: "How can I help you today?" }}
      />
    </div>
  );
}
```

---

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

After editing source files, rebuild:

```bash
cd timbal-react
bun run build        # one-off build
bun run build:watch  # rebuild on every change
```

Vite picks up the new `dist/` automatically via HMR — no reinstall needed.
