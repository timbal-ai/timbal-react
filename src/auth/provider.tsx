/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Session } from "@timbal-ai/timbal-sdk";
import {
  getRefreshToken,
  clearTokens,
  setAccessToken,
  setRefreshToken,
  fetchCurrentUser,
  refreshAccessToken,
} from "./tokens";

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

interface SessionContextType {
  user: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmbedded: boolean;
  logout: () => void;
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
}

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
  enabled = true,
}) => {
  const [user, setUser] = useState<Session | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [embedded] = useState(isInsideIframe);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let ignore = false;

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

      if (!ignore && !embedded) {
        setLoading(false);
      }
    };

    restoreSession();

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
  }, [enabled, embedded]);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    const returnTo = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    fetch("/api/auth/logout", { method: "POST" }).finally(
      () => (window.location.href = `/api/auth/login?return_to=${returnTo}`),
    );
  }, []);

  return (
    <SessionContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isEmbedded: embedded,
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
