import { describe, it, expect, beforeEach, mock } from "bun:test";
import {
  getAccessToken,
  getRefreshToken,
  clearTokens,
  authFetch,
  refreshAccessToken,
} from "./tokens";

beforeEach(() => {
  clearTokens();
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------

describe("getAccessToken", () => {
  it("returns null when nothing is stored", () => {
    expect(getAccessToken()).toBeNull();
  });

  it("returns the stored access token", () => {
    localStorage.setItem("timbal_project_access_token", "abc123");
    expect(getAccessToken()).toBe("abc123");
  });
});

describe("getRefreshToken", () => {
  it("returns null when nothing is stored", () => {
    expect(getRefreshToken()).toBeNull();
  });

  it("returns the stored refresh token", () => {
    localStorage.setItem("timbal_project_refresh_token", "refresh123");
    expect(getRefreshToken()).toBe("refresh123");
  });
});

describe("clearTokens", () => {
  it("removes both tokens from localStorage", () => {
    localStorage.setItem("timbal_project_access_token", "abc");
    localStorage.setItem("timbal_project_refresh_token", "xyz");
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// authFetch — token injection
// ---------------------------------------------------------------------------

describe("authFetch", () => {
  it("makes the request without Authorization header when no token is stored", async () => {
    let capturedHeaders: HeadersInit | undefined;
    globalThis.fetch = mock(async (_url: string | URL | Request, opts?: RequestInit) => {
      capturedHeaders = opts?.headers;
      return new Response("{}", { status: 200 });
    });

    await authFetch("/api/test");

    expect(capturedHeaders).not.toHaveProperty("Authorization");
  });

  it("attaches Bearer token when access token is stored", async () => {
    localStorage.setItem("timbal_project_access_token", "mytoken");

    let capturedHeaders: Record<string, string> = {};
    globalThis.fetch = mock(async (_url: string | URL | Request, opts?: RequestInit) => {
      capturedHeaders = opts?.headers as Record<string, string>;
      return new Response("{}", { status: 200 });
    });

    await authFetch("/api/test");

    expect(capturedHeaders["Authorization"]).toBe("Bearer mytoken");
  });

  it("retries with new token after a 401 + successful refresh", async () => {
    localStorage.setItem("timbal_project_access_token", "old");
    localStorage.setItem("timbal_project_refresh_token", "refresh");

    let callCount = 0;
    globalThis.fetch = mock(async (url: string | URL | Request) => {
      callCount++;
      if (typeof url === "string" && url.includes("/auth/refresh")) {
        return new Response(JSON.stringify({ access_token: "new" }), { status: 200 });
      }
      // First call returns 401, second (retry) returns 200
      return new Response("{}", { status: callCount === 1 ? 401 : 200 });
    });

    const res = await authFetch("/api/protected");

    expect(res.status).toBe(200);
    expect(getAccessToken()).toBe("new");
  });

  it("clears tokens and returns 401 response when refresh fails", async () => {
    localStorage.setItem("timbal_project_access_token", "old");
    localStorage.setItem("timbal_project_refresh_token", "bad-refresh");

    globalThis.fetch = mock(async (url: string | URL | Request) => {
      if (typeof url === "string" && url.includes("/auth/refresh")) {
        return new Response("Unauthorized", { status: 401 });
      }
      return new Response("{}", { status: 401 });
    });

    await authFetch("/api/protected");

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// refreshAccessToken
// ---------------------------------------------------------------------------

describe("refreshAccessToken", () => {
  it("deduplicates concurrent calls — only one network request is made", async () => {
    localStorage.setItem("timbal_project_refresh_token", "refresh");

    let callCount = 0;
    globalThis.fetch = mock(async () => {
      callCount++;
      return new Response(JSON.stringify({ access_token: "fresh" }), { status: 200 });
    });

    await Promise.all([refreshAccessToken(), refreshAccessToken(), refreshAccessToken()]);

    expect(callCount).toBe(1);
    expect(getAccessToken()).toBe("fresh");
  });

  it("returns false when no refresh token is stored", async () => {
    const result = await refreshAccessToken();
    expect(result).toBe(false);
  });

  it("stores the new access token on success", async () => {
    localStorage.setItem("timbal_project_refresh_token", "refresh");

    globalThis.fetch = mock(async () =>
      new Response(JSON.stringify({ access_token: "fresh" }), { status: 200 }),
    );

    const result = await refreshAccessToken();
    expect(result).toBe(true);
    expect(getAccessToken()).toBe("fresh");
  });

  it("clears tokens and returns false when the refresh endpoint fails", async () => {
    localStorage.setItem("timbal_project_access_token", "old");
    localStorage.setItem("timbal_project_refresh_token", "bad");

    globalThis.fetch = mock(async () => new Response("fail", { status: 401 }));

    const result = await refreshAccessToken();
    expect(result).toBe(false);
    expect(getAccessToken()).toBeNull();
  });
});
