/**
 * Copilot contract. The copilot is a self-contained drop-in: it owns its own
 * open/expand state, exposes `useCopilot()` for custom triggers, and never needs
 * `AppShell`. These tests lock that behavior (state machine + hook) without
 * mounting the WebGL trigger glyph / live runtime.
 */
import { act } from "react";
import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AppCopilot, CopilotProvider } from "./app-copilot";
import { CopilotOverlay } from "./copilot-overlay";
import { useCopilot } from "./context";

function TriggerProbe() {
  const controls = useCopilot();
  return (
    <button type="button" onClick={() => controls?.setOpen(!controls.open)}>
      {controls ? (controls.open ? "open" : "closed") : "no-provider"}
    </button>
  );
}

describe("useCopilot", () => {
  it("returns null with no provider (so optional triggers no-op safely)", () => {
    render(<TriggerProbe />);
    expect(screen.getByRole("button").textContent).toBe("no-provider");
  });

  it("CopilotProvider shares open/expand state with custom triggers", () => {
    render(
      <CopilotProvider>
        <TriggerProbe />
      </CopilotProvider>,
    );
    const btn = screen.getByRole("button");
    expect(btn.textContent).toBe("closed");
    act(() => {
      fireEvent.click(btn);
    });
    expect(btn.textContent).toBe("open");
  });
});

describe("AppCopilot", () => {
  it("mounts as a body portal and renders no chrome when closed + hideTrigger", () => {
    const { container } = render(
      <AppCopilot workforceId="test" hideTrigger defaultOpen={false} />,
    );
    // Self-mounting portal: nothing lands in the component's own subtree.
    expect(container.childElementCount).toBe(0);
    // Closed + hideTrigger → no dialog and no floating trigger pill.
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector(".aui-app-shell-chat-trigger-fixed")).toBeNull();
  });

  it("opens when the built-in trigger is clicked", async () => {
    render(
      <CopilotProvider>
        <CopilotOverlay triggerLabel="Concierge">
          <div data-testid="panel-body">panel</div>
        </CopilotOverlay>
      </CopilotProvider>,
    );

    await waitFor(() => {
      expect(document.querySelector(".aui-app-shell-chat-trigger-fixed")).not.toBeNull();
    });

    act(() => {
      fireEvent.click(document.querySelector(".aui-app-shell-chat-trigger-fixed")!);
    });

    await waitFor(() => {
      expect(screen.getByTestId("panel-body")).toBeTruthy();
    });
  });

  it("renders the real panel on open without a missing TooltipProvider crash", async () => {
    render(<AppCopilot workforceId="test" triggerLabel="Concierge" fetch={async () => new Response("{}", { status: 200 })} />);

    await waitFor(() => {
      expect(document.querySelector(".aui-app-shell-chat-trigger-fixed")).not.toBeNull();
    });

    act(() => {
      fireEvent.click(document.querySelector(".aui-app-shell-chat-trigger-fixed")!);
    });

    expect(await screen.findByRole("dialog", { name: "Concierge" })).toBeTruthy();
  });
});
