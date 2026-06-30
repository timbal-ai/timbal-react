"use client";

import React, { useState } from "react";
import { Github, Mail, Loader2 } from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "../utils";
import { useOptionalSession } from "./provider";
import { getAuthBaseUrl } from "./tokens";
import type { AuthProvider } from "./config";

type OAuthProvider = Exclude<AuthProvider, "email">;

const OAUTH_PROVIDERS: readonly OAuthProvider[] = ["google", "microsoft", "github"];

const isOAuthProvider = (p: AuthProvider): p is OAuthProvider =>
  (OAUTH_PROVIDERS as readonly string[]).includes(p);

const OAUTH_LABELS: Record<OAuthProvider, string> = {
  google: "Continue with Google",
  microsoft: "Continue with Microsoft",
  github: "Continue with GitHub",
};

const OAUTH_ICONS: Record<OAuthProvider, React.ReactNode> = {
  google: <GoogleGlyph className="size-4" />,
  microsoft: <MicrosoftGlyph className="size-4" />,
  github: <Github className="size-4" />,
};

export interface TimbalLoginScreenProps {
  /**
   * Login methods to render. Defaults to the server-driven `authProviders`
   * from the surrounding `SessionProvider`. Only the methods in this list are
   * rendered — the server rejects disabled methods with 400 regardless.
   */
  providers?: AuthProvider[];
  /** Whether to surface the SSO affordance. Defaults to the session's `ssoEnabled`. */
  ssoEnabled?: boolean;
  /** Base path for auth routes. Defaults to the configured auth base (`/api`). */
  baseUrl?: string;
  /** Where the user should land after login (passed as `?redirect_uri=`). */
  redirectUri?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  /** Called after a magic link has been successfully requested. */
  onMagicLinkSent?: (email: string) => void;
}

type MagicLinkStatus = "idle" | "sending" | "sent" | "error";

/**
 * Data-driven login screen. Renders exactly the providers reported by
 * `GET /config` (via `SessionProvider`): OAuth providers become redirect
 * buttons to `{baseUrl}/auth/{provider}`, and `email` renders a magic-link
 * form that POSTs to `{baseUrl}/auth/magic-link`.
 *
 * Pass `<TimbalLoginScreen />` to `AuthGuard`'s `renderLogin` prop, or render
 * it directly on a custom login route.
 */
export const TimbalLoginScreen: React.FC<TimbalLoginScreenProps> = ({
  providers,
  ssoEnabled,
  baseUrl,
  redirectUri,
  title = "Sign in",
  description = "Choose how you'd like to continue.",
  className,
  onMagicLinkSent,
}) => {
  const session = useOptionalSession();
  const resolvedProviders = providers ?? session?.authProviders ?? [];
  const resolvedSso = ssoEnabled ?? session?.ssoEnabled ?? false;
  const base = baseUrl ?? getAuthBaseUrl();

  const oauthProviders = resolvedProviders.filter(isOAuthProvider);
  const hasEmail = resolvedProviders.includes("email");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<MagicLinkStatus>("idle");

  const oauthHref = (provider: OAuthProvider): string => {
    const url = `${base}/auth/${provider}`;
    return redirectUri
      ? `${url}?redirect_uri=${encodeURIComponent(redirectUri)}`
      : url;
  };

  const handleMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch(`${base}/auth/magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("sent");
      onMagicLinkSent?.(email);
    } catch {
      setStatus("error");
    }
  };

  const hasAnyMethod = oauthProviders.length > 0 || hasEmail || resolvedSso;

  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center bg-background p-6",
        className,
      )}
    >
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="space-y-1.5 text-center">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>

        {!hasAnyMethod ? (
          <p className="text-center text-sm text-muted-foreground">
            No sign-in methods are available for this project.
          </p>
        ) : null}

        {oauthProviders.length > 0 ? (
          <div className="space-y-2.5">
            {oauthProviders.map((provider) => (
              <Button
                key={provider}
                asChild
                color="secondary"
                size="lg"
                className="w-full justify-center"
              >
                <a href={oauthHref(provider)}>
                  {OAUTH_ICONS[provider]}
                  {OAUTH_LABELS[provider]}
                </a>
              </Button>
            ))}
          </div>
        ) : null}

        {oauthProviders.length > 0 && hasEmail ? (
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              or
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
        ) : null}

        {hasEmail ? (
          status === "sent" ? (
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-center text-sm text-foreground">
              <Mail className="mx-auto mb-2 size-5 text-muted-foreground" />
              Check your email for a sign-in link.
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-2.5">
              <Input
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                aria-label="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
              />
              <Button
                type="submit"
                size="lg"
                className="w-full justify-center"
                isLoading={status === "sending"}
                iconLeading={
                  status === "sending" ? undefined : <Mail className="size-4" />
                }
              >
                Email me a sign-in link
              </Button>
              {status === "error" ? (
                <p className="text-center text-xs text-destructive">
                  Couldn't send the link. Check the address and try again.
                </p>
              ) : null}
            </form>
          )
        ) : null}

        {resolvedSso ? (
          <div className="space-y-2.5">
            {(oauthProviders.length > 0 || hasEmail) ? (
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  or
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
            ) : null}
            <Button
              type="button"
              color="secondary"
              size="lg"
              className="w-full justify-center"
              disabled
              iconLeading={<Loader2 className="size-4" />}
            >
              Single sign-on (coming soon)
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// Minimal brand glyphs (lucide has no Google/Microsoft marks). Kept inline so
// the login screen owns its visuals without a brand-icon dependency.

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function MicrosoftGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
      <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
      <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
      <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
    </svg>
  );
}
