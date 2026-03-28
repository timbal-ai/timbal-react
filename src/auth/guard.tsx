import React from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "./provider";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  /** When false, renders children unconditionally. Default: true */
  enabled?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = false,
  enabled = true,
}) => {
  const { isAuthenticated, loading } = useSession();

  if (!enabled) {
    return children;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    const returnTo = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    window.location.href = `/api/auth/login?return_to=${returnTo}`;
    return null;
  }

  return children;
};
