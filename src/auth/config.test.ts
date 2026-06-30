import { describe, it, expect, mock } from "bun:test";
import {
  fetchProjectConfig,
  normalizeProjectConfig,
  type AuthProvider,
} from "./config";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("normalizeProjectConfig", () => {
  it("passes through a well-formed payload", () => {
    const cfg = normalizeProjectConfig({
      project: { id: "248", name: "My Project" },
      auth: { required: true, providers: ["email", "google"], sso: { enabled: true } },
    });
    expect(cfg.project).toEqual({ id: "248", name: "My Project" });
    expect(cfg.auth.required).toBe(true);
    expect(cfg.auth.providers).toEqual(["email", "google"]);
    expect(cfg.auth.sso).toEqual({ enabled: true });
  });

  it("fails safe to required=true when auth.required is missing", () => {
    const cfg = normalizeProjectConfig({ project: {}, auth: { providers: [] } });
    expect(cfg.auth.required).toBe(true);
  });

  it("fails safe to required=true on a malformed payload", () => {
    expect(normalizeProjectConfig(null).auth.required).toBe(true);
    expect(normalizeProjectConfig({}).auth.required).toBe(true);
  });

  it("drops unknown providers", () => {
    const cfg = normalizeProjectConfig({
      auth: { required: true, providers: ["email", "bogus", "github"] as AuthProvider[] },
    });
    expect(cfg.auth.providers).toEqual(["email", "github"]);
  });

  it("omits sso when not present", () => {
    const cfg = normalizeProjectConfig({ auth: { required: false, providers: [] } });
    expect(cfg.auth.sso).toBeUndefined();
  });
});

describe("fetchProjectConfig", () => {
  it("returns ok with a normalized config on 200", async () => {
    const fetchFn = mock(async () =>
      json({ project: { id: "1", name: "P" }, auth: { required: false, providers: [] } }),
    );

    const result = await fetchProjectConfig({ fetch: fetchFn as unknown as typeof fetch });

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.config.auth.required).toBe(false);
      expect(result.config.project.name).toBe("P");
    }
  });

  it("calls {baseUrl}/config", async () => {
    let calledUrl = "";
    const fetchFn = mock(async (url: string) => {
      calledUrl = url;
      return json({ auth: { required: true, providers: [] } });
    });

    await fetchProjectConfig({
      baseUrl: "/custom",
      fetch: fetchFn as unknown as typeof fetch,
    });

    expect(calledUrl).toBe("/custom/config");
  });

  it("returns not-platform on 404", async () => {
    const fetchFn = mock(async () => new Response("", { status: 404 }));
    const result = await fetchProjectConfig({ fetch: fetchFn as unknown as typeof fetch });
    expect(result.status).toBe("not-platform");
  });

  it("retries on 503 and returns unavailable after the budget is exhausted", async () => {
    let calls = 0;
    const fetchFn = mock(async () => {
      calls++;
      return json({ error: "config_unavailable" }, 503);
    });

    const result = await fetchProjectConfig({
      retries: 2,
      retryDelayMs: 1,
      fetch: fetchFn as unknown as typeof fetch,
    });

    expect(result.status).toBe("unavailable");
    expect(calls).toBe(3); // initial + 2 retries
  });

  it("recovers when a 503 is followed by a 200", async () => {
    let calls = 0;
    const fetchFn = mock(async () => {
      calls++;
      if (calls === 1) return json({ error: "config_unavailable" }, 503);
      return json({ auth: { required: true, providers: ["email"] } });
    });

    const result = await fetchProjectConfig({
      retries: 3,
      retryDelayMs: 1,
      fetch: fetchFn as unknown as typeof fetch,
    });

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.config.auth.providers).toEqual(["email"]);
    }
  });

  it("retries on network error then returns unavailable", async () => {
    const fetchFn = mock(async () => {
      throw new Error("network down");
    });

    const result = await fetchProjectConfig({
      retries: 1,
      retryDelayMs: 1,
      fetch: fetchFn as unknown as typeof fetch,
    });

    expect(result.status).toBe("unavailable");
  });
});
