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

## Tailwind setup

The package ships pre-built class names that Tailwind must scan. Add this line to your CSS entry file:

```css
/* src/index.css */
@import "tailwindcss";

@source "../node_modules/@timbal-ai/timbal-react/dist";
```

> Adjust the path if your CSS file lives at a different depth relative to `node_modules`.

## CSS imports

Some components require stylesheets from their dependencies. Import these once in your app entry:

```ts
// src/main.tsx
import "@assistant-ui/react-markdown/styles/dot.css";
import "katex/dist/katex.min.css";
```

---

## Usage

### Drop-in chat

Wrap `TimbalRuntimeProvider` with a `workforceId` and render `<Thread />` inside it:

```tsx
import { TimbalRuntimeProvider, Thread } from "@timbal-ai/timbal-react";

export default function App() {
  return (
    <TimbalRuntimeProvider workforceId="your-workforce-id">
      <div style={{ height: "100vh" }}>
        <Thread />
      </div>
    </TimbalRuntimeProvider>
  );
}
```

### `TimbalRuntimeProvider` props

| Prop | Type | Default | Description |
|---|---|---|---|
| `workforceId` | `string` | — | ID of the workforce to stream from |
| `baseUrl` | `string` | `"/api"` | Base URL for API calls. Posts to `{baseUrl}/workforce/{workforceId}/stream` |
| `fetch` | `(url, options?) => Promise<Response>` | `authFetch` | Custom fetch function. Defaults to the built-in auth-aware fetch (Bearer token + auto-refresh) |
| `devFakeStream` | `boolean` | `false` | Enable fake streaming for local dev/testing without a backend |
| `devFakeStreamDelayMs` | `number` | `75` | Token delay in ms for fake streaming |

---

## Auth

The package includes a session/auth system backed by localStorage tokens. The API is expected to expose `/api/auth/login`, `/api/auth/logout`, and `/api/auth/refresh`.

### Setup

Wrap your app with `SessionProvider` and protect routes with `AuthGuard`:

```tsx
import { SessionProvider, AuthGuard, TooltipProvider } from "@timbal-ai/timbal-react";

const isAuthEnabled = !!import.meta.env.VITE_TIMBAL_PROJECT_ID;

function App() {
  return (
    <SessionProvider enabled={isAuthEnabled}>
      <TooltipProvider>
        <AuthGuard requireAuth enabled={isAuthEnabled}>
          <YourApp />
        </AuthGuard>
      </TooltipProvider>
    </SessionProvider>
  );
}
```

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

```tsx
import { useSession } from "@timbal-ai/timbal-react";

function Header() {
  const { user, isAuthenticated, loading, logout } = useSession();
  // ...
}
```

### `authFetch`

A drop-in replacement for `fetch` that attaches the Bearer token and auto-refreshes on 401:

```tsx
import { authFetch } from "@timbal-ai/timbal-react";

const res = await authFetch("/api/workforce");
```

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

## Local development

The package isn't published yet. Install it via a local path reference:

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
