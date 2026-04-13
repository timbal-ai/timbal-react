import type { Session } from "@timbal-ai/timbal-sdk";

const ACCESS_TOKEN_KEY = "timbal_project_access_token";
const REFRESH_TOKEN_KEY = "timbal_project_refresh_token";

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
      const res = await fetch("/api/auth/refresh", {
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
    const res = await fetch("/api/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};
