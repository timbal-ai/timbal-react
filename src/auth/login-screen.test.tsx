import { describe, it, expect, mock, afterEach } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TimbalLoginScreen } from "./login-screen";

afterEach(() => {
  // Restore any fetch mock between tests.
  // @ts-expect-error — reset to undefined so happy-dom's default is used.
  globalThis.fetch = undefined;
});

describe("TimbalLoginScreen", () => {
  it("renders exactly the configured OAuth providers", () => {
    render(<TimbalLoginScreen providers={["google", "github"]} />);

    expect(screen.getByRole("link", { name: /Continue with Google/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Continue with GitHub/i })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Microsoft/i })).toBeNull();
  });

  it("points OAuth links at {baseUrl}/auth/{provider} with redirect_uri", () => {
    render(
      <TimbalLoginScreen
        providers={["google"]}
        baseUrl="/api"
        redirectUri="/dashboard"
      />,
    );

    const link = screen.getByRole("link", { name: /Continue with Google/i });
    expect(link.getAttribute("href")).toBe(
      "/api/auth/google?redirect_uri=%2Fdashboard",
    );
  });

  it("renders the magic-link form only when email is enabled", () => {
    const { rerender } = render(<TimbalLoginScreen providers={["github"]} />);
    expect(screen.queryByLabelText(/Email address/i)).toBeNull();

    rerender(<TimbalLoginScreen providers={["email"]} />);
    expect(screen.getByLabelText(/Email address/i)).toBeTruthy();
  });

  it("posts to {baseUrl}/auth/magic-link and shows confirmation", async () => {
    let postedUrl = "";
    let postedBody = "";
    globalThis.fetch = mock(async (url: string, opts?: RequestInit) => {
      postedUrl = url;
      postedBody = (opts?.body as string) ?? "";
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;

    render(<TimbalLoginScreen providers={["email"]} baseUrl="/api" />);

    await userEvent.type(screen.getByLabelText(/Email address/i), "a@b.com");
    await userEvent.click(
      screen.getByRole("button", { name: /Email me a sign-in link/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/Check your email/i)).toBeTruthy();
    });
    expect(postedUrl).toBe("/api/auth/magic-link");
    expect(JSON.parse(postedBody)).toEqual({ email: "a@b.com" });
  });

  it("surfaces an error when the magic-link request fails", async () => {
    globalThis.fetch = mock(async () => new Response("bad", { status: 400 })) as unknown as typeof fetch;

    render(<TimbalLoginScreen providers={["email"]} />);

    await userEvent.type(screen.getByLabelText(/Email address/i), "a@b.com");
    await userEvent.click(
      screen.getByRole("button", { name: /Email me a sign-in link/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/Couldn't send the link/i)).toBeTruthy();
    });
  });

  it("shows a disabled SSO affordance only when ssoEnabled", () => {
    const { rerender } = render(
      <TimbalLoginScreen providers={["email"]} ssoEnabled={false} />,
    );
    expect(screen.queryByRole("button", { name: /Single sign-on/i })).toBeNull();

    rerender(<TimbalLoginScreen providers={["email"]} ssoEnabled />);
    const sso = screen.getByRole("button", { name: /Single sign-on/i });
    expect(sso.hasAttribute("disabled")).toBe(true);
  });

  it("renders an empty-state when no methods are available", () => {
    render(<TimbalLoginScreen providers={[]} ssoEnabled={false} />);
    expect(screen.getByText(/No sign-in methods are available/i)).toBeTruthy();
  });
});
