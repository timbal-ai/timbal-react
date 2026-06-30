/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@timbal-ai/timbal-sdk";
import {
  getRefreshToken,
  clearTokens,
  setAccessToken,
  setRefreshToken,
  setAuthBaseUrl,
  fetchCurrentUser,
  refreshAccessToken,
} from "./tokens";
import {
  fetchProjectConfig,
  type AuthProvider,
  type ConfigResult,
  type ProjectConfig,
} from "./config";

// ============================================
// Iframe detection
// ============================================

function isInsideIframe(): boolean {
  try {
    return typeof window !== "undefined" && window.self !== window.top;
  } catch {
    return true;
  }
}

// ============================================
// Session Context
// ============================================

/**
 * Resolution state of the `GET {baseUrl}/config` call:
 * - `loading` — request in flight (or not yet started).
 * - `ok` — platform mode; `config` is populated.
 * - `not-platform` — `/config` 404'd; the app runs in legacy mode.
 * - `unavailable` — platform unreachable after retries; do NOT assume open or
 *   authenticated. Render neither the app nor login until it resolves.
 */
export type ConfigStatus = "loading" | "ok" | "not-platform" | "unavailable";

interface SessionContextType {
  user: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmbedded: boolean;
  logout: () => void;
  /** Normalized `/config` payload, or `null` outside platform mode. */
  config: ProjectConfig | null;
  /** Resolution state of the config fetch. */
  configStatus: ConfigStatus;
  /** Whether end users must log in. Fail-safe `true` until proven otherwise. */
  authRequired: boolean;
  /** The only login methods that should be rendered (server-driven). */
  authProviders: AuthProvider[];
  /** Whether SSO connections exist (no details exposed). */
  ssoEnabled: boolean;
  /** `true` only when config loaded and `auth.required === false`. */
  isOpenProject: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

/**
 * Read the session without throwing when no `SessionProvider` is present.
 * Returns `null` when auth is not wired into the tree — useful for surfaces
 * (e.g. sidebar footers) that should gracefully render without auth.
 */
export const useOptionalSession = (): SessionContextType | null => {
  const context = useContext(SessionContext);
  return context ?? null;
};

// ============================================
// Session Provider
// ============================================

interface SessionProviderProps {
  children: React.ReactNode;
  /** When false, session is always null and loading is false. Default: true */
  enabled?: boolean;
  /**
   * Base path the config + auth routes are mounted under. Default `/api`
   * (so `/config` → `/api/config`, `/auth/login` → `/api/auth/login`). Also
   * applied to {@link setAuthBaseUrl} so token helpers stay in sync.
   */
  baseUrl?: string;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
  enabled = true,
  baseUrl = "/api",
}) => {
  const [user, setUser] = useState<Session | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [embedded] = useState(isInsideIframe);
  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [configStatus, setConfigStatus] = useState<ConfigStatus>(
    enabled ? "loading" : "not-platform",
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setConfigStatus("not-platform");
      return;
    }

    let ignore = false;
    setAuthBaseUrl(baseUrl);

    // Restore an existing session from cookie / stored tokens. Used in both
    // legacy mode (no `/config`) and authenticated platform projects.
    const restoreSession = async () => {
      try {
        const u = await fetchCurrentUser();
        if (ignore) return;
        if (u) {
          setUser(u);
          setLoading(false);
          return;
        }

        if (getRefreshToken()) {
          const ok = await refreshAccessToken();
          if (ignore) return;
          if (ok) {
            const refreshedUser = await fetchCurrentUser();
            if (ignore) return;
            if (refreshedUser) {
              setUser(refreshedUser);
              setLoading(false);
              return;
            }
          }
        }
      } catch {
        if (ignore) return;
        clearTokens();
      }

      // When embedded, keep loading until the parent injects credentials.
      if (!ignore && !embedded) {
        setLoading(false);
      }
    };

    const resolve = async () => {
      let result: ConfigResult;
      try {
        result = await fetchProjectConfig({ baseUrl });
      } catch {
        // Aborted during teardown — leave state untouched.
        return;
      }
      if (ignore) return;

      if (result.status === "ok") {
        setConfig(result.config);
        setConfigStatus("ok");
        if (!result.config.auth.required) {
          // Open project: no login, no session restore. Just render.
          setLoading(false);
          return;
        }
        await restoreSession();
        return;
      }

      if (result.status === "not-platform") {
        // Legacy mode: behave exactly as before (login assumed to exist).
        setConfigStatus("not-platform");
        await restoreSession();
        return;
      }

      // Platform unreachable after retries. Do NOT fall open or closed —
      // leave `loading` true so the guard renders neither app nor login.
      setConfigStatus("unavailable");
    };

    resolve();

    // When embedded in an iframe, listen for parent-injected credentials.
    // The parent sends { type: "timbal:auth", token, refreshToken? }.
    let messageCleanup: (() => void) | undefined;
    if (embedded) {
      const handleMessage = async (event: MessageEvent) => {
        if (ignore) return;
        if (event.data?.type !== "timbal:auth" || !event.data.token) return;

        setAccessToken(event.data.token);
        if (event.data.refreshToken) {
          setRefreshToken(event.data.refreshToken);
        }

        const u = await fetchCurrentUser();
        if (!ignore) {
          setUser(u);
          setLoading(false);
        }
      };
      window.addEventListener("message", handleMessage);
      window.parent.postMessage({ type: "timbal:request-session" }, "*");

      messageCleanup = () => window.removeEventListener("message", handleMessage);
    }

    return () => {
      ignore = true;
      messageCleanup?.();
    };
  }, [enabled, embedded, baseUrl]);

  // Derived auth-mode answers. Fail-safe: anything other than a confirmed open
  // project requires login (a malformed/unavailable config never opens access).
  const isOpenProject =
    configStatus === "ok" && config?.auth.required === false;
  const authRequired = enabled ? !isOpenProject : false;

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    // Open projects have no login page to return to — just clear local state.
    if (!authRequired) return;
    const returnTo = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    fetch(`${baseUrl}/auth/logout`, { method: "POST" }).finally(
      () => (window.location.href = `${baseUrl}/auth/login?return_to=${returnTo}`),
    );
  }, [authRequired, baseUrl]);

  const value = useMemo<SessionContextType>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isEmbedded: embedded,
      logout,
      config,
      configStatus,
      authRequired,
      authProviders: config?.auth.providers ?? [],
      ssoEnabled: config?.auth.sso?.enabled ?? false,
      isOpenProject,
    }),
    [
      user,
      loading,
      embedded,
      logout,
      config,
      configStatus,
      authRequired,
      isOpenProject,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};
