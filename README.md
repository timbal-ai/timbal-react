# @timbal-ai/timbal-react

React components and runtime for building Timbal chat UIs. Provides a streaming chat interface that connects to Timbal workforce agents out of the box.

## Installation

```bash
npm install @timbal-ai/timbal-react
# or
bun add @timbal-ai/timbal-react
```

### Peer dependencies

```bash
npm install react react-dom @assistant-ui/react @timbal-ai/timbal-sdk
```

### Required: Tailwind setup

The package ships pre-built class names that Tailwind must scan. Add this `@source` line to your CSS entry file — **without it the components will be unstyled**:

```css
/* src/index.css */
@import "tailwindcss";

@source "../node_modules/@timbal-ai/timbal-react/dist";
```

> Adjust the path if your CSS file lives at a different depth relative to `node_modules`.

### Required: CSS imports

Import these stylesheets once in your app entry:

```ts
// src/main.tsx
import "@assistant-ui/react-markdown/styles/dot.css";
import "katex/dist/katex.min.css";
```

---

## Usage

### One-liner

The simplest way to embed a chat UI. `TimbalChat` handles the runtime and the thread in one component:

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

#### With welcome screen and suggestions

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

#### With a custom placeholder and width

```tsx
<TimbalChat
  workforceId="your-workforce-id"
  composerPlaceholder="Type a question..."
  maxWidth="60rem"
  className="my-custom-class"
/>
```

#### Switching agents dynamically

Use `key` to reset the chat when the workforce changes:

```tsx
const [workforceId, setWorkforceId] = useState("agent-a");

<select onChange={(e) => setWorkforceId(e.target.value)}>
  <option value="agent-a">Agent A</option>
  <option value="agent-b">Agent B</option>
</select>

<TimbalChat workforceId={workforceId} key={workforceId} />
```

---

### Compose manually

Use `TimbalRuntimeProvider` + `Thread` separately when you need to place the runtime above the chat UI — for example, to build a custom header that reads or controls chat state:

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

#### With a custom API base URL

Useful when your API is mounted at a subpath (e.g. behind a reverse proxy):

```tsx
<TimbalRuntimeProvider workforceId="your-workforce-id" baseUrl="/api">
  <Thread />
</TimbalRuntimeProvider>
```

#### With a custom fetch function

Pass your own `fetch` to add headers, inject tokens, or proxy requests:

```tsx
import { TimbalRuntimeProvider, Thread } from "@timbal-ai/timbal-react";

const myFetch: typeof fetch = (url, options) => {
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      "X-My-Header": "value",
    },
  });
};

<TimbalRuntimeProvider workforceId="your-workforce-id" fetch={myFetch}>
  <Thread />
</TimbalRuntimeProvider>
```

---

### `TimbalChat` / `Thread` props

| Prop | Type | Default | Description |
|---|---|---|---|
| `welcome.heading` | `string` | `"How can I help you today?"` | Welcome screen heading |
| `welcome.subheading` | `string` | `"Send a message to start a conversation."` | Welcome screen subheading |
| `suggestions` | `{ title: string; description?: string }[]` | — | Suggestion chips on the welcome screen |
| `composerPlaceholder` | `string` | `"Send a message..."` | Composer input placeholder |
| `maxWidth` | `string` | `"44rem"` | Max width of the message column |
| `className` | `string` | — | Extra classes on the root element |

### `TimbalRuntimeProvider` props

| Prop | Type | Default | Description |
|---|---|---|---|
| `workforceId` | `string` | — | ID of the workforce to stream from |
| `baseUrl` | `string` | `"/api"` | Base URL for API calls. Posts to `{baseUrl}/workforce/{workforceId}/stream` |
| `fetch` | `(url, options?) => Promise<Response>` | `authFetch` | Custom fetch function. Defaults to the built-in auth-aware fetch (Bearer token + auto-refresh) |

---

## Auth

The package includes a session/auth system backed by localStorage tokens. The API is expected to expose `/api/auth/login`, `/api/auth/logout`, and `/api/auth/refresh`.

### Setup

Wrap your app with `SessionProvider` and protect routes with `AuthGuard`:

```tsx
// src/App.tsx
import { SessionProvider, AuthGuard, TooltipProvider } from "@timbal-ai/timbal-react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

// Auth is opt-in — only active when VITE_TIMBAL_PROJECT_ID is set
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

When `enabled` is `false` (no project ID configured), both `SessionProvider` and `AuthGuard` are transparent — no redirects, no API calls.

### `SessionProvider` props

| Prop | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `true` | When `false`, session is always `null` and no API calls are made |

### `AuthGuard` props

| Prop | Type | Default | Description |
|---|---|---|---|
| `requireAuth` | `boolean` | `false` | Redirect to login if not authenticated |
| `enabled` | `boolean` | `true` | When `false`, renders children unconditionally |

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

A drop-in replacement for `fetch` that attaches the Bearer token from localStorage and auto-refreshes on 401:

```tsx
import { authFetch } from "@timbal-ai/timbal-react";

// Fetch a list of workforce agents
const res = await authFetch("/api/workforce");
if (res.ok) {
  const agents = await res.json();
}
```

It's also the default `fetch` used by `TimbalRuntimeProvider` — you only need to import it directly for your own API calls (e.g. loading workforce lists, metadata, etc.).

---

## Components

All components accept `className` for Tailwind overrides.

| Export | Description |
|---|---|
| `Thread` | Full chat UI — messages, composer, attachments, action bar |
| `MarkdownText` | Markdown renderer with GFM, math (KaTeX), and syntax highlighting |
| `ToolFallback` | Animated "Using tool: …" indicator shown while a tool runs |
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
import {
  TimbalChat,
  Button,
  authFetch,
  useSession,
} from "@timbal-ai/timbal-react";
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
// package.json
{
  "dependencies": {
    "@timbal-ai/timbal-react": "file:../../timbal-react"
  }
}
```

Adjust the relative path to where `timbal-react` lives on your machine.

After editing source files, rebuild the package:

```bash
cd timbal-react
bun run build        # one-off build
bun run build:watch  # rebuild on every change
```

Vite picks up the new `dist/` automatically via HMR — no reinstall needed.
