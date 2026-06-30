import type { Session } from "@timbal-ai/timbal-sdk";

const ACCESS_TOKEN_KEY = "timbal_project_access_token";
const REFRESH_TOKEN_KEY = "timbal_project_refresh_token";

// ============================================
// Configurable base path
// ============================================
//
// All auth + identity routes (`/auth/*`, `/me`, `/config`) hang off a single
// base path. Defaults to `/api` to preserve historical behavior; the host app
// can override it once (e.g. from `SessionProvider`) so every helper stays in
// sync without threading the value through each call site.

const DEFAULT_AUTH_BASE_URL = "/api";

let authBaseUrl = DEFAULT_AUTH_BASE_URL;

const stripTrailingSlash = (url: string): string =>
  url.endsWith("/") ? url.slice(0, -1) : url;

/** Set the base path used to build `/auth/*` and `/me` URLs. Default `/api`. */
export const setAuthBaseUrl = (url: string): void => {
  authBaseUrl = stripTrailingSlash(url || DEFAULT_AUTH_BASE_URL);
};

/** Read the base path currently used for auth + identity routes. */
export const getAuthBaseUrl = (): string => authBaseUrl;

// ============================================
// Token storage (all in localStorage)
// ============================================

export const getAccessToken = (): string | null =>
  localStorage.getItem(ACCESS_TOKEN_KEY);

export const setAccessToken = (token: string): void =>
  localStorage.setItem(ACCESS_TOKEN_KEY, token);

export const getRefreshToken = (): string | null =>
  localStorage.getItem(REFRESH_TOKEN_KEY);

export const setRefreshToken = (token: string): void =>
  localStorage.setItem(REFRESH_TOKEN_KEY, token);

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// ============================================
// Token refresh
// ============================================

let refreshPromise: Promise<boolean> | null = null;

export const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${authBaseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        clearTokens();
        return false;
      }

      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
      }
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// ============================================
// Authenticated fetch wrapper
// Attaches Bearer token, auto-refreshes on 401
// ============================================

export const authFetch = async (
  url: string,
  options?: RequestInit,
): Promise<Response> => {
  const token = getAccessToken();
  let res = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = getAccessToken();
      res = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
        },
      });
    }
  }

  return res;
};

// ============================================
// API helpers
// ============================================

export const fetchCurrentUser = async (): Promise<Session | null> => {
  try {
    const token = getAccessToken();
    const res = await fetch(`${authBaseUrl}/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};
