// Conversation history data layer for Timbal **app runs**.
//
// App runs are stored one row per *turn* (`OrgsAppsVersionsRuns`). A
// conversation ("thread") is the set of runs that share a `group_id`; the
// thread root is the run whose `parent_id IS NULL` (then `group_id === id`).
//
// These helpers read the host-proxied REST surface. By convention the host
// app exposes the platform `/orgs/{org}/projects/{project}/runs` endpoints
// under the same `{baseUrl}` prefix the rest of the SDK uses (`/api` by
// default), injecting org/project context + auth. The wire shapes mirror the
// platform `RunPreview` / `RunDetail` responses:
//
//   GET {baseUrl}/runs?roots=true&workforce_id=X   → { runs, next_page_token? }
//   GET {baseUrl}/runs?group_id=<rootId>           → { runs, next_page_token? }
//   GET {baseUrl}/runs/{run_id}                     → RunDetail (with `trace`)
//
// Nothing here renders UI — pair with `runTraceToMessages` /
// `conversationRunsToMessages` (see `trace-to-messages.ts`) to hydrate a
// `<Thread>` from a stored conversation, and with `useConversations` /
// `useConversation` for ready-made React state.

import { authFetch } from "../auth/tokens";

export type FetchFn = (url: string, options?: RequestInit) => Promise<Response>;

/** Mirrors BE `RunSortBy` — `created_at` is an alias of `id`. */
export type RunSortBy =
  | "id"
  | "created_at"
  | "duration_ms"
  | "cost_usd"
  | "cost_credits";

/** Mirrors BE `SortOrder`. */
export type RunSortOrder = "asc" | "desc";

export type RunStatus =
  | "running"
  | "success"
  | "error"
  | "cancelled"
  | "timeout"
  | (string & {});

export interface RunUser {
  id?: string | number;
  name?: string | null;
  email?: string | null;
  photo_url?: string | null;
}

export interface RunWorkforce {
  id?: string | number;
  name?: string | null;
  type?: string | null;
  deleted_at?: number | null;
}

/**
 * One run row as returned by the list endpoint. Root rows (`roots=true`)
 * intentionally do **not** carry thread aggregates (turn count, last message,
 * total cost) — fetch the trace via {@link getRun} when you need them.
 */
export interface RunPreview {
  id: string | number;
  /** Conversation handle. Equals `id` on the root run. */
  group_id?: string | number | null;
  /** Parent turn id; `null`/absent on the thread root. */
  parent_id?: string | number | null;
  /** Older alias some surfaces emit. */
  parent_run_id?: string | number | null;
  created_at?: string;
  status?: RunStatus;
  duration_ms?: number | null;
  cost_usd?: number | null;
  cost_credits?: number | null;
  last_reaction_sentiment?: "positive" | "negative" | null;
  user?: RunUser | null;
  workforce?: RunWorkforce | null;
  [key: string]: unknown;
}

/** A single span inside a run's flat `trace` array. */
export interface TraceSpan {
  call_id?: string | null;
  parent_call_id?: string | null;
  path?: string | null;
  metadata?: { type?: string | null } & Record<string, unknown>;
  input?: unknown;
  output?: unknown;
  error?: unknown;
  usage?: unknown;
  cost_usd?: number | null;
  cost_credits?: number | null;
  start_time?: number | null;
  end_time?: number | null;
  t0?: number | null;
  t1?: number | null;
  [key: string]: unknown;
}

/** Full run detail — the list `RunPreview` plus the span `trace`. */
export interface RunDetail extends RunPreview {
  trace?: TraceSpan[] | null;
}

export interface ListRunsResult {
  runs: RunPreview[];
  next_page_token?: string | null;
}

export interface ListRunsParams {
  /** Base URL for API calls. Default: `/api`. */
  baseUrl?: string;
  /** Custom fetch (defaults to `authFetch`). */
  fetch?: FetchFn;
  /** Path segment for the runs collection under `baseUrl`. Default: `runs`. */
  runsPath?: string;
  /** Abort signal forwarded to the request. */
  signal?: AbortSignal;

  /** Only return thread roots (`parent_id IS NULL`) — one row per conversation. */
  roots?: boolean;
  /** Scope to a single workforce component (legacy `app_id`). */
  workforceId?: string | null;
  /** Return every turn in one conversation (pass the root run's id). */
  groupId?: string | number | null;
  /** Offset pagination cursor (`0`, `50`, `100`, …). */
  pageToken?: string | null;
  /** Filter to a single user's runs (requires `projects.runs.list`). */
  userId?: string | null;
  status?: RunStatus | null;
  /** Git branch the runs executed against (query key `rev`). */
  rev?: string | null;
  sortBy?: RunSortBy | null;
  sortOrder?: RunSortOrder | null;
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const seg = path.replace(/^\/+/, "");
  return `${base}/${seg}`;
}

/**
 * List runs. Pass `roots: true` to list conversation entry points, or
 * `groupId` to list every turn inside one conversation.
 */
export async function listRuns(
  params: ListRunsParams = {},
): Promise<ListRunsResult> {
  const {
    baseUrl = "/api",
    fetch: fetchFn = authFetch,
    runsPath = "runs",
    signal,
    roots,
    workforceId,
    groupId,
    pageToken,
    userId,
    status,
    rev,
    sortBy,
    sortOrder,
  } = params;

  const query = new URLSearchParams();
  if (roots) query.set("roots", "true");
  if (workforceId) query.set("workforce_id", String(workforceId));
  if (groupId != null && String(groupId) !== "")
    query.set("group_id", String(groupId));
  if (pageToken != null && String(pageToken) !== "")
    query.set("page_token", String(pageToken));
  if (userId) query.set("user_id", userId);
  if (status) query.set("status", status);
  if (rev) query.set("rev", rev);
  if (sortBy) query.set("sort_by", sortBy);
  if (sortOrder) query.set("sort_order", sortOrder);

  const qs = query.toString();
  const url = `${joinUrl(baseUrl, runsPath)}${qs ? `?${qs}` : ""}`;
  const res = await fetchFn(url, { method: "GET", ...(signal ? { signal } : {}) });
  if (!res.ok) throw new Error(`Failed to list runs (${res.status})`);

  const data = (await res.json()) as
    | ListRunsResult
    | { success?: ListRunsResult };
  // Tolerate the platform `{ success: {...} }` envelope as well as the raw shape.
  const payload =
    data && typeof data === "object" && "success" in data && data.success
      ? data.success
      : (data as ListRunsResult);

  return {
    runs: Array.isArray(payload?.runs) ? payload.runs : [],
    next_page_token: payload?.next_page_token ?? null,
  };
}

export interface GetRunParams {
  runId: string | number;
  baseUrl?: string;
  fetch?: FetchFn;
  runsPath?: string;
  signal?: AbortSignal;
}

/** Fetch one run's full detail, including its span `trace`. */
export async function getRun(params: GetRunParams): Promise<RunDetail> {
  const {
    runId,
    baseUrl = "/api",
    fetch: fetchFn = authFetch,
    runsPath = "runs",
    signal,
  } = params;

  const url = joinUrl(baseUrl, `${runsPath}/${runId}`);
  const res = await fetchFn(url, { method: "GET", ...(signal ? { signal } : {}) });
  if (!res.ok) throw new Error(`Failed to load run ${runId} (${res.status})`);

  const data = (await res.json()) as Record<string, unknown>;
  const payload =
    data && typeof data === "object" && data.success
      ? (data.success as RunDetail)
      : (data as unknown as RunDetail);
  return payload;
}

/** Normalize the parent pointer across the `parent_id` / `parent_run_id` aliases. */
export function runParentId(run: RunPreview): string | null {
  const p = run.parent_id ?? run.parent_run_id ?? null;
  if (p == null || String(p) === "") return null;
  return String(p);
}

/** True when the run is a conversation root (no parent; `group_id === id`). */
export function isRootRun(run: RunPreview): boolean {
  if (runParentId(run) !== null) return false;
  if (run.group_id == null) return true;
  return String(run.group_id) === String(run.id);
}

/**
 * Order runs into thread sequence: depth-first by `parent_id` when present,
 * otherwise chronological by `created_at`. Mirrors the platform's
 * `orderRunsForThread`.
 */
export function orderRunsForThread<T extends RunPreview>(runs: T[]): T[] {
  if (!Array.isArray(runs) || runs.length === 0) return [];

  const list = [...runs];
  const getId = (r: T) => String(r?.id ?? "");
  const byCreated = (a: T, b: T) => {
    const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
    return ta - tb;
  };

  const anyParent = list.some((r) => runParentId(r) != null);
  if (!anyParent) return list.sort(byCreated);

  const byId = new Map<string, T>();
  for (const r of list) {
    const id = getId(r);
    if (id) byId.set(id, r);
  }

  const children = new Map<string, T[]>();
  for (const r of list) {
    const pid = runParentId(r);
    if (pid == null) continue;
    if (!children.has(pid)) children.set(pid, []);
    children.get(pid)!.push(r);
  }
  for (const kids of children.values()) kids.sort(byCreated);

  const roots = list
    .filter((r) => {
      const pid = runParentId(r);
      return pid == null || !byId.has(pid);
    })
    .sort(byCreated);

  const out: T[] = [];
  const visit = (run: T) => {
    out.push(run);
    for (const c of children.get(getId(run)) ?? []) visit(c);
  };
  for (const root of roots) visit(root);

  const seen = new Set(out.map(getId));
  const rest = list.filter((r) => !seen.has(getId(r))).sort(byCreated);
  return [...out, ...rest];
}
