import React from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "./provider";
import { getAuthBaseUrl } from "./tokens";

interface AuthGuardProps {
  children: React.ReactNode;
  /**
   * Force the login gate even in legacy mode. In platform mode the gate is
   * driven by the project's `auth.required` flag, so this is usually
   * unnecessary. Default: false.
   */
  requireAuth?: boolean;
  /** When false, renders children unconditionally. Default: true */
  enabled?: boolean;
  /**
   * Optional custom login UI rendered in place of the default redirect to the
   * server login page (e.g. `<TimbalLoginScreen />`). Only shown when the
   * project requires auth and no user is signed in.
   */
  renderLogin?: React.ReactNode;
}

const FullScreenSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader2 className="w-8 h-8 animate-spin" />
  </div>
);

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = false,
  enabled = true,
  renderLogin,
}) => {
  const {
    isAuthenticated,
    loading,
    isEmbedded,
    configStatus,
    authRequired,
    isOpenProject,
  } = useSession();

  if (!enabled) {
    return children;
  }

  // Platform unreachable after retries — never fall open or closed. Render
  // neither the app nor login until the config resolves.
  if (configStatus === "unavailable") {
    return <FullScreenSpinner />;
  }

  if (loading) {
    return <FullScreenSpinner />;
  }

  // Open project: no login at all, ever.
  if (isOpenProject) {
    return children;
  }

  const mustAuthenticate = authRequired || requireAuth;
  if (mustAuthenticate && !isAuthenticated && !isEmbedded) {
    if (renderLogin !== undefined) {
      return <>{renderLogin}</>;
    }
    const returnTo = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    window.location.href = `${getAuthBaseUrl()}/auth/login?return_to=${returnTo}`;
    return null;
  }

  return children;
};
