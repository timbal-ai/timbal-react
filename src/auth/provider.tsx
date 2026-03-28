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
  fetchCurrentUser,
  refreshAccessToken,
} from "./tokens";

// ============================================
// Session Context
// ============================================

interface SessionContextType {
  user: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
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

      setLoading(false);
    };

    restoreSession();

    return () => {
      ignore = true;
    };
  }, [enabled]);

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
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
