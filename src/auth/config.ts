// =============================================================================
// Project config — the single public integration surface for auth modes.
//
// `GET {baseUrl}/config` answers two independent questions:
//   1. Is auth required at all? (open vs authenticated project)
//   2. If so, which login methods are enabled? (server-driven providers)
//
// The endpoint only exists when the backend runs in platform mode. A 404 means
// "not platform mode" → callers fall back to legacy behavior. A 503 means the
// platform was momentarily unreachable → retry; never guess open/closed.
// =============================================================================

export type AuthProvider = "email" | "google" | "microsoft" | "github";

export const AUTH_PROVIDERS: readonly AuthProvider[] = [
  "email",
  "google",
  "microsoft",
  "github",
];

export interface ProjectInfo {
  id: string;
  name: string;
}

export interface AuthConfig {
  /** `true` = users must log in; `false` = open project (no login at all). */
  required: boolean;
  /** The only login methods that should be rendered. Authoritative. */
  providers: AuthProvider[];
  /** Present only when SSO connections exist. Details are never exposed. */
  sso?: { enabled: boolean };
}

export interface ProjectConfig {
  project: ProjectInfo;
  auth: AuthConfig;
}

export type ConfigResult =
  | { status: "ok"; config: ProjectConfig }
  /** `/config` route not mounted (app not in platform mode) — legacy fallback. */
  | { status: "not-platform" }
  /** Platform unreachable after retries — do NOT fall open or closed. */
  | { status: "unavailable" };

export interface FetchProjectConfigOptions {
  /** Base path the config + auth routes are mounted under. Default `/api`. */
  baseUrl?: string;
  /** Number of retry attempts on 503 / network error. Default `3`. */
  retries?: number;
  /** Base backoff in ms (doubles each attempt). Default `300`. */
  retryDelayMs?: number;
  /** Custom fetch implementation (defaults to global `fetch`). */
  fetch?: typeof fetch;
  signal?: AbortSignal;
}

function isAuthProvider(value: unknown): value is AuthProvider {
  return (
    typeof value === "string" &&
    (AUTH_PROVIDERS as readonly string[]).includes(value)
  );
}

/**
 * Normalize an untrusted `/config` payload into a {@link ProjectConfig}.
 *
 * Fail-safe semantics: if `auth.required` is missing or not a boolean it is
 * coerced to `true` (login required) so a malformed payload can never
 * accidentally open a project.
 */
export function normalizeProjectConfig(raw: unknown): ProjectConfig {
  const data = (raw ?? {}) as Record<string, unknown>;

  const project = (data.project ?? {}) as Record<string, unknown>;
  const auth = (data.auth ?? {}) as Record<string, unknown>;

  const providers = Array.isArray(auth.providers)
    ? auth.providers.filter(isAuthProvider)
    : [];

  const required = typeof auth.required === "boolean" ? auth.required : true;

  const ssoRaw = auth.sso as Record<string, unknown> | undefined;
  const sso =
    ssoRaw && typeof ssoRaw === "object"
      ? { enabled: ssoRaw.enabled === true }
      : undefined;

  return {
    project: {
      id: typeof project.id === "string" ? project.id : "",
      name: typeof project.name === "string" ? project.name : "",
    },
    auth: {
      required,
      providers,
      ...(sso ? { sso } : {}),
    },
  };
}

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });

/**
 * Fetch `GET {baseUrl}/config`.
 *
 * - `200` → `{ status: "ok", config }` (normalized, fail-safe).
 * - `404` → `{ status: "not-platform" }` (route not mounted → legacy fallback).
 * - `503` / network error → retried with exponential backoff; after the retry
 *   budget is exhausted resolves to `{ status: "unavailable" }`.
 *
 * Aborts (via `signal`) reject so callers can distinguish teardown from a real
 * failure.
 */
export async function fetchProjectConfig({
  baseUrl = "/api",
  retries = 3,
  retryDelayMs = 300,
  fetch: fetchFn = fetch,
  signal,
}: FetchProjectConfigOptions = {}): Promise<ConfigResult> {
  const url = `${baseUrl}/config`;

  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetchFn(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal,
      });

      if (res.status === 404) {
        return { status: "not-platform" };
      }

      if (res.ok) {
        const raw = await res.json();
        return { status: "ok", config: normalizeProjectConfig(raw) };
      }

      // 503 (config_unavailable) or any other transient failure → retry.
      if (attempt >= retries) {
        return { status: "unavailable" };
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") throw err;
      if (attempt >= retries) {
        return { status: "unavailable" };
      }
    }

    await sleep(retryDelayMs * 2 ** attempt, signal);
  }
}
