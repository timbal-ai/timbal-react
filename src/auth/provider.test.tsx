import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";

import { SessionProvider, useSession } from "./provider";
import { clearTokens, setAuthBaseUrl } from "./tokens";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function Probe() {
  const s = useSession();
  return (
    <div>
      <span data-testid="status">{s.configStatus}</span>
      <span data-testid="loading">{String(s.loading)}</span>
      <span data-testid="open">{String(s.isOpenProject)}</span>
      <span data-testid="required">{String(s.authRequired)}</span>
      <span data-testid="authed">{String(s.isAuthenticated)}</span>
      <span data-testid="providers">{s.authProviders.join(",")}</span>
      <span data-testid="sso">{String(s.ssoEnabled)}</span>
    </div>
  );
}

const renderProvider = () =>
  render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );

beforeEach(() => {
  clearTokens();
  localStorage.clear();
  setAuthBaseUrl("/api");
});

afterEach(() => {
  // @ts-expect-error — clear mock between tests.
  globalThis.fetch = undefined;
});

describe("SessionProvider config branching", () => {
  it("open project: renders without restoring a session", async () => {
    let meCalled = false;
    globalThis.fetch = mock(async (url: string) => {
      if (url.endsWith("/config")) {
        return json({
          project: { id: "1", name: "Open" },
          auth: { required: false, providers: [] },
        });
      }
      if (url.endsWith("/me")) meCalled = true;
      return json({});
    }) as unknown as typeof fetch;

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("ok");
    });
    expect(screen.getByTestId("open").textContent).toBe("true");
    expect(screen.getByTestId("required").textContent).toBe("false");
    expect(screen.getByTestId("loading").textContent).toBe("false");
    expect(meCalled).toBe(false);
  });

  it("authenticated project: restores the session via /me", async () => {
    globalThis.fetch = mock(async (url: string) => {
      if (url.endsWith("/config")) {
        return json({
          project: { id: "2", name: "Auth" },
          auth: { required: true, providers: ["email", "google"], sso: { enabled: true } },
        });
      }
      if (url.endsWith("/me")) {
        return json({ user_id: "u1", user_name: "A", user_email: "a@b.com" });
      }
      return json({});
    }) as unknown as typeof fetch;

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("authed").textContent).toBe("true");
    });
    expect(screen.getByTestId("status").textContent).toBe("ok");
    expect(screen.getByTestId("required").textContent).toBe("true");
    expect(screen.getByTestId("open").textContent).toBe("false");
    expect(screen.getByTestId("providers").textContent).toBe("email,google");
    expect(screen.getByTestId("sso").textContent).toBe("true");
  });

  it("legacy mode (404): restores session and reports not-platform", async () => {
    globalThis.fetch = mock(async (url: string) => {
      if (url.endsWith("/config")) return new Response("", { status: 404 });
      if (url.endsWith("/me")) {
        return json({ user_id: "u1", user_name: "A", user_email: "a@b.com" });
      }
      return json({});
    }) as unknown as typeof fetch;

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("not-platform");
    });
    expect(screen.getByTestId("authed").textContent).toBe("true");
    // Legacy assumes login exists.
    expect(screen.getByTestId("required").textContent).toBe("true");
    expect(screen.getByTestId("open").textContent).toBe("false");
  });

  it("unavailable (503): stays loading and does not fall open", async () => {
    globalThis.fetch = mock(async (url: string) => {
      if (url.endsWith("/config")) return json({ error: "config_unavailable" }, 503);
      return json({});
    }) as unknown as typeof fetch;

    renderProvider();

    await waitFor(
      () => {
        expect(screen.getByTestId("status").textContent).toBe("unavailable");
      },
      { timeout: 5000 },
    );
    expect(screen.getByTestId("open").textContent).toBe("false");
    expect(screen.getByTestId("required").textContent).toBe("true");
    expect(screen.getByTestId("loading").textContent).toBe("true");
  }, 10000);
});
